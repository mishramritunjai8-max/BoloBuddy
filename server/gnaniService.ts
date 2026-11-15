import {
  SERVER_CONFIG,
  SUPPORTED_LANGUAGES,
  isGnaniKeyConfigured,
  type SupportedLanguageId,
} from './config.ts';

const GNANI_LANGUAGE_MAP: Record<SupportedLanguageId, string> = {
  auto: 'indic-auto',
  hinglish: 'hi-IN',
  hindi: 'hi-IN',
  english: 'en-IN',
  bengali: 'bn-IN',
  tamil: 'ta-IN',
  telugu: 'te-IN',
  marathi: 'mr-IN',
};

export interface GnaniTranscriptionResponse {
  success?: boolean;
  transcript?: string;
  text?: string;
  detected_language_code?: string;
  model?: string;
  error?: string;
}

/**
 * Transcribes spoken child audio using Gnani.ai / Vachana Speech-to-Text API.
 * Standardized on https://api.vachana.ai/stt/v3 with X-API-Key-ID authentication.
 */
export async function callGnaniTranscription(
  audioBuffer: Buffer,
  mimeType: string,
  languageHint: SupportedLanguageId
): Promise<{ transcript: string; detectedLanguage?: string; modelUsed: string }> {
  if (!isGnaniKeyConfigured()) {
    throw new Error('GNANI_API_KEY is not configured.');
  }

  const apiKey = SERVER_CONFIG.gnaniApiKey!;
  const ext = mimeType.includes('wav')
    ? 'wav'
    : mimeType.includes('mp4')
      ? 'mp4'
      : mimeType.includes('ogg')
        ? 'ogg'
        : 'webm';

  const languageCode = GNANI_LANGUAGE_MAP[languageHint] || 'hi-IN';

  const formData = new FormData();
  const fileBlob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType });
  formData.append('audio_file', fileBlob, `child_recording.${ext}`);
  formData.append('language_code', languageCode);
  formData.append('model', 'prisma-v3.0');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(SERVER_CONFIG.gnaniApiUrl, {
      method: 'POST',
      headers: {
        'X-API-Key-ID': apiKey,
        token: apiKey,
        accesskey: apiKey,
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gnani API returned HTTP ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as GnaniTranscriptionResponse;
    const transcript =
      (typeof data.transcript === 'string' && data.transcript.trim()) ||
      (typeof data.text === 'string' && data.text.trim()) ||
      '';

    return {
      transcript,
      detectedLanguage: data.detected_language_code,
      modelUsed: `gnani/${data.model || 'prisma-v3.0'}`,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}
