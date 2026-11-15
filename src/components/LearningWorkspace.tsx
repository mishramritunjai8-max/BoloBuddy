import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Edit3,
  HelpCircle,
  Languages,
  Lightbulb,
  Loader2,
  Mic,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Square,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import {
  ApiClientError,
  askBoloBuddyQuestion,
  fetchHealthStatus,
  fetchLearningQuiz,
  transcribeAudioBlob,
} from '../services/apiClient';
import type {
  HealthStatus,
  LearningActionMode,
  QuizQuestionPayload,
  SessionConversationTurn,
  TranscriptionResponse,
  WorkspaceLanguageId,
} from '../types/learning';

interface LearningWorkspaceProps {
  onBackToLanding: () => void;
  initialTopicPrompt?: string | null;
  onClearInitialPrompt?: () => void;
}

const WORKSPACE_LANGUAGES: Array<{
  id: WorkspaceLanguageId;
  label: string;
  shortLabel: string;
  scriptClass: string;
}> = [
  { id: 'auto', label: 'Auto-Detect', shortLabel: 'Auto', scriptClass: 'font-sans' },
  { id: 'hinglish', label: 'Hinglish', shortLabel: 'Hinglish', scriptClass: 'font-sans' },
  { id: 'hindi', label: 'हिन्दी (Hindi)', shortLabel: 'हिन्दी', scriptClass: 'font-[var(--font-devanagari)]' },
  { id: 'english', label: 'English', shortLabel: 'English', scriptClass: 'font-sans' },
  { id: 'bengali', label: 'বাংলা (Bengali)', shortLabel: 'বাংলা', scriptClass: 'font-[var(--font-bengali)]' },
  { id: 'tamil', label: 'தமிழ் (Tamil)', shortLabel: 'தமிழ்', scriptClass: 'font-[var(--font-tamil)]' },
  { id: 'telugu', label: 'తెలుగు (Telugu)', shortLabel: 'తెలుగు', scriptClass: 'font-[var(--font-telugu)]' },
  { id: 'marathi', label: 'मराठी (Marathi)', shortLabel: 'मराठी', scriptClass: 'font-[var(--font-devanagari)]' },
];

const STARTER_QUESTIONS = [
  'Why is the sky blue?',
  'What is photosynthesis?',
  'Why do we have seasons?',
  'What are prime numbers?',
];

const TOPIC_SUGGESTIONS = [
  { label: 'Science', prompt: 'Why does the moon seem to change its shape every night?' },
  { label: 'Mathematics', prompt: 'How do fractions work when sharing something equally?' },
  { label: 'English', prompt: 'What is the difference between a metaphor and a simile?' },
  { label: 'Social Studies', prompt: 'Why were early civilisations built near rivers?' },
  { label: 'Computer Science', prompt: 'How do computers understand words using 0s and 1s?' },
];

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function getScriptClassForLanguage(langLabel: string, selectedId: WorkspaceLanguageId): string {
  const lower = langLabel.toLowerCase();
  if (lower.includes('hindi') || lower.includes('marathi') || selectedId === 'hindi' || selectedId === 'marathi') {
    return 'font-[var(--font-devanagari)]';
  }
  if (lower.includes('bengali') || selectedId === 'bengali') {
    return 'font-[var(--font-bengali)]';
  }
  if (lower.includes('tamil') || selectedId === 'tamil') {
    return 'font-[var(--font-tamil)]';
  }
  if (lower.includes('telugu') || selectedId === 'telugu') {
    return 'font-[var(--font-telugu)]';
  }
  return 'font-sans';
}

export default function LearningWorkspace({
  onBackToLanding,
  initialTopicPrompt,
  onClearInitialPrompt,
}: LearningWorkspaceProps) {
  const [selectedLang, setSelectedLang] = useState<WorkspaceLanguageId>('auto');
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);

  const [transcriptInput, setTranscriptInput] = useState('');
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);
  const [transcriptionMeta, setTranscriptionMeta] = useState<TranscriptionResponse | null>(null);

  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isAskingAi, setIsAskingAi] = useState(false);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);

  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [turns, setTurns] = useState<SessionConversationTurn[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<QuizQuestionPayload | null>(null);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [showPrivacyPanel, setShowPrivacyPanel] = useState(false);

  const transcriptInputRef = useRef<HTMLTextAreaElement | null>(null);
  const answerTopRef = useRef<HTMLDivElement | null>(null);

  const {
    recorderState,
    durationSeconds,
    maxSeconds,
    waveformLevels,
    recorderError,
    setRecorderError,
    startRecording,
    stopRecording,
    resetRecorder,
  } = useAudioRecorder();

  const {
    isSupported: isTtsSupported,
    isSpeaking,
    speechNotice,
    speak,
    stop: stopSpeaking,
  } = useSpeechSynthesis();

  useEffect(() => {
    let active = true;
    fetchHealthStatus()
      .then((status) => {
        if (!active) return;
        setHealth(status);
        setHealthError(null);
      })
      .catch((err) => {
        if (!active) return;
        setHealthError(
          err instanceof ApiClientError
            ? err.message
            : 'Could not verify backend availability.'
        );
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (initialTopicPrompt && initialTopicPrompt.trim()) {
      setTranscriptInput(initialTopicPrompt.trim());
      setIsEditingTranscript(true);
      onClearInitialPrompt?.();
    }
  }, [initialTopicPrompt, onClearInitialPrompt]);

  const latestTurn = turns.length > 0 ? turns[turns.length - 1] : null;
  const isBusy = isTranscribing || isAskingAi || isLoadingQuiz || recorderState === 'requesting';

  const conversationHistoryForApi = useMemo(() => {
    const items: Array<{ role: 'child' | 'buddy'; text: string }> = [];
    for (const turn of turns) {
      items.push({ role: 'child', text: turn.childText });
      items.push({
        role: 'buddy',
        text: `${turn.response.answerTitle}: ${turn.response.explanation}`,
      });
    }
    return items;
  }, [turns]);

  async function handleMicToggle() {
    if (isTranscribing || isAskingAi || recorderState === 'requesting') {
      return;
    }

    setWorkspaceError(null);
    setRecorderError(null);
    stopSpeaking();

    if (recorderState === 'recording') {
      const recorded = await stopRecording();
      if (!recorded) return;

      setIsTranscribing(true);
      try {
        const result = await transcribeAudioBlob({
          blob: recorded.blob,
          mimeType: recorded.mimeType,
          languageHint: selectedLang,
        });

        setTranscriptionMeta(result);
        setTranscriptInput(result.transcript);
        setIsEditingTranscript(true);
        setTimeout(() => {
          transcriptInputRef.current?.focus();
          const len = result.transcript.length;
          transcriptInputRef.current?.setSelectionRange(len, len);
        }, 40);
      } catch (err) {
        setWorkspaceError(
          err instanceof ApiClientError
            ? err.message
            : 'Transcription failed. Please try recording again or type your question.'
        );
      } finally {
        setIsTranscribing(false);
      }
      return;
    }

    await startRecording();
  }

  async function handleAskBoloBuddy(
    overrideQuestion?: string,
    mode: LearningActionMode = 'ask'
  ) {
    if (isAskingAi || isTranscribing) return;

    const questionText = (overrideQuestion ?? transcriptInput).trim();
    if (!questionText) {
      setWorkspaceError('Please record your voice or type a question first.');
      return;
    }

    setWorkspaceError(null);
    setActiveQuiz(null);
    setSelectedQuizOption(null);
    stopSpeaking();
    setIsAskingAi(true);

    try {
      const response = await askBoloBuddyQuestion({
        transcript: questionText,
        language: selectedLang,
        history: conversationHistoryForApi,
        actionMode: mode,
      });

      const newTurn: SessionConversationTurn = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        childText: questionText,
        languageLabel: response.detectedLanguage || selectedLang,
        actionMode: mode,
        response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setTurns((prev) => [...prev, newTurn]);
      if (mode === 'ask') {
        setIsEditingTranscript(false);
      }
      setTimeout(() => {
        answerTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 60);
    } catch (err) {
      setWorkspaceError(
        err instanceof ApiClientError
          ? err.message
          : 'BoloBuddy could not respond right now. Please try again.'
      );
    } finally {
      setIsAskingAi(false);
    }
  }

  async function handleGenerateQuiz() {
    if (isLoadingQuiz || isAskingAi || !latestTurn) return;

    setWorkspaceError(null);
    setIsLoadingQuiz(true);
    setSelectedQuizOption(null);

    try {
      const quiz = await fetchLearningQuiz({
        topic: `${latestTurn.response.subject}: ${latestTurn.response.answerTitle}`,
        language: selectedLang,
        history: conversationHistoryForApi,
      });
      setActiveQuiz(quiz);
    } catch (err) {
      setWorkspaceError(
        err instanceof ApiClientError
          ? err.message
          : 'Could not generate a quiz question right now.'
      );
    } finally {
      setIsLoadingQuiz(false);
    }
  }

  function handleRetryVoice() {
    stopSpeaking();
    resetRecorder();
    setTranscriptionMeta(null);
    setTranscriptInput('');
    setWorkspaceError(null);
    setIsEditingTranscript(false);
  }

  function handleNewConversation() {
    stopSpeaking();
    resetRecorder();
    setTurns([]);
    setTranscriptionMeta(null);
    setTranscriptInput('');
    setWorkspaceError(null);
    setActiveQuiz(null);
    setSelectedQuizOption(null);
    setIsEditingTranscript(false);
  }

  function handleSpeakLatest() {
    if (!latestTurn) return;
    const { response } = latestTurn;
    const textToSpeak = response.needsClarification
      ? `${response.clarificationQuestion} ${response.explanation}`
      : [
          response.answerTitle,
          response.explanation,
          response.everydayExample ? `For example: ${response.everydayExample}` : '',
        ]
          .filter(Boolean)
          .join('. ');

    speak(textToSpeak, selectedLang === 'auto' ? response.detectedLanguage : selectedLang);
  }

  const activeScriptClass = latestTurn
    ? getScriptClassForLanguage(latestTurn.response.detectedLanguage, selectedLang)
    : WORKSPACE_LANGUAGES.find((l) => l.id === selectedLang)?.scriptClass ?? 'font-sans';

  return (
    <div
      className="min-h-screen w-full relative overflow-x-hidden"
      style={{
        background:
          'linear-gradient(160deg, #E9E8F8 0%, #EEF2FB 40%, #E9E8F8 72%, #F6EAE6 100%)',
      }}
    >
      {/* Brand Aurora Orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -top-24 -left-24 w-[480px] h-[480px] rounded-full aurora-orb-blue opacity-50"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-0 right-[-8%] w-[520px] h-[520px] rounded-full aurora-orb-peach opacity-45"
      />

      {/* Workspace Top Bar */}
      <header className="sticky top-0 z-40 px-4 sm:px-6 lg:px-10 pt-3 pb-2">
        <div className="max-w-7xl mx-auto glass-nav rounded-2xl px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onBackToLanding}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-btn-secondary text-xs sm:text-sm font-medium text-[var(--color-ink)] whitespace-nowrap shrink-0 transition-transform duration-150 hover:-translate-x-0.5"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Home</span>
            </button>
            <span
              className="font-bold text-base sm:text-lg text-[var(--color-ink)] truncate"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              BoloBuddy AI
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowPrivacyPanel((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/50 hover:bg-white/75 border border-white/75 text-xs sm:text-sm font-medium text-[var(--color-ink)] whitespace-nowrap transition-colors"
            >
              <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">About &amp; Privacy</span>
              <span className="sm:hidden">Privacy</span>
            </button>

            <button
              type="button"
              onClick={handleNewConversation}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl glass-btn-primary text-xs sm:text-sm font-semibold text-[var(--color-ink)] whitespace-nowrap transition-transform duration-150 hover:-translate-y-0.5"
            >
              <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">New Conversation</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 space-y-6">
        {/* Welcome + Language Selector Strip */}
        <section className="glass-surface rounded-3xl p-5 sm:p-7">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <p
                className="text-xs font-semibold text-[var(--color-ink-subtle)] mb-1"
                style={{ fontFamily: 'var(--font-label)' }}
              >
                Learning Workspace · Ages 6–14
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-ink)] mb-1.5">
                Hi! What are you curious about today?
              </h1>
              <p className="text-sm sm:text-base text-[var(--color-ink-muted)]">
                Pick a language, tap the microphone to speak naturally, or choose a topic to explore together.
              </p>
            </div>

            {/* Language Selector */}
            <div className="lg:max-w-xl">
              <div className="flex items-center gap-1.5 mb-2">
                <Languages className="w-3.5 h-3.5 text-[var(--color-ink-subtle)]" aria-hidden="true" />
                <span
                  className="text-xs font-semibold text-[var(--color-ink-subtle)]"
                  style={{ fontFamily: 'var(--font-label)' }}
                >
                  Choose your language
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Language selection">
                {WORKSPACE_LANGUAGES.map((lang) => {
                  const active = selectedLang === lang.id;
                  return (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => setSelectedLang(lang.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-150 ${lang.scriptClass} ${
                        active
                          ? 'glass-btn-primary text-[var(--color-ink)] font-semibold'
                          : 'bg-white/50 hover:bg-white/80 text-[var(--color-ink-muted)] border border-white/75'
                      }`}
                    >
                      {lang.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Honest Server Availability Notice */}
          {(health && !health.geminiConfigured) || healthError ? (
            <div className="mt-5 rounded-2xl bg-[#F5B69E]/28 border border-[#F5B69E]/70 p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[var(--color-ink)] shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-sm text-[var(--color-ink)]">
                <p className="font-semibold mb-0.5">
                  {healthError
                    ? 'Backend connection issue'
                    : 'AI speech and tutoring service unavailable'}
                </p>
                <p className="text-[var(--color-ink-muted)]">
                  {healthError
                    ? healthError
                    : 'The server-side AI service is not active right now. Voice recording still works locally, and AI answers will resume once the server service is enabled.'}
                </p>
              </div>
            </div>
          ) : null}
        </section>

        {/* Privacy & About Expandable Panel */}
        {showPrivacyPanel && (
          <section
            aria-label="About and Privacy Information"
            className="glass-surface-peach rounded-3xl p-5 sm:p-7 relative"
          >
            <button
              type="button"
              onClick={() => setShowPrivacyPanel(false)}
              aria-label="Close privacy notice"
              className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-white/55 hover:bg-white/80 flex items-center justify-center text-[var(--color-ink)]"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pr-8">
              <div>
                <h2 className="text-base font-bold text-[var(--color-ink)] mb-1.5">
                  Child Privacy First
                </h2>
                <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
                  Voice recordings are sent only to the server in memory for transcription and are never saved permanently to disk or a database. We never ask for a child&apos;s name, email, or personal details.
                </p>
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--color-ink)] mb-1.5">
                  Microphone Permission
                </h2>
                <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
                  Your browser asks permission before listening. The microphone stays active only while you see the live waveform and stops immediately when you press Stop.
                </p>
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--color-ink)] mb-1.5">
                  Honest AI &amp; Language Support
                </h2>
                <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
                  Speech recognition and explanations are powered by Gemini on the server. Accuracy can vary across regional accents, noisy rooms, and devices; uncertainty checks use transparent transcript heuristics rather than invented scores.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Main Workspace Split: Voice Capture & Transcript (Left) + AI Tutor & Conversation (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Voice Studio, Transcript Review & Starter Prompts */}
          <div className="lg:col-span-5 space-y-6">
            {/* Voice Recorder Card */}
            <section className="glass-surface rounded-3xl p-6 sm:p-7">
              <div className="flex items-center justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-lg font-bold text-[var(--color-ink)]">
                    1. Speak your question
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--color-ink-muted)]">
                    Tap the mic, speak naturally, then tap Stop.
                  </p>
                </div>
                <span
                  className="text-xs font-semibold text-[var(--color-ink)] bg-white/60 border border-white/80 px-3 py-1 rounded-xl tabular-nums"
                  style={{ fontFamily: 'var(--font-label)' }}
                >
                  {formatDuration(durationSeconds)} / {formatDuration(maxSeconds)}
                </span>
              </div>

              {/* Large Microphone Control + Real-Time Audio Waveform */}
              <div className="rounded-2xl bg-white/55 border border-white/80 p-5 flex flex-col items-center text-center gap-4 mb-5">
                <button
                  type="button"
                  onClick={() => void handleMicToggle()}
                  disabled={isTranscribing || isAskingAi || recorderState === 'requesting'}
                  aria-label={
                    recorderState === 'recording' ? 'Stop recording' : 'Start voice recording'
                  }
                  className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1D2B40] disabled:opacity-60 ${
                    recorderState === 'recording'
                      ? 'bg-[#F5B69E] border-2 border-white shadow-[0_0_0_8px_rgba(245,182,158,0.32)] scale-105'
                      : 'glass-btn-primary hover:scale-105'
                  }`}
                >
                  {recorderState === 'requesting' || isTranscribing ? (
                    <Loader2 className="w-9 h-9 text-[var(--color-ink)] animate-spin" />
                  ) : recorderState === 'recording' ? (
                    <Square className="w-8 h-8 text-[var(--color-ink)] fill-current" />
                  ) : (
                    <Mic className="w-9 h-9 text-[var(--color-ink)]" />
                  )}
                </button>

                <div>
                  <p className="text-sm sm:text-base font-semibold text-[var(--color-ink)]">
                    {recorderState === 'requesting'
                      ? 'Asking browser for microphone access...'
                      : recorderState === 'recording'
                        ? 'Listening carefully... Tap Stop when finished'
                        : isTranscribing
                          ? 'Transcribing your voice with Gemini...'
                          : 'Tap the microphone to ask out loud'}
                  </p>
                  <p className="text-xs text-[var(--color-ink-subtle)] mt-0.5">
                    Take your time — pauses and Hindi-English words are welcome.
                  </p>
                </div>

                {/* Live Audio Waveform Driven by AnalyserNode */}
                <div
                  className="w-full max-w-xs h-10 flex items-center justify-center gap-1.5"
                  aria-hidden="true"
                >
                  {waveformLevels.map((level, idx) => (
                    <span
                      key={idx}
                      className="w-2 rounded-full transition-all duration-75"
                      style={{
                        height: `${Math.round(level * 36)}px`,
                        background:
                          recorderState === 'recording'
                            ? idx % 2 === 0
                              ? '#8DB9F0'
                              : '#F5B69E'
                            : 'rgba(141, 185, 240, 0.45)',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Microphone / Recording Error Message */}
              {recorderError && (
                <div
                  role="alert"
                  className="mb-4 rounded-2xl bg-[#F5B69E]/30 border border-[#F5B69E]/75 p-3.5 flex items-start gap-2.5 text-sm text-[var(--color-ink)]"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{recorderError}</span>
                </div>
              )}

              {/* Transcript Review & Edit Area */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="transcript-editor"
                    className="text-sm font-bold text-[var(--color-ink)]"
                  >
                    2. Check or edit your question
                  </label>
                  {transcriptionMeta && (
                    <span
                      className="text-xs font-medium text-[var(--color-ink-subtle)]"
                      style={{ fontFamily: 'var(--font-label)' }}
                    >
                      Heard: {transcriptionMeta.detectedLanguage}
                    </span>
                  )}
                </div>

                {/* Transcription Success / Empty Guidance */}
                {transcriptionMeta && !transcriptionMeta.uncertainty.needsClarification && (
                  <div className="rounded-2xl bg-[#8DB9F0]/22 border border-[#8DB9F0]/55 px-3.5 py-2.5 text-xs sm:text-sm text-[var(--color-ink)] flex items-center justify-between gap-2">
                    <span>
                      Transcript ready — edit any word below if needed, then click{' '}
                      <strong className="font-semibold">Ask BoloBuddy</strong>.
                    </span>
                  </div>
                )}

                {/* Heuristic Uncertainty Notice */}
                {transcriptionMeta?.uncertainty.needsClarification && (
                  <div className="rounded-2xl bg-[#F5B69E]/25 border border-[#F5B69E]/65 p-3.5 text-xs sm:text-sm text-[var(--color-ink)] space-y-1">
                    <p className="font-semibold flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>
                        {transcriptionMeta.transcript
                          ? 'Let’s double-check what you said'
                          : 'No clear speech was heard'}
                      </span>
                    </p>
                    <p className="text-[var(--color-ink-muted)]">
                      {transcriptionMeta.uncertainty.reasons.join(' ')} You can edit or type your question directly below, or tap Retry.
                    </p>
                  </div>
                )}

                <div className="relative">
                  <textarea
                    id="transcript-editor"
                    ref={transcriptInputRef}
                    rows={3}
                    value={transcriptInput}
                    onChange={(e) => {
                      setTranscriptInput(e.target.value);
                      if (!isEditingTranscript) setIsEditingTranscript(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (!isBusy && transcriptInput.trim()) {
                          void handleAskBoloBuddy();
                        }
                      }
                    }}
                    placeholder="Your spoken transcript will appear here — or you can type and edit your question directly..."
                    className={`w-full rounded-2xl bg-white/80 border-2 px-4 py-3 text-sm sm:text-base text-[var(--color-ink)] placeholder:text-[var(--color-ink-subtle)] focus:outline-none focus:border-[#8DB9F0] resize-y transition-colors ${
                      isEditingTranscript ? 'border-[#8DB9F0]/80' : 'border-white/90'
                    } ${activeScriptClass}`}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => void handleAskBoloBuddy()}
                    disabled={isBusy || !transcriptInput.trim()}
                    className="flex-1 min-w-[160px] glass-btn-primary inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold text-[var(--color-ink)] disabled:opacity-50 disabled:cursor-not-allowed transition-transform duration-150 hover:-translate-y-0.5"
                  >
                    {isAskingAi ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        <span>Thinking...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" aria-hidden="true" />
                        <span>Ask BoloBuddy</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingTranscript(true);
                      transcriptInputRef.current?.focus();
                    }}
                    disabled={isBusy}
                    className="glass-btn-secondary inline-flex items-center gap-1.5 px-3.5 py-3 rounded-2xl text-xs sm:text-sm font-medium text-[var(--color-ink)] disabled:opacity-50"
                  >
                    <Edit3 className="w-4 h-4" aria-hidden="true" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRetryVoice}
                    disabled={isBusy}
                    className="glass-btn-secondary inline-flex items-center gap-1.5 px-3.5 py-3 rounded-2xl text-xs sm:text-sm font-medium text-[var(--color-ink)] disabled:opacity-50"
                  >
                    <RefreshCw className="w-4 h-4" aria-hidden="true" />
                    <span>Retry</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Suggested Questions & Subjects */}
            <section className="glass-surface-peach rounded-3xl p-6">
              <h2 className="text-base font-bold text-[var(--color-ink)] mb-3">
                Try a starter question
              </h2>
              <div className="flex flex-wrap gap-2 mb-5">
                {STARTER_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    disabled={isBusy}
                    onClick={() => {
                      setTranscriptInput(q);
                      void handleAskBoloBuddy(q, 'ask');
                    }}
                    className="text-left px-3.5 py-2 rounded-xl bg-white/55 hover:bg-white/85 border border-white/80 text-xs sm:text-sm font-medium text-[var(--color-ink)] transition-colors disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>

              <h3
                className="text-xs font-semibold text-[var(--color-ink-subtle)] mb-2"
                style={{ fontFamily: 'var(--font-label)' }}
              >
                Explore by school subject
              </h3>
              <div className="flex flex-wrap gap-2">
                {TOPIC_SUGGESTIONS.map((topic) => (
                  <button
                    key={topic.label}
                    type="button"
                    disabled={isBusy}
                    onClick={() => {
                      setTranscriptInput(topic.prompt);
                      void handleAskBoloBuddy(topic.prompt, 'ask');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#8DB9F0]/28 hover:bg-[#8DB9F0]/45 border border-white/75 text-xs font-semibold text-[var(--color-ink)] transition-colors disabled:opacity-50"
                  >
                    {topic.label}
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: AI Answer Area, Clarification, TTS, Interactive Actions & Session History */}
          <div className="lg:col-span-7 space-y-6" ref={answerTopRef}>
            {workspaceError && (
              <div
                role="alert"
                className="rounded-3xl bg-[#F5B69E]/35 border border-[#F5B69E]/80 p-5 flex items-start gap-3 text-sm text-[var(--color-ink)]"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-semibold mb-0.5">We ran into a problem</p>
                  <p className="text-[var(--color-ink-muted)]">{workspaceError}</p>
                </div>
              </div>
            )}

            {/* Empty Initial State */}
            {!latestTurn && !isAskingAi && (
              <div className="glass-surface rounded-3xl p-8 sm:p-10 text-center flex flex-col items-center justify-center min-h-[380px]">
                <div
                  className="w-16 h-16 rounded-3xl flex items-center justify-center mb-5 border border-white/80"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(141,185,240,0.48), rgba(245,182,158,0.45))',
                  }}
                >
                  <Sparkles className="w-7 h-7 text-[var(--color-ink)]" aria-hidden="true" />
                </div>
                <h2 className="text-2xl font-bold text-[var(--color-ink)] mb-2">
                  BoloBuddy is ready to listen
                </h2>
                <p className="text-sm sm:text-base text-[var(--color-ink-muted)] max-w-md leading-relaxed">
                  Record a voice question on the left or pick a starter question. BoloBuddy explains school ideas step by step, checks if anything sounded unclear, and reads answers aloud when your browser supports it.
                </p>
              </div>
            )}

            {/* Loading AI Answer Card */}
            {isAskingAi && (
              <div className="glass-surface rounded-3xl p-8 flex items-center gap-4">
                <Loader2 className="w-7 h-7 text-[var(--color-ink)] animate-spin shrink-0" />
                <div>
                  <p className="text-base font-bold text-[var(--color-ink)]">
                    BoloBuddy is thinking carefully...
                  </p>
                  <p className="text-sm text-[var(--color-ink-muted)]">
                    Preparing a clear, simple explanation in your chosen language.
                  </p>
                </div>
              </div>
            )}

            {/* Active AI Answer Area */}
            {latestTurn && (
              <section className="glass-surface rounded-3xl p-6 sm:p-8 space-y-6">
                {/* Header: Subject, Detected Language & SpeechSynthesis Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-white/65">
                  <div>
                    <p
                      className="text-xs font-semibold text-[var(--color-ink-subtle)] mb-1"
                      style={{ fontFamily: 'var(--font-label)' }}
                    >
                      {latestTurn.response.subject} · {latestTurn.response.detectedLanguage} · {latestTurn.timestamp}
                    </p>
                    <h2 className={`text-xl sm:text-2xl font-bold text-[var(--color-ink)] ${activeScriptClass}`}>
                      {latestTurn.response.answerTitle}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isSpeaking ? (
                      <button
                        type="button"
                        onClick={stopSpeaking}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F5B69E]/65 hover:bg-[#F5B69E]/85 border border-white/80 text-xs sm:text-sm font-semibold text-[var(--color-ink)] whitespace-nowrap"
                      >
                        <VolumeX className="w-4 h-4" aria-hidden="true" />
                        <span>Stop Speaking</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSpeakLatest}
                        disabled={!isTtsSupported}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl glass-btn-secondary text-xs sm:text-sm font-semibold text-[var(--color-ink)] whitespace-nowrap disabled:opacity-50"
                      >
                        <Volume2 className="w-4 h-4" aria-hidden="true" />
                        <span>Speak Answer</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Browser Speech Synthesis Availability Notice */}
                {(!isTtsSupported || speechNotice) && (
                  <p className="text-xs text-[var(--color-ink-muted)] bg-white/45 border border-white/70 rounded-xl px-3.5 py-2.5">
                    {speechNotice ||
                      'Browser speech playback is unavailable on this device, so the full answer is shown as text below.'}
                  </p>
                )}

                {/* Child's Question Recap */}
                <div className="rounded-2xl bg-[#E9E8F8]/75 border border-white/80 px-4 py-3">
                  <p
                    className="text-xs font-semibold text-[var(--color-ink-subtle)] mb-0.5"
                    style={{ fontFamily: 'var(--font-label)' }}
                  >
                    You asked
                  </p>
                  <p className={`text-sm sm:text-base font-medium text-[var(--color-ink)] ${activeScriptClass}`}>
                    “{latestTurn.childText}”
                  </p>
                </div>

                {/* Clarification Request if Ambiguous */}
                {latestTurn.response.needsClarification &&
                  latestTurn.response.clarificationQuestion && (
                    <div className="rounded-2xl bg-[#F5B69E]/30 border border-[#F5B69E]/80 p-5 space-y-2.5">
                      <p className="text-sm font-bold text-[var(--color-ink)] flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>Quick check before we go further</span>
                      </p>
                      <p className={`text-sm sm:text-base text-[var(--color-ink)] leading-relaxed ${activeScriptClass}`}>
                        {latestTurn.response.clarificationQuestion}
                      </p>
                      <div className="pt-1 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingTranscript(true);
                            transcriptInputRef.current?.focus();
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-white/70 hover:bg-white text-xs font-semibold text-[var(--color-ink)] border border-white"
                        >
                          Edit my question
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleMicToggle()}
                          className="px-3.5 py-1.5 rounded-xl bg-white/70 hover:bg-white text-xs font-semibold text-[var(--color-ink)] border border-white"
                        >
                          Repeat by voice
                        </button>
                      </div>
                    </div>
                  )}

                {/* Main Explanation */}
                <div className="space-y-4">
                  <p className={`text-base sm:text-lg text-[var(--color-ink)] leading-relaxed ${activeScriptClass}`}>
                    {latestTurn.response.explanation}
                  </p>

                  {latestTurn.response.steps.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {latestTurn.response.steps.map((step, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 rounded-2xl bg-white/55 border border-white/80 px-4 py-3"
                        >
                          <span
                            className="text-xs font-bold text-[var(--color-ink-subtle)] pt-0.5 tabular-nums shrink-0"
                            style={{ fontFamily: 'var(--font-label)' }}
                          >
                            0{i + 1}
                          </span>
                          <p className={`text-sm sm:text-base text-[var(--color-ink)] ${activeScriptClass}`}>
                            {step}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {latestTurn.response.everydayExample && (
                    <div
                      className="rounded-2xl p-4 sm:p-5 border border-white/80"
                      style={{
                        background:
                          'linear-gradient(120deg, rgba(141,185,240,0.22) 0%, rgba(245,182,158,0.22) 100%)',
                      }}
                    >
                      <p className="text-xs font-semibold text-[var(--color-ink-subtle)] flex items-center gap-1.5 mb-1">
                        <Lightbulb className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Everyday example</span>
                      </p>
                      <p className={`text-sm sm:text-base text-[var(--color-ink)] leading-relaxed ${activeScriptClass}`}>
                        {latestTurn.response.everydayExample}
                      </p>
                    </div>
                  )}
                </div>

                {/* Interactive Learning Action Buttons (All Real AI Calls) */}
                <div className="pt-2 space-y-3 border-t border-white/60">
                  <p
                    className="text-xs font-semibold text-[var(--color-ink-subtle)]"
                    style={{ fontFamily: 'var(--font-label)' }}
                  >
                    Keep exploring this idea
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void handleAskBoloBuddy(latestTurn.childText, 'simpler')}
                      className="px-3.5 py-2 rounded-xl bg-white/60 hover:bg-white/85 border border-white/80 text-xs sm:text-sm font-medium text-[var(--color-ink)] disabled:opacity-50"
                    >
                      Explain it simply
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void handleAskBoloBuddy(latestTurn.childText, 'example')}
                      className="px-3.5 py-2 rounded-xl bg-white/60 hover:bg-white/85 border border-white/80 text-xs sm:text-sm font-medium text-[var(--color-ink)] disabled:opacity-50"
                    >
                      Give me an example
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void handleGenerateQuiz()}
                      className="px-3.5 py-2 rounded-xl glass-btn-primary text-xs sm:text-sm font-semibold text-[var(--color-ink)] disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      {isLoadingQuiz ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      <span>Ask me a quiz question</span>
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void handleAskBoloBuddy(latestTurn.childText, 'summarise')}
                      className="px-3.5 py-2 rounded-xl bg-white/60 hover:bg-white/85 border border-white/80 text-xs sm:text-sm font-medium text-[var(--color-ink)] disabled:opacity-50"
                    >
                      Summarise what I learned
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void handleAskBoloBuddy(latestTurn.childText, 'switch_hindi')}
                      className="px-3.5 py-2 rounded-xl bg-white/60 hover:bg-white/85 border border-white/80 text-xs sm:text-sm font-medium text-[var(--color-ink)] disabled:opacity-50 font-[var(--font-devanagari)]"
                    >
                      Explain in Hindi
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void handleAskBoloBuddy(latestTurn.childText, 'switch_english')}
                      className="px-3.5 py-2 rounded-xl bg-white/60 hover:bg-white/85 border border-white/80 text-xs sm:text-sm font-medium text-[var(--color-ink)] disabled:opacity-50"
                    >
                      Explain in English
                    </button>
                  </div>
                </div>

                {/* Suggested Follow-Up Questions */}
                {latestTurn.response.followUpSuggestions.length > 0 && (
                  <div className="space-y-2">
                    <p
                      className="text-xs font-semibold text-[var(--color-ink-subtle)]"
                      style={{ fontFamily: 'var(--font-label)' }}
                    >
                      Suggested follow-up questions
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {latestTurn.response.followUpSuggestions.map((followUp) => (
                        <button
                          key={followUp}
                          type="button"
                          disabled={isBusy}
                          onClick={() => {
                            setTranscriptInput(followUp);
                            void handleAskBoloBuddy(followUp, 'ask');
                          }}
                          className={`text-left px-3.5 py-2 rounded-xl bg-[#8DB9F0]/22 hover:bg-[#8DB9F0]/38 border border-white/80 text-xs sm:text-sm font-medium text-[var(--color-ink)] transition-colors disabled:opacity-50 ${activeScriptClass}`}
                        >
                          {followUp}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Interactive Quiz Card (Real Gemini Quiz Generation) */}
            {activeQuiz && (
              <section className="glass-surface-peach rounded-3xl p-6 sm:p-7 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <span
                    className="text-xs font-semibold text-[var(--color-ink-subtle)]"
                    style={{ fontFamily: 'var(--font-label)' }}
                  >
                    Quick Check-In · {activeQuiz.subject}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveQuiz(null)}
                    aria-label="Close quiz"
                    className="text-xs font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                  >
                    Close
                  </button>
                </div>

                <h3 className={`text-lg sm:text-xl font-bold text-[var(--color-ink)] ${activeScriptClass}`}>
                  {activeQuiz.question}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeQuiz.options.map((opt, idx) => {
                    const isPicked = selectedQuizOption === idx;
                    const isCorrect = idx === activeQuiz.correctIndex;
                    const showResult = selectedQuizOption !== null;

                    let cardStyle =
                      'bg-white/60 hover:bg-white/85 border border-white/80 text-[var(--color-ink)]';
                    if (showResult && isCorrect) {
                      cardStyle =
                        'bg-[#8DB9F0]/45 border-2 border-[#8DB9F0] text-[var(--color-ink)] font-semibold';
                    } else if (showResult && isPicked && !isCorrect) {
                      cardStyle =
                        'bg-[#F5B69E]/45 border-2 border-[#F5B69E] text-[var(--color-ink)]';
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedQuizOption(idx)}
                        className={`text-left px-4 py-3 rounded-2xl text-sm transition-all flex items-center justify-between gap-2 ${cardStyle} ${activeScriptClass}`}
                      >
                        <span>{opt}</span>
                        {showResult && isCorrect && (
                          <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {selectedQuizOption !== null && (
                  <div className="rounded-2xl bg-white/65 border border-white/85 p-4 text-sm text-[var(--color-ink)] space-y-1">
                    <p className="font-bold">
                      {selectedQuizOption === activeQuiz.correctIndex
                        ? activeQuiz.encouragingFeedback
                        : 'Good try! Here is a helpful clue:'}
                    </p>
                    <p className={`text-[var(--color-ink-muted)] ${activeScriptClass}`}>
                      {activeQuiz.explanation}
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* Current Session Learning History */}
            {turns.length > 1 && (
              <section className="glass-surface rounded-3xl p-6 space-y-3">
                <h3
                  className="text-xs font-semibold text-[var(--color-ink-subtle)]"
                  style={{ fontFamily: 'var(--font-label)' }}
                >
                  Earlier in this session ({turns.length - 1})
                </h3>
                <div className="space-y-2.5">
                  {turns
                    .slice(0, -1)
                    .reverse()
                    .map((turn) => (
                      <div
                        key={turn.id}
                        className="rounded-2xl bg-white/50 border border-white/75 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[var(--color-ink)] truncate">
                            {turn.response.answerTitle}
                          </p>
                          <p className="text-xs text-[var(--color-ink-muted)] truncate">
                            “{turn.childText}” · {turn.response.subject}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setTranscriptInput(turn.childText)}
                          className="self-start sm:self-center text-xs font-semibold text-[var(--color-ink)] px-3 py-1.5 rounded-xl bg-white/70 hover:bg-white border border-white shrink-0"
                        >
                          Ask again
                        </button>
                      </div>
                    ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
