import {
  AudioTranscriptionConfigMode,
  GoogleGenAI,
  ThinkingLevel,
  Type,
} from '@google/genai';
import {
  SERVER_CONFIG,
  SUPPORTED_LANGUAGES,
  isGeminiKeyConfigured,
  isGroqKeyConfigured,
  type SupportedLanguageId,
} from './config.ts';

export type LearningActionMode =
  | 'ask'
  | 'simpler'
  | 'example'
  | 'summarise'
  | 'switch_hindi'
  | 'switch_english';

export interface ConversationMessage {
  role: 'child' | 'buddy';
  text: string;
}

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

export interface TutorResponsePayload {
  subject: string;
  detectedLanguage: string;
  needsClarification: boolean;
  clarificationQuestion: string;
  answerTitle: string;
  explanation: string;
  steps: string[];
  everydayExample: string;
  followUpSuggestions: string[];
  modelUsed: string;
}

export interface QuizQuestionPayload {
  subject: string;
  question: string;
  options: string[];
  correctIndex: number;
  encouragingFeedback: string;
  explanation: string;
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

async function callGroqTranscription(audioBuffer: Buffer, mimeType: string): Promise<string> {
  const formData = new FormData();
  const ext = mimeType.includes('wav') ? 'wav' : mimeType.includes('mp4') ? 'mp4' : 'webm';
  const fileBlob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType });
  formData.append('file', fileBlob, `recording.${ext}`);
  formData.append('model', SERVER_CONFIG.groqWhisperModel || 'whisper-large-v3-turbo');
  formData.append('temperature', '0');

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVER_CONFIG.groqApiKey}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq Whisper error ${res.status}: ${errText}`);
  }

  const data = (await res.json()) as { text: string };
  return data.text?.trim() || '';
}

async function callGroqTutor(promptContent: string, systemInstruction: string): Promise<TutorResponsePayload> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVER_CONFIG.groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: SERVER_CONFIG.groqModel || 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `${systemInstruction}

CRITICAL: Return ONLY a valid JSON object matching this schema:
{
  "subject": "Mathematics | Science | English | Social Studies | General Knowledge | Basic Computer Science",
  "detectedLanguage": "string (e.g. English, Hindi, Hinglish, etc.)",
  "needsClarification": false,
  "clarificationQuestion": "",
  "answerTitle": "Short catchy concept title (4-8 words)",
  "explanation": "Clear 2-4 sentence explanation for children aged 6-14",
  "steps": ["Step 1", "Step 2", "Step 3"],
  "everydayExample": "One relatable everyday example",
  "followUpSuggestions": ["Question 1", "Question 2"]
}`,
        },
        { role: 'user', content: promptContent },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
      max_tokens: 800,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq LLM error ${res.status}: ${errText}`);
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content || '{}';
  const parsed = JSON.parse(content);
  return {
    subject: parsed.subject || 'General Knowledge',
    detectedLanguage: parsed.detectedLanguage || 'English',
    needsClarification: Boolean(parsed.needsClarification),
    clarificationQuestion: parsed.clarificationQuestion || '',
    answerTitle: parsed.answerTitle || 'Learning Concept',
    explanation: parsed.explanation || '',
    steps: Array.isArray(parsed.steps) ? parsed.steps.slice(0, 4) : [],
    everydayExample: parsed.everydayExample || '',
    followUpSuggestions: Array.isArray(parsed.followUpSuggestions)
      ? parsed.followUpSuggestions.slice(0, 3)
      : [],
    modelUsed: `groq/${SERVER_CONFIG.groqModel || 'llama-3.3-70b-versatile'}`,
  };
}

async function callGroqQuiz(topic: string, targetLang: string, recentContext: string): Promise<QuizQuestionPayload> {
  const prompt = [
    recentContext ? `Recent learning context:\n${recentContext}` : '',
    `Topic: ${topic || 'Everyday science curiosity'}`,
    `Create ONE fun, encouraging multiple-choice check-in question for a child aged 6–14 in ${targetLang}.`,
  ]
    .filter(Boolean)
    .join('\n\n');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVER_CONFIG.groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: SERVER_CONFIG.groqModel || 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You create gentle, fun, confidence-building mini-quiz questions for children aged 6–14. Return ONLY a valid JSON object matching:
{
  "subject": "string",
  "question": "string",
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "correctIndex": 0,
  "encouragingFeedback": "Warm praise when child answers",
  "explanation": "Friendly 1-2 sentence explanation"
}`,
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
      max_tokens: 500,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq Quiz error ${res.status}: ${errText}`);
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content || '{}';
  const parsed = JSON.parse(content);
  const safeOptions = Array.isArray(parsed.options) ? parsed.options.slice(0, 4) : [];
  const safeIndex =
    typeof parsed.correctIndex === 'number' &&
    parsed.correctIndex >= 0 &&
    parsed.correctIndex < safeOptions.length
      ? parsed.correctIndex
      : 0;

  return {
    subject: parsed.subject || 'General Knowledge',
    question: parsed.question || '',
    options: safeOptions,
    correctIndex: safeIndex,
    encouragingFeedback: parsed.encouragingFeedback || 'Great thinking!',
    explanation: parsed.explanation || '',
    modelUsed: `groq/${SERVER_CONFIG.groqModel || 'llama-3.3-70b-versatile'}`,
  };
}

async function generateGeminiContentWithFallback(
  ai: GoogleGenAI,
  preferredModel: string,
  params: {
    contents: any;
    config?: any;
  }
): Promise<{ response: any; modelUsed: string }> {
  const candidateModels = Array.from(
    new Set([preferredModel, 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'])
  );

  let lastError: unknown;
  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        ...(params.config ? { config: params.config } : {}),
      });
      return { response, modelUsed: model };
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message.toLowerCase() : '';
      const isModelNotFound =
        msg.includes('not found') ||
        msg.includes('404') ||
        msg.includes('model') ||
        msg.includes('not supported') ||
        msg.includes('unrecognized');
      if (isModelNotFound && model !== candidateModels[candidateModels.length - 1]) {
        console.warn(`Gemini model ${model} unavailable, trying fallback...`);
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

function getAiClient(): GoogleGenAI {
  if (!isGeminiKeyConfigured() && !isGroqKeyConfigured()) {
    throw new ApiServiceError(
      503,
      'MISSING_API_KEY',
      'Neither GEMINI_API_KEY nor GROQ_API_KEY is configured on the server. Please add your API key in settings.'
    );
  }

  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
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
      'The configured GEMINI_API_KEY could not be authenticated. Please check GEMINI_API_KEY in Settings > Secrets.'
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
      'The Gemini free-tier request quota is temporarily full. Please wait a moment and try again.'
    );
  }

  if (lower.includes('model_not_found') || (lower.includes('models/') && (lower.includes('not found') || lower.includes('404')))) {
    return new ApiServiceError(
      502,
      'MODEL_UNAVAILABLE',
      'The configured Gemini model is currently unavailable for this API key or project.'
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
        ? 'Checked using transparent transcript heuristics (not fabricated confidence scores).'
        : 'Transcript looks clear and complete.',
  };
}

const TRANSCRIPTION_LANGUAGE_CODES: Record<SupportedLanguageId, string[] | undefined> = {
  auto: undefined,
  hinglish: ['hi-IN', 'en-IN'],
  hindi: ['hi-IN'],
  english: ['en-IN'],
  bengali: ['bn-IN'],
  tamil: ['ta-IN'],
  telugu: ['te-IN'],
  marathi: ['mr-IN'],
};

function mapBcp47ToLabel(code: string | undefined): string | null {
  if (!code) return null;
  const prefix = code.toLowerCase().split('-')[0];
  if (prefix === 'hi') return 'Hindi';
  if (prefix === 'en') return 'English';
  if (prefix === 'bn') return 'Bengali';
  if (prefix === 'ta') return 'Tamil';
  if (prefix === 'te') return 'Telugu';
  if (prefix === 'mr') return 'Marathi';
  return null;
}

export async function transcribeChildAudio(params: {
  audioBuffer: Buffer;
  mimeType: string;
  languageHint: SupportedLanguageId;
}): Promise<TranscriptionResult> {
  const { audioBuffer, mimeType, languageHint } = params;

  // Ultra-fast Groq Whisper (< 0.4s) if configured
  if (isGroqKeyConfigured()) {
    try {
      const groqText = await callGroqTranscription(audioBuffer, mimeType);
      if (groqText) {
        const detected = detectScriptLanguage(groqText, languageHint);
        return {
          transcript: groqText,
          detectedLanguage: detected,
          uncertainty: analyzeTranscriptUncertainty(groqText, languageHint),
          modelUsed: `groq/${SERVER_CONFIG.groqWhisperModel || 'whisper-large-v3-turbo'}`,
        };
      }
    } catch (groqErr) {
      console.warn('Groq Whisper error, falling back to Gemini:', groqErr);
    }
  }

  const ai = getAiClient();
  const base64Audio = audioBuffer.toString('base64');
  const languageCodes = TRANSCRIPTION_LANGUAGE_CODES[languageHint];

  const languageGuidance =
    languageHint === 'auto'
      ? 'Automatically identify the spoken language (Hindi, English, Bengali, Tamil, Telugu, Marathi, or natural Hindi-English Hinglish).'
      : `The speaker selected ${SUPPORTED_LANGUAGES[languageHint].promptName}, though natural code-switching may still occur.`;

  const transcriptionPrompt = [
    'Transcribe this child’s speech verbatim.',
    languageGuidance,
    'Preserve pauses, hesitations, and incomplete words without rewriting or inventing missing words.',
  ].join(' ');

  try {
    const { response, modelUsed } = await generateGeminiContentWithFallback(
      ai,
      SERVER_CONFIG.transcribeModel,
      {
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
      }
    );

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const transcriptionSegments: string[] = [];
    let modelLanguageCode: string | undefined;

    for (const part of parts) {
      if (part.audioTranscription?.text) {
        transcriptionSegments.push(part.audioTranscription.text.trim());
        if (!modelLanguageCode && part.audioTranscription.languageCode) {
          modelLanguageCode = part.audioTranscription.languageCode;
        }
      } else if (typeof part.text === 'string' && part.text.trim()) {
        transcriptionSegments.push(part.text.trim());
      }
    }

    const rawTranscript =
      transcriptionSegments.join(' ').trim() || (response.text ?? '').trim();
    const cleanedTranscript = rawTranscript.replace(/^["“]|["”]$/g, '').trim();

    const detectedLanguage =
      languageHint === 'hinglish'
        ? 'Hinglish'
        : mapBcp47ToLabel(modelLanguageCode) ??
          detectScriptLanguage(cleanedTranscript, languageHint);

    const uncertainty = analyzeTranscriptUncertainty(cleanedTranscript, languageHint);

    return {
      transcript: cleanedTranscript,
      detectedLanguage,
      uncertainty,
      modelUsed,
    };
  } catch (err) {
    throw mapGeminiError(
      err,
      'Could not transcribe the audio recording right now. Please try recording again or type your question.'
    );
  }
}

export async function askBoloBuddy(params: {
  transcript: string;
  language: SupportedLanguageId;
  history: ConversationMessage[];
  actionMode: LearningActionMode;
}): Promise<TutorResponsePayload> {
  const { transcript, language, history, actionMode } = params;

  const targetLangInstruction =
    actionMode === 'switch_hindi'
      ? 'Hindi (हिन्दी in Devanagari script, simple everyday words for children)'
      : actionMode === 'switch_english'
        ? 'simple, warm English for children'
        : language === 'auto'
          ? 'the same language (or Hinglish) used in the child’s question'
          : SUPPORTED_LANGUAGES[language].promptName;

  const modeDirectives: Record<LearningActionMode, string> = {
    ask: 'Answer the child’s question clearly and warmly. Only set needsClarification=true if the question is genuinely ambiguous, incomplete, or contains [unclear]. Never repeatedly ask the child to repeat an understandable sentence.',
    simpler:
      'Re-explain the concept even more simply, as if explaining to a curious 7-year-old using short sentences and one clear everyday image.',
    example:
      'Give a fresh, vivid everyday example from daily life (home, kitchen, playground, monsoon, food, or school) that makes the idea click immediately.',
    summarise:
      'Summarise what the child has learned in this conversation into 2–3 short, encouraging takeaway points.',
    switch_hindi:
      'Explain the same answer warmly in simple Hindi (Devanagari script) while keeping familiar school science/math words clear.',
    switch_english:
      'Explain the same answer warmly in simple, encouraging English.',
  };

  const recentHistory = history
    .slice(-6)
    .map((m) => `${m.role === 'child' ? 'Child' : 'BoloBuddy'}: ${m.text}`)
    .join('\n');

  const systemInstruction = `You are BoloBuddy AI, a calm, patient, voice-first learning companion for children aged 6–14 across India.

Core rules:
- Supported subjects: Mathematics, Science, English, Social Studies, General Knowledge, Basic Computer Science.
- Language: Respond in ${targetLangInstruction}. Do not unnecessarily translate if the child asked in their preferred language.
- Tone: Warm, encouraging, never patronising, never overly technical. Break explanations into small, easy steps.
- Uncertainty & Clarification:
  - Look carefully at the transcript. Children may pause ("..."), mix Hindi and English, or have a muffled word marked "[unclear]".
  - NEVER invent missing words.
  - If the core question is genuinely unclear or has "[unclear]" making the meaning ambiguous, set needsClarification=true, ask ONE gentle, specific clarification question, and keep explanation concise/helpful without guessing wildly.
  - If the meaning IS understandable despite minor pauses, grammar slips, or Hinglish mixing, set needsClarification=false and answer directly without asking them to repeat!
- Always return valid JSON matching the schema.`;

  const promptContent = [
    recentHistory ? `Recent conversation:\n${recentHistory}\n` : '',
    `Child's current input/transcript: "${transcript}"`,
    `Requested learning mode: ${modeDirectives[actionMode]}`,
  ]
    .filter(Boolean)
    .join('\n');

  // If user explicitly configured Groq as preferred provider
  if (isGroqKeyConfigured() && SERVER_CONFIG.aiProvider === 'groq') {
    try {
      return await callGroqTutor(promptContent, systemInstruction);
    } catch (groqErr) {
      console.warn('Groq tutor failed, falling back to Gemini:', groqErr);
    }
  }

  // Gemini is Primary
  if (isGeminiKeyConfigured()) {
    try {
      const ai = getAiClient();
      const { response, modelUsed } = await generateGeminiContentWithFallback(
        ai,
        SERVER_CONFIG.tutorModel,
        {
          contents: promptContent,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                subject: {
                  type: Type.STRING,
                  description:
                    'One of: Mathematics, Science, English, Social Studies, General Knowledge, Basic Computer Science.',
                },
                detectedLanguage: {
                  type: Type.STRING,
                  description: 'Language used for the response (e.g. English, Hindi, Hinglish, Bengali, Tamil, Telugu, Marathi).',
                },
                needsClarification: {
                  type: Type.BOOLEAN,
                  description:
                    'True only when part of the question is genuinely unclear or incomplete and needs gentle clarification.',
                },
                clarificationQuestion: {
                  type: Type.STRING,
                  description:
                    'A single friendly clarification question if needsClarification is true; otherwise an empty string.',
                },
                answerTitle: {
                  type: Type.STRING,
                  description: 'A short, child-friendly 4-8 word title for the concept.',
                },
                explanation: {
                  type: Type.STRING,
                  description:
                    'Clear 2-4 sentence age-appropriate explanation in the target language.',
                },
                steps: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '2 to 3 short step-by-step points or takeaways.',
                },
                everydayExample: {
                  type: Type.STRING,
                  description: 'One relatable everyday life example.',
                },
                followUpSuggestions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '2 to 3 short curious follow-up questions the child could ask next.',
                },
              },
              required: [
                'subject',
                'detectedLanguage',
                'needsClarification',
                'clarificationQuestion',
                'answerTitle',
                'explanation',
                'steps',
                'everydayExample',
                'followUpSuggestions',
              ],
            },
          },
        }
      );

      const jsonText = (response.text ?? '').trim();
      if (!jsonText) {
        throw new ApiServiceError(
          502,
          'AI_GENERATION_FAILED',
          'BoloBuddy did not return an answer. Please try asking again.'
        );
      }

      const parsed = JSON.parse(jsonText) as Omit<TutorResponsePayload, 'modelUsed'>;
      return {
        ...parsed,
        steps: Array.isArray(parsed.steps) ? parsed.steps.slice(0, 4) : [],
        followUpSuggestions: Array.isArray(parsed.followUpSuggestions)
          ? parsed.followUpSuggestions.slice(0, 3)
          : [],
        modelUsed,
      };
    } catch (geminiErr) {
      if (isGroqKeyConfigured()) {
        console.warn('Gemini tutor error, falling back to Groq:', geminiErr);
        try {
          return await callGroqTutor(promptContent, systemInstruction);
        } catch (groqErr) {
          console.error('Groq fallback failed too:', groqErr);
        }
      }
      throw mapGeminiError(
        geminiErr,
        'BoloBuddy had trouble preparing an answer right now. Please try again.'
      );
    }
  }

  // If only Groq is configured
  if (isGroqKeyConfigured()) {
    try {
      return await callGroqTutor(promptContent, systemInstruction);
    } catch (groqErr) {
      throw new ApiServiceError(502, 'GROQ_ERROR', `Groq tutor error: ${(groqErr as Error).message}`);
    }
  }

  throw new ApiServiceError(
    503,
    'MISSING_API_KEY',
    'No valid API key configured. Please set GEMINI_API_KEY or GROQ_API_KEY.'
  );
}

export async function generateQuizQuestion(params: {
  topic: string;
  language: SupportedLanguageId;
  history: ConversationMessage[];
}): Promise<QuizQuestionPayload> {
  const { topic, language, history } = params;

  const targetLang =
    language === 'auto'
      ? 'the same language used in the recent conversation'
      : SUPPORTED_LANGUAGES[language].promptName;

  const recentContext = history
    .slice(-4)
    .map((m) => `${m.role === 'child' ? 'Child' : 'BoloBuddy'}: ${m.text}`)
    .join('\n');

  if (isGroqKeyConfigured() && SERVER_CONFIG.aiProvider === 'groq') {
    try {
      return await callGroqQuiz(topic, targetLang, recentContext);
    } catch (groqErr) {
      console.warn('Groq quiz error, falling back to Gemini:', groqErr);
    }
  }

  if (isGeminiKeyConfigured()) {
    try {
      const ai = getAiClient();
      const { response, modelUsed } = await generateGeminiContentWithFallback(
        ai,
        SERVER_CONFIG.tutorModel,
        {
          contents: [
            recentContext ? `Recent learning context:\n${recentContext}` : '',
            `Topic: ${topic || 'Everyday science curiosity'}`,
            `Create ONE fun, encouraging multiple-choice check-in question for a child aged 6–14 in ${targetLang}.`,
          ]
            .filter(Boolean)
            .join('\n\n'),
          config: {
            systemInstruction:
              'You create gentle, fun, confidence-building mini-quiz questions for children aged 6–14. Keep choices short and clear. Return valid JSON matching the schema.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                subject: { type: Type.STRING },
                question: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Exactly 3 or 4 short answer options.',
                },
                correctIndex: {
                  type: Type.INTEGER,
                  description: '0-based index of the correct option.',
                },
                encouragingFeedback: {
                  type: Type.STRING,
                  description: 'Warm praise when the child answers.',
                },
                explanation: {
                  type: Type.STRING,
                  description: '1–2 sentence friendly explanation of why the answer is right.',
                },
              },
              required: [
                'subject',
                'question',
                'options',
                'correctIndex',
                'encouragingFeedback',
                'explanation',
              ],
            },
          },
        }
      );

      const jsonText = (response.text ?? '').trim();
      if (!jsonText) {
        throw new ApiServiceError(
          502,
          'AI_GENERATION_FAILED',
          'Could not create a quiz question right now.'
        );
      }

      const parsed = JSON.parse(jsonText) as Omit<QuizQuestionPayload, 'modelUsed'>;
      const safeOptions = Array.isArray(parsed.options) ? parsed.options.slice(0, 4) : [];
      const safeIndex =
        typeof parsed.correctIndex === 'number' &&
        parsed.correctIndex >= 0 &&
        parsed.correctIndex < safeOptions.length
          ? parsed.correctIndex
          : 0;

      return {
        ...parsed,
        options: safeOptions,
        correctIndex: safeIndex,
        modelUsed,
      };
    } catch (geminiErr) {
      if (isGroqKeyConfigured()) {
        try {
          return await callGroqQuiz(topic, targetLang, recentContext);
        } catch (groqErr) {
          console.error('Both Gemini and Groq quiz calls failed:', groqErr);
        }
      }
      throw mapGeminiError(
        geminiErr,
        'Could not create a quiz question right now. Please try again.'
      );
    }
  }

  if (isGroqKeyConfigured()) {
    return await callGroqQuiz(topic, targetLang, recentContext);
  }

  throw new ApiServiceError(
    503,
    'MISSING_API_KEY',
    'No valid API key configured. Please set GEMINI_API_KEY or GROQ_API_KEY.'
  );
}
