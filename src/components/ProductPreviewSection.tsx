import { Mic, Sparkles } from 'lucide-react';
import { useState } from 'react';
import {
  PREVIEW_LANGUAGES,
  PREVIEW_TOPICS,
  type PreviewLanguageId,
} from '../data/bolobuddyContent';

const WAVE_BARS = [0.45, 0.8, 0.55, 1, 0.7, 0.9, 0.5, 0.85, 0.6, 0.95, 0.65, 0.75, 0.5, 0.85, 0.45];

function getScriptClass(lang: PreviewLanguageId): string {
  if (lang === 'hindi' || lang === 'marathi') return 'font-[var(--font-devanagari)]';
  if (lang === 'bengali') return 'font-[var(--font-bengali)]';
  if (lang === 'tamil') return 'font-[var(--font-tamil)]';
  if (lang === 'telugu') return 'font-[var(--font-telugu)]';
  return 'font-sans';
}

interface ProductPreviewSectionProps {
  onOpenWorkspace: (initialTopic?: string) => void;
}

export default function ProductPreviewSection({
  onOpenWorkspace,
}: ProductPreviewSectionProps) {
  const [selectedLang, setSelectedLang] = useState<PreviewLanguageId>('hinglish');
  const [selectedTopicId, setSelectedTopicId] = useState<string>(PREVIEW_TOPICS[0].id);

  const currentTopic =
    PREVIEW_TOPICS.find((t) => t.id === selectedTopicId) ?? PREVIEW_TOPICS[0];
  const activeTranscript = currentTopic.transcripts[selectedLang] ?? currentTopic.transcripts.hinglish;
  const scriptClass = getScriptClass(selectedLang);

  return (
    <section
      id="preview"
      className="relative py-20 sm:py-28 px-5 sm:px-8 lg:px-10 overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 w-[720px] h-[520px] rounded-full aurora-orb-blue opacity-45"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-1/4 w-[480px] h-[480px] rounded-full aurora-orb-peach opacity-45"
      />

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 sm:mb-12">
          <div className="max-w-3xl">
            <p
              className="text-xs sm:text-sm font-semibold tracking-wide text-[var(--color-ink-subtle)] mb-3"
              style={{ fontFamily: 'var(--font-label)' }}
            >
              Product Preview · Interface Concept
            </p>
            <h2 className="text-[clamp(1.85rem,3.4vw,2.85rem)] font-bold leading-[1.14] text-[var(--color-ink)] mb-4">
              A calm space built for young voices.
            </h2>
            <p className="text-base sm:text-lg text-[var(--color-ink-muted)] max-w-2xl">
              Explore sample conversations below, or launch the live Learning Workspace to speak with your own microphone.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenWorkspace(currentTopic.label)}
            className="glass-btn-primary inline-flex items-center justify-center gap-2 text-[var(--color-ink)] font-semibold text-sm px-5 py-3 rounded-2xl whitespace-nowrap shrink-0 transition-transform duration-200 hover:-translate-y-0.5"
          >
            <Mic className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Try Live With Your Voice</span>
          </button>
        </div>

        {/* Main Glassmorphism Learning Interface Frame */}
        <div className="glass-surface rounded-[28px] p-5 sm:p-8 lg:p-10">
          {/* Top Bar: Language Selector + Topic Metadata */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-white/65">
            <div>
              <p
                className="text-xs font-semibold text-[var(--color-ink-subtle)] mb-1"
                style={{ fontFamily: 'var(--font-label)' }}
              >
                Language Selector
              </p>
              <div
                className="flex flex-wrap items-center gap-1.5"
                role="tablist"
                aria-label="Preview language selector"
              >
                {PREVIEW_LANGUAGES.map((lang) => {
                  const isActive = lang.id === selectedLang;
                  return (
                    <button
                      key={lang.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setSelectedLang(lang.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D2B40] ${
                        isActive
                          ? 'glass-btn-primary text-[var(--color-ink)] font-semibold'
                          : 'bg-white/45 hover:bg-white/75 text-[var(--color-ink-muted)] border border-white/70'
                      }`}
                    >
                      {lang.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <p
              className="text-xs font-medium text-[var(--color-ink-subtle)] shrink-0"
              style={{ fontFamily: 'var(--font-label)' }}
            >
              {currentTopic.ageGroup} · Sample interface preview
            </p>
          </div>

          {/* Center Split: Voice Control & Transcript (Left) + Educational Answer Preview (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 pt-7">
            {/* Left Column: Microphone, Listening Indicator, Waveform, Conversation Transcript */}
            <div className="lg:col-span-5 flex flex-col gap-5">
              <div className="rounded-2xl bg-white/55 border border-white/80 p-5 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => onOpenWorkspace(currentTopic.label)}
                  aria-label="Open live microphone workspace to speak your question"
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-200 hover:scale-[1.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D2B40] glass-btn-primary text-[var(--color-ink)]"
                >
                  <Mic className="w-6 h-6" aria-hidden="true" />
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className="text-xs font-semibold text-[var(--color-ink)]"
                      style={{ fontFamily: 'var(--font-label)' }}
                    >
                      Tap mic to open live voice &amp; editable transcript workspace
                    </span>
                  </div>

                  {/* Sound Waveform */}
                  <div
                    className="h-8 flex items-center gap-1"
                    aria-hidden="true"
                  >
                    {WAVE_BARS.map((heightRatio, idx) => (
                      <span
                        key={idx}
                        className="flex-1 rounded-full wave-bar"
                        style={{
                          height: `${Math.round(heightRatio * 28)}px`,
                          background:
                            idx % 2 === 0
                              ? 'linear-gradient(180deg, #8DB9F0 0%, #F5B69E 100%)'
                              : '#8DB9F0',
                          animationDelay: `${idx * 0.08}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Conversation Transcript */}
              <div className="rounded-2xl bg-white/50 border border-white/75 p-5 space-y-4 flex-1">
                <p
                  className="text-xs font-semibold text-[var(--color-ink-subtle)]"
                  style={{ fontFamily: 'var(--font-label)' }}
                >
                  Conversation Transcript
                </p>

                <div className="rounded-2xl bg-[#E9E8F8]/75 border border-white/80 p-4">
                  <p
                    className="text-xs font-medium text-[var(--color-ink-subtle)] mb-1"
                    style={{ fontFamily: 'var(--font-label)' }}
                  >
                    Child speaking
                  </p>
                  <p className={`text-sm sm:text-base font-medium text-[var(--color-ink)] leading-relaxed ${scriptClass}`}>
                    {activeTranscript.childPrompt}
                  </p>
                </div>

                <div
                  className="rounded-2xl p-4 border border-white/80"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(141, 185, 240, 0.24) 0%, rgba(245, 182, 158, 0.22) 100%)',
                  }}
                >
                  <p
                    className="text-xs font-medium text-[var(--color-ink-subtle)] mb-1"
                    style={{ fontFamily: 'var(--font-label)' }}
                  >
                    BoloBuddy listens &amp; responds
                  </p>
                  <p className={`text-sm sm:text-base text-[var(--color-ink)] leading-relaxed ${scriptClass}`}>
                    {activeTranscript.buddyClarification}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Educational Answer Preview + Suggested Learning Topics */}
            <div className="lg:col-span-7 flex flex-col justify-between gap-6">
              <div className="rounded-2xl bg-white/62 border border-white/85 p-6 sm:p-7 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-[var(--color-ink-muted)]" aria-hidden="true" />
                    <span
                      className="text-xs font-semibold text-[var(--color-ink-subtle)]"
                      style={{ fontFamily: 'var(--font-label)' }}
                    >
                      Educational Answer Preview
                    </span>
                  </div>

                  <h3 className={`text-xl sm:text-2xl font-bold text-[var(--color-ink)] mb-3 ${scriptClass}`}>
                    {activeTranscript.answerTitle}
                  </h3>

                  <p className={`text-sm sm:text-base text-[var(--color-ink-muted)] leading-relaxed mb-6 ${scriptClass}`}>
                    {activeTranscript.answerBody}
                  </p>
                </div>

                <div
                  className="rounded-xl p-4 border border-white/80"
                  style={{
                    background:
                      'linear-gradient(90deg, rgba(233, 232, 248, 0.72) 0%, rgba(245, 182, 158, 0.26) 100%)',
                  }}
                >
                  <p
                    className="text-xs font-semibold text-[var(--color-ink-subtle)] mb-1"
                    style={{ fontFamily: 'var(--font-label)' }}
                  >
                    Gentle takeaway
                  </p>
                  <p className={`text-sm font-medium text-[var(--color-ink)] leading-relaxed ${scriptClass}`}>
                    {activeTranscript.keyTakeaway}
                  </p>
                </div>
              </div>

              {/* Suggested Learning Topics */}
              <div>
                <p
                  className="text-xs font-semibold text-[var(--color-ink-subtle)] mb-2.5"
                  style={{ fontFamily: 'var(--font-label)' }}
                >
                  Suggested Learning Topics
                </p>
                <div className="flex flex-wrap gap-2">
                  {PREVIEW_TOPICS.map((topic) => {
                    const isSelected = topic.id === selectedTopicId;
                    return (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => setSelectedTopicId(topic.id)}
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D2B40] ${
                          isSelected
                            ? 'glass-btn-primary text-[var(--color-ink)] font-semibold'
                            : 'bg-white/48 hover:bg-white/75 text-[var(--color-ink)] border border-white/75'
                        }`}
                      >
                        {topic.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <p className="mt-6 pt-4 border-t border-white/50 text-xs text-[var(--color-ink-subtle)]">
            Sample visual preview above — click &ldquo;Try Live With Your Voice&rdquo; to open the real microphone &amp; Gemini AI workspace.
          </p>
        </div>
      </div>
    </section>
  );
}
