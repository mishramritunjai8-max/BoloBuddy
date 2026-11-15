import { useCallback, useEffect, useMemo, useState } from 'react';
import type { WorkspaceLanguageId } from '../types/learning';

const LANGUAGE_BCP47_PREFIXES: Record<string, string[]> = {
  hindi: ['hi-IN', 'hi'],
  hinglish: ['en-IN', 'hi-IN', 'en'],
  english: ['en-IN', 'en-GB', 'en-US', 'en'],
  bengali: ['bn-IN', 'bn-BD', 'bn'],
  tamil: ['ta-IN', 'ta-SG', 'ta'],
  telugu: ['te-IN', 'te'],
  marathi: ['mr-IN', 'mr', 'hi-IN'],
  auto: ['en-IN', 'hi-IN', 'en'],
};

function resolveVoiceCodeList(languageHint: string): string[] {
  const normalized = languageHint.trim().toLowerCase();
  return LANGUAGE_BCP47_PREFIXES[normalized] ?? ['en-IN', 'en-US', 'en'];
}

export function useSpeechSynthesis() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);

  const isSupported =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined';

  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const list = window.speechSynthesis.getVoices();
      if (list.length > 0) {
        setVoices(list);
      }
    };

    loadVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', loadVoices);
      window.speechSynthesis.cancel();
    };
  }, [isSupported]);

  const findBestVoice = useCallback(
    (languageId: WorkspaceLanguageId | string) => {
      if (voices.length === 0) return { voice: null, exactLanguageMatch: false };
      const preferredCodes = resolveVoiceCodeList(languageId);

      for (const code of preferredCodes) {
        const exact = voices.find((v) => v.lang.toLowerCase() === code.toLowerCase());
        if (exact) return { voice: exact, exactLanguageMatch: true };

        const prefix = voices.find((v) =>
          v.lang.toLowerCase().startsWith(code.split('-')[0].toLowerCase())
        );
        if (prefix) return { voice: prefix, exactLanguageMatch: true };
      }

      return { voice: voices[0] ?? null, exactLanguageMatch: false };
    },
    [voices]
  );

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  const speak = useCallback(
    (text: string, languageId: WorkspaceLanguageId | string) => {
      setSpeechNotice(null);

      if (!isSupported) {
        setSpeechNotice(
          'Voice playback is not supported in this browser, so the full text answer is shown above.'
        );
        return;
      }

      if (!text.trim()) return;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const { voice, exactLanguageMatch } = findBestVoice(languageId);

      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      }

      if (!exactLanguageMatch && languageId !== 'auto' && languageId !== 'hinglish') {
        setSpeechNotice(
          `Your device does not have a dedicated ${languageId} voice installed; using the closest available browser voice.`
        );
      }

      utterance.rate = 0.96;
      utterance.pitch = 1.03;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => {
        setIsSpeaking(false);
        setSpeechNotice(
          'Browser speech playback could not start on this device. You can read the answer directly above.'
        );
      };

      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    },
    [findBestVoice, isSupported]
  );

  return useMemo(
    () => ({
      isSupported,
      isSpeaking,
      speechNotice,
      voicesCount: voices.length,
      speak,
      stop,
      findBestVoice,
    }),
    [findBestVoice, isSpeaking, isSupported, speak, speechNotice, stop, voices.length]
  );
}
