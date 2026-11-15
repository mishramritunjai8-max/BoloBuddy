import { useCallback, useEffect, useRef, useState } from 'react';

export type RecorderState = 'idle' | 'requesting' | 'recording' | 'stopped';

export interface RecordedAudioResult {
  blob: Blob;
  mimeType: string;
  durationSeconds: number;
}

const MAX_RECORDING_SECONDS = 45;
const TARGET_WAV_SAMPLE_RATE = 16000;
const PREFERRED_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
  'audio/ogg',
];

function getSupportedMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  for (const candidate of PREFERRED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(candidate)) {
      return candidate;
    }
  }
  return '';
}

function encodeMonoWav(chunks: Float32Array[], sourceSampleRate: number): Blob {
  let totalLength = 0;
  for (const chunk of chunks) {
    totalLength += chunk.length;
  }

  const merged = new Float32Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  // Downsample to 16kHz mono for fast upload & clean Gemini speech transcription
  const ratio = sourceSampleRate / TARGET_WAV_SAMPLE_RATE;
  const outputLength = Math.max(1, Math.floor(merged.length / ratio));
  const resampled = new Float32Array(outputLength);

  for (let i = 0; i < outputLength; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(merged.length, Math.floor((i + 1) * ratio));
    let sum = 0;
    let count = 0;
    for (let j = start; j < end; j++) {
      sum += merged[j];
      count++;
    }
    resampled[i] = count > 0 ? sum / count : merged[start] ?? 0;
  }

  const buffer = new ArrayBuffer(44 + resampled.length * 2);
  const view = new DataView(buffer);

  const writeString = (pos: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(pos + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + resampled.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, TARGET_WAV_SAMPLE_RATE, true);
  view.setUint32(28, TARGET_WAV_SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, resampled.length * 2, true);

  let writeOffset = 44;
  for (let i = 0; i < resampled.length; i++) {
    const clamped = Math.max(-1, Math.min(1, resampled[i]));
    view.setInt16(writeOffset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    writeOffset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

export function useAudioRecorder() {
  const [recorderState, setRecorderState] = useState<RecorderState>('idle');
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [waveformLevels, setWaveformLevels] = useState<number[]>(() => Array(16).fill(0.18));
  const [recorderError, setRecorderError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const silentGainRef = useRef<GainNode | null>(null);
  const pcmChunksRef = useRef<Float32Array[]>([]);
  const sampleRateRef = useRef<number>(48000);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const stopResolverRef = useRef<((result: RecordedAudioResult | null) => void) | null>(null);

  const cleanupResources = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.onaudioprocess = null;
      try {
        processorRef.current.disconnect();
      } catch {
        // Ignore disconnect error
      }
      processorRef.current = null;
    }
    if (silentGainRef.current) {
      try {
        silentGainRef.current.disconnect();
      } catch {
        // Ignore disconnect error
      }
      silentGainRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      void audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setWaveformLevels(Array(16).fill(0.18));
  }, []);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // Ignore teardown stop error
        }
      }
      cleanupResources();
    };
  }, [cleanupResources]);

  const stopRecording = useCallback((): Promise<RecordedAudioResult | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      const hasPcm = pcmChunksRef.current.length > 0;

      if (!recorder || recorder.state !== 'recording') {
        if (hasPcm && Date.now() - startedAtRef.current >= 350) {
          const elapsedSeconds = Math.max(
            1,
            Math.round((Date.now() - startedAtRef.current) / 1000)
          );
          const wavBlob = encodeMonoWav(pcmChunksRef.current, sampleRateRef.current);
          pcmChunksRef.current = [];
          cleanupResources();
          setRecorderState('stopped');
          resolve({
            blob: wavBlob,
            mimeType: 'audio/wav',
            durationSeconds: elapsedSeconds,
          });
          return;
        }
        cleanupResources();
        setRecorderState('idle');
        resolve(null);
        return;
      }

      stopResolverRef.current = resolve;
      try {
        recorder.stop();
      } catch {
        cleanupResources();
        setRecorderState('idle');
        stopResolverRef.current = null;
        resolve(null);
      }
    });
  }, [cleanupResources]);

  const startRecording = useCallback(async () => {
    setRecorderError(null);

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== 'function' ||
      typeof MediaRecorder === 'undefined'
    ) {
      setRecorderError(
        'Microphone recording is not supported in this browser. You can still type your question below.'
      );
      return false;
    }

    setRecorderState('requesting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      pcmChunksRef.current = [];

      const mimeType = getSupportedMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const elapsedMs = Date.now() - startedAtRef.current;
        const elapsedSeconds = Math.max(0, Math.round(elapsedMs / 1000));
        const capturedPcm = pcmChunksRef.current;
        const capturedSampleRate = sampleRateRef.current;
        pcmChunksRef.current = [];

        let finalBlob: Blob;
        let finalMime: string;

        if (capturedPcm.length > 0) {
          finalBlob = encodeMonoWav(capturedPcm, capturedSampleRate);
          finalMime = 'audio/wav';
        } else {
          const fallbackMime = recorder.mimeType || mimeType || 'audio/webm';
          finalBlob = new Blob(chunksRef.current, { type: fallbackMime });
          finalMime = fallbackMime.split(';')[0] || 'audio/webm';
        }

        cleanupResources();
        setRecorderState('stopped');

        const resolver = stopResolverRef.current;
        stopResolverRef.current = null;

        if (finalBlob.size < 400 || elapsedMs < 350) {
          setRecorderError(
            'That recording was too short or silent. Tap the microphone and speak your question clearly.'
          );
          if (resolver) resolver(null);
          return;
        }

        if (resolver) {
          resolver({
            blob: finalBlob,
            mimeType: finalMime,
            durationSeconds: elapsedSeconds,
          });
        }
      };

      // Set up real-time AudioContext analyser + clean PCM WAV capture
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          if (ctx.state === 'suspended') {
            await ctx.resume();
          }
          sampleRateRef.current = ctx.sampleRate;

          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);

          // Capture clean mono PCM samples into memory without speaker echo
          if (typeof ctx.createScriptProcessor === 'function') {
            const processor = ctx.createScriptProcessor(4096, 1, 1);
            const silentGain = ctx.createGain();
            silentGain.gain.value = 0;

            processor.onaudioprocess = (event: AudioProcessingEvent) => {
              const input = event.inputBuffer.getChannelData(0);
              pcmChunksRef.current.push(new Float32Array(input));
            };

            source.connect(processor);
            processor.connect(silentGain);
            silentGain.connect(ctx.destination);
            processorRef.current = processor;
            silentGainRef.current = silentGain;
          }

          audioContextRef.current = ctx;
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateLevels = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            const bars: number[] = [];
            for (let i = 0; i < 16; i++) {
              const binIdx = Math.min(dataArray.length - 1, Math.floor((i / 16) * 20));
              const normalized = Math.max(0.16, Math.min(1, dataArray[binIdx] / 180));
              bars.push(normalized);
            }
            setWaveformLevels(bars);
            rafRef.current = requestAnimationFrame(updateLevels);
          };
          rafRef.current = requestAnimationFrame(updateLevels);
        }
      } catch {
        // Falls back to MediaRecorder blob cleanly if AudioContext is restricted
      }

      startedAtRef.current = Date.now();
      setDurationSeconds(0);
      setRecorderState('recording');
      recorder.start(250);

      timerRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
        setDurationSeconds(elapsed);
        if (elapsed >= MAX_RECORDING_SECONDS) {
          void stopRecording();
        }
      }, 250);

      return true;
    } catch (err) {
      cleanupResources();
      setRecorderState('idle');

      const name = err instanceof Error ? err.name : '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setRecorderError(
          'Microphone permission was denied. Please allow microphone access in your browser address bar, or type your question below.'
        );
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setRecorderError(
          'No microphone was found on this device. You can plug in a microphone or type your question below.'
        );
      } else {
        setRecorderError(
          'Could not access the microphone right now. You can type your question directly instead.'
        );
      }
      return false;
    }
  }, [cleanupResources, stopRecording]);

  const resetRecorder = useCallback(() => {
    pcmChunksRef.current = [];
    setRecorderError(null);
    setDurationSeconds(0);
    setRecorderState('idle');
  }, []);

  return {
    recorderState,
    durationSeconds,
    maxSeconds: MAX_RECORDING_SECONDS,
    waveformLevels,
    recorderError,
    setRecorderError,
    startRecording,
    stopRecording,
    resetRecorder,
  };
}
