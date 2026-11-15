import { useState } from 'react';
import { SPEECH_CHALLENGES } from '../data/bolobuddyContent';

export default function ProblemSection() {
  const [activeId, setActiveId] = useState<string>(SPEECH_CHALLENGES[0].id);
  const activeChallenge =
    SPEECH_CHALLENGES.find((item) => item.id === activeId) ?? SPEECH_CHALLENGES[0];

  return (
    <section id="problem" className="relative py-20 sm:py-28 px-5 sm:px-8 lg:px-10 overflow-hidden">
      {/* Subtle Aurora Backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-10 right-[-10%] w-[520px] h-[520px] rounded-full aurora-orb-peach opacity-45"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-[-8%] w-[460px] h-[460px] rounded-full aurora-orb-blue opacity-40"
      />

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="max-w-3xl mb-12 sm:mb-16">
          <p
            className="text-xs sm:text-sm font-semibold tracking-wide text-[var(--color-ink-subtle)] mb-3"
            style={{ fontFamily: 'var(--font-label)' }}
          >
            The Problem
          </p>
          <h2 className="text-[clamp(1.85rem,3.4vw,2.85rem)] font-bold leading-[1.14] text-[var(--color-ink)] mb-4">
            Children don&apos;t speak like adults. Their technology should understand that.
          </h2>
          <p className="text-base sm:text-lg text-[var(--color-ink-muted)] max-w-2xl">
            Most voice tools expect crisp studio diction. Real children think out loud, switch languages mid-thought, and speak from lively homes.
          </p>
        </div>

        {/* Asymmetric Editorial Showcase: Featured Live Speech Context + Interactive Challenge Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Sticky Context Spotlight */}
          <div className="lg:col-span-5 glass-surface-peach rounded-3xl p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <span
                className="text-xs font-semibold text-[var(--color-ink-subtle)] tabular-nums"
                style={{ fontFamily: 'var(--font-label)' }}
              >
                Challenge {activeChallenge.index} · Real child speech
              </span>
              <span className="h-2 w-12 rounded-full bg-gradient-to-r from-[#8DB9F0] to-[#F5B69E]" />
            </div>

            <h3 className="text-2xl sm:text-[26px] font-bold text-[var(--color-ink)] mb-3">
              {activeChallenge.title}
            </h3>

            <p className="text-sm sm:text-base text-[var(--color-ink-muted)] leading-relaxed mb-7">
              {activeChallenge.summary}
            </p>

            <div className="rounded-2xl bg-white/55 border border-white/75 p-5 mb-5">
              <p
                className="text-xs font-medium text-[var(--color-ink-subtle)] mb-2"
                style={{ fontFamily: 'var(--font-label)' }}
              >
                How a child naturally asks
              </p>
              <p className="text-base sm:text-lg font-medium text-[var(--color-ink)] leading-snug">
                {activeChallenge.childExample}
              </p>
            </div>

            <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
              {activeChallenge.contextNote}
            </p>
          </div>

          {/* Right 7-Challenge Interactive Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SPEECH_CHALLENGES.map((challenge, idx) => {
              const isSelected = challenge.id === activeId;
              const isFullSpan = idx === SPEECH_CHALLENGES.length - 1;

              return (
                <button
                  key={challenge.id}
                  type="button"
                  onClick={() => setActiveId(challenge.id)}
                  className={`text-left rounded-2xl p-5 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D2B40] ${
                    isFullSpan ? 'sm:col-span-2' : ''
                  } ${
                    isSelected
                      ? 'glass-surface ring-1 ring-[#8DB9F0] -translate-y-0.5'
                      : 'bg-white/40 hover:bg-white/60 border border-white/65'
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-3 mb-2">
                    <span
                      className="text-xs font-semibold text-[var(--color-ink-subtle)] tabular-nums"
                      style={{ fontFamily: 'var(--font-label)' }}
                    >
                      {challenge.index}
                    </span>
                    <span
                      className={`text-xs font-medium transition-opacity ${
                        isSelected ? 'text-[var(--color-ink)] opacity-100' : 'text-[var(--color-ink-subtle)] opacity-0'
                      }`}
                      style={{ fontFamily: 'var(--font-label)' }}
                    >
                      Selected
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-semibold text-[var(--color-ink)] mb-1.5">
                    {challenge.title}
                  </h3>
                  <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
                    {challenge.summary}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
