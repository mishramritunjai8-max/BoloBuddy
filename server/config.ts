import dotenv from 'dotenv';

dotenv.config({ override: true });

export const SERVER_CONFIG = {
  port: Number(process.env.PORT || 3000),
  aiProvider: (process.env.AI_PROVIDER || 'auto').toLowerCase(), // 'auto' | 'gemini' | 'groq'
  transcribeModel: process.env.GEMINI_TRANSCRIBE_MODEL || 'gemini-2.5-flash',
  tutorModel: process.env.GEMINI_TUTOR_MODEL || 'gemini-2.5-flash',
  groqApiKey: process.env.GROQ_API_KEY?.trim(),
  groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  groqWhisperModel: process.env.GROQ_WHISPER_MODEL || 'whisper-large-v3-turbo',
  maxAudioBytes: 8 * 1024 * 1024, // 8 MB max upload (~45s compressed voice)
  minAudioBytes: 400, // Reject empty/header-only recordings
  rateLimitWindowMs: 60 * 1000,
  rateLimitMaxRequests: 60,
} as const;

export const ALLOWED_AUDIO_MIME_TYPES = new Set([
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/aac',
  'audio/flac',
]);

export const SUPPORTED_LANGUAGES = {
  auto: { id: 'auto', label: 'Auto-Detect', promptName: 'the same language spoken by the child (auto-detected)' },
  hinglish: { id: 'hinglish', label: 'Hinglish', promptName: 'natural Hindi-English Hinglish' },
  hindi: { id: 'hindi', label: 'Hindi', promptName: 'Hindi (हिन्दी in Devanagari script)' },
  english: { id: 'english', label: 'English', promptName: 'English' },
  bengali: { id: 'bengali', label: 'Bengali', promptName: 'Bengali (বাংলা)' },
  tamil: { id: 'tamil', label: 'Tamil', promptName: 'Tamil (தமிழ்)' },
  telugu: { id: 'telugu', label: 'Telugu', promptName: 'Telugu (తెలుగు)' },
  marathi: { id: 'marathi', label: 'Marathi', promptName: 'Marathi (मराठी in Devanagari script)' },
} as const;

export type SupportedLanguageId = keyof typeof SUPPORTED_LANGUAGES;

export function normalizeAudioMimeType(rawMime: string | undefined): string | null {
  if (!rawMime) return null;
  const base = rawMime.split(';')[0]?.trim().toLowerCase();
  if (!base) return null;
  if (base === 'video/webm') {
    return 'audio/webm';
  }
  if (ALLOWED_AUDIO_MIME_TYPES.has(base)) {
    return base === 'audio/x-wav' ? 'audio/wav' : base === 'audio/x-m4a' ? 'audio/mp4' : base;
  }
  return null;
}

export function isSupportedLanguage(lang: unknown): lang is SupportedLanguageId {
  return typeof lang === 'string' && lang in SUPPORTED_LANGUAGES;
}

export function isGeminiKeyConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY?.trim();
  return Boolean(key && key !== 'MY_GEMINI_API_KEY');
}

export function isGroqKeyConfigured(): boolean {
  const key = process.env.GROQ_API_KEY?.trim();
  return Boolean(key && key.startsWith('gsk_'));
}
