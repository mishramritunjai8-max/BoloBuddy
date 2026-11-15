import { GoogleGenAI } from '@google/genai';
import {
  SERVER_CONFIG,
  SUPPORTED_LANGUAGES,
  isGeminiKeyConfigured,
  type SupportedLanguageId,
} from './config.ts';

export interface UncertaintyCheckResult {
  needsClarification: boolean;
  reasons: string[];
  checkMethod: 'heuristic';
  note: string;
}

export interface TranscriptionResult {
  transcript: string;
  detectedLanguage: string;
  uncertainty: UncertaintyCheckResult;
  modelUsed: string;
}

export class ApiServiceError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function getAiClient(): GoogleGenAI {
  if (!isGeminiKeyConfigured()) {
    throw new ApiServiceError(
      503,
      'MISSING_API_KEY',
      'GEMINI_API_KEY is not configured on the server. Please add your key in .env.'
    );
  }

  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'bolobuddy-audio',
      },
    },
  });
}

export function mapGeminiError(err: unknown, fallbackMessage: string): ApiServiceError {
  if (err instanceof ApiServiceError) {
    return err;
  }

  const rawMsg =
    err instanceof Error ? err.message : typeof err === 'string' ? err : '';
  const lower = rawMsg.toLowerCase();

  if (
    lower.includes('api_key_invalid') ||
    lower.includes('api key not valid') ||
    lower.includes('permission_denied') ||
    lower.includes('403') ||
    lower.includes('unauthorized')
  ) {
    return new ApiServiceError(
      401,
      'INVALID_API_KEY',
      'The speech recognition API key could not be authenticated.'
    );
  }

  if (
    lower.includes('resource_exhausted') ||
    lower.includes('quota') ||
    lower.includes('429') ||
    lower.includes('rate limit')
  ) {
    return new ApiServiceError(
      429,
      'QUOTA_EXHAUSTED',
      'Transcription free-tier quota is temporarily full. Please wait a moment.'
    );
  }

  if (
    lower.includes('model_not_found') ||
    (lower.includes('models/') && (lower.includes('not found') || lower.includes('404')))
  ) {
    return new ApiServiceError(
      502,
      'MODEL_UNAVAILABLE',
      'The speech transcription model is currently unavailable.'
    );
  }

  return new ApiServiceError(502, 'AI_SERVICE_ERROR', fallbackMessage);
}

export function detectScriptLanguage(text: string, hint: SupportedLanguageId): string {
  if (/[\u0980-\u09FF]/.test(text)) return 'Bengali';
  if (/[\u0B80-\u0BFF]/.test(text)) return 'Tamil';
  if (/[\u0C00-\u0C7F]/.test(text)) return 'Telugu';
  if (/[\u0900-\u097F]/.test(text)) {
    return hint === 'marathi' ? 'Marathi' : 'Hindi';
  }
  if (hint !== 'auto') {
    return SUPPORTED_LANGUAGES[hint].label;
  }
  const hinglishMarkers = /\b(kyun|kaise|kya|hai|hain|mein|aur|nahi|matlab|toh|phir|batao|samjhao|chhota|bada)\b/i;
  if (hinglishMarkers.test(text)) {
    return 'Hinglish';
  }
  return 'English';
}

export function analyzeTranscriptUncertainty(
  transcript: string,
  languageHint: SupportedLanguageId
): UncertaintyCheckResult {
  const cleaned = transcript.trim();
  const reasons: string[] = [];

  if (!cleaned) {
    return {
      needsClarification: true,
      reasons: ['No clear spoken words were detected in the recording.'],
      checkMethod: 'heuristic',
      note: 'Heuristic check: empty transcription output.',
    };
  }

  if (/\[(unclear|inaudible|unintelligible)\]/i.test(cleaned)) {
    reasons.push('Part of the audio sounded unclear or muffled.');
  }

  if (/(\.\.\.|…)\s*$/.test(cleaned)) {
    reasons.push('The sentence ended mid-thought with a pause.');
  }

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length <= 2 && !/[?!।]$/.test(cleaned)) {
    reasons.push('Only a very short phrase was heard; the full question may have been cut off.');
  }

  if (
    /\b(the|a|an|is|are|why|how|what|when|where|ka|ke|ki|mein|aur|toh)\s*$/i.test(
      cleaned
    )
  ) {
    reasons.push('The question seems to stop right before the main topic word.');
  }

  const detected = detectScriptLanguage(cleaned, languageHint);
  if (
    languageHint !== 'auto' &&
    languageHint !== 'hinglish' &&
    detected !== SUPPORTED_LANGUAGES[languageHint].label &&
    words.length <= 3
  ) {
    reasons.push(
      `Heard short speech that may differ from the selected language (${SUPPORTED_LANGUAGES[languageHint].label}).`
    );
  }

  return {
    needsClarification: reasons.length > 0,
    reasons,
    checkMethod: 'heuristic',
    note:
      reasons.length > 0
        ? 'Checked using transparent transcript heuristics.'
        : 'Transcript looks clear and complete.',
  };
}

const CANDIDATE_TRANSCRIBE_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

export async function transcribeChildAudio(params: {
  audioBuffer: Buffer;
  mimeType: string;
  languageHint: SupportedLanguageId;
}): Promise<TranscriptionResult> {
  const { audioBuffer, mimeType, languageHint } = params;

  const ai = getAiClient();
  const base64Audio = audioBuffer.toString('base64');

  const languageGuidance =
    languageHint === 'auto'
      ? 'Automatically identify the spoken language (Hindi, English, Bengali, Tamil, Telugu, Marathi, or natural Hindi-English Hinglish).'
      : `The speaker selected ${SUPPORTED_LANGUAGES[languageHint].promptName}, though natural code-switching may still occur.`;

  const modelsToTry = Array.from(
    new Set([SERVER_CONFIG.transcribeModel, ...CANDIDATE_TRANSCRIBE_MODELS])
  );

  let lastError: unknown;

  for (const modelCandidate of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelCandidate,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Audio,
              },
            },
            {
              text: `You are an audio transcription system for a child's voice.
${languageGuidance}
Transcribe what the child said verbatim. Output ONLY the exact transcribed sentence or phrase with no preamble, quotes, or markdown.`,
            },
          ],
        },
      });

      const parts = response.candidates?.[0]?.content?.parts ?? [];
      const transcriptionSegments: string[] = [];

      for (const part of parts) {
        if (typeof part.text === 'string' && part.text.trim()) {
          transcriptionSegments.push(part.text.trim());
        }
      }

      const rawTranscript =
        transcriptionSegments.join(' ').trim() || (response.text ?? '').trim();
      const cleanedTranscript = rawTranscript.replace(/^["“]|["”]$/g, '').trim();

      const detectedLanguage =
        languageHint === 'hinglish'
          ? 'Hinglish'
          : detectScriptLanguage(cleanedTranscript, languageHint);

      const uncertainty = analyzeTranscriptUncertainty(cleanedTranscript, languageHint);

      return {
        transcript: cleanedTranscript,
        detectedLanguage,
        uncertainty,
        modelUsed: modelCandidate,
      };
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message.toLowerCase() : '';
      const isModelError =
        msg.includes('not found') || msg.includes('404') || msg.includes('model');
      if (isModelError && modelCandidate !== modelsToTry[modelsToTry.length - 1]) {
        continue;
      }
      break;
    }
  }

  throw mapGeminiError(
    lastError,
    'Could not transcribe the audio recording right now. Please try recording again or type your question.'
  );
}
