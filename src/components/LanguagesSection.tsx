import { useState } from 'react';
import { HINGLISH_SAMPLES, SUPPORTED_LANGUAGES } from '../data/bolobuddyContent';

export default function LanguagesSection() {
  const [selectedHinglishId, setSelectedHinglishId] = useState(HINGLISH_SAMPLES[0].id);
  const currentHinglish =
    HINGLISH_SAMPLES.find((sample) => sample.id === selectedHinglishId) ?? HINGLISH_SAMPLES[0];

  return (
    <section
      id="languages"
      className="relative py-20 sm:py-28 px-5 sm:px-8 lg:px-10 overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-[-10%] w-[520px] h-[520px] rounded-full aurora-orb-blue opacity-40"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-10 right-[-8%] w-[460px] h-[460px] rounded-full aurora-orb-peach opacity-45"
      />

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="max-w-3xl mb-12 sm:mb-14">
          <p
            className="text-xs sm:text-sm font-semibold tracking-wide text-[var(--color-ink-subtle)] mb-3"
            style={{ fontFamily: 'var(--font-label)' }}
          >
            Six Languages · Natural Hinglish
          </p>
          <h2 className="text-[clamp(1.85rem,3.4vw,2.85rem)] font-bold leading-[1.14] text-[var(--color-ink)] mb-4">
            Learning feels closest when it speaks the language of home.
          </h2>
          <p className="text-base sm:text-lg text-[var(--color-ink-muted)] max-w-2xl">
            Designed for six Indian and global languages — alongside the everyday Hinglish children naturally speak when mixing school terms with home conversation.
          </p>
        </div>

        {/* 6 Languages Native Script Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {SUPPORTED_LANGUAGES.map((lang, idx) => (
            <div
              key={lang.id}
              className={`rounded-3xl p-6 sm:p-7 transition-transform duration-200 hover:-translate-y-0.5 ${
                idx % 2 === 0 ? 'glass-surface' : 'glass-surface-peach'
              }`}
            >
              <div className="flex items-baseline justify-between gap-3 mb-4">
                <span
                  className="text-xs font-semibold text-[var(--color-ink-subtle)]"
                  style={{ fontFamily: 'var(--font-label)' }}
                >
                  {lang.name}
                </span>
                <span className="h-1.5 w-8 rounded-full bg-gradient-to-r from-[#8DB9F0] to-[#F5B69E]" />
              </div>

              <p
                className={`text-2xl sm:text-3xl font-semibold text-[var(--color-ink)] mb-4 ${lang.scriptClass}`}
                lang={lang.id === 'hindi' ? 'hi' : lang.id === 'bengali' ? 'bn' : lang.id === 'tamil' ? 'ta' : lang.id === 'telugu' ? 'te' : lang.id === 'marathi' ? 'mr' : 'en'}
              >
                {lang.nativeName}
              </p>

              <p
                className={`text-sm sm:text-base font-medium text-[var(--color-ink)] leading-relaxed mb-2 ${lang.scriptClass}`}
              >
                “{lang.samplePhrase}”
              </p>
              <p className="text-xs sm:text-sm text-[var(--color-ink-muted)]">
                {lang.englishMeaning}
              </p>
            </div>
          ))}
        </div>

        {/* Hinglish Code-Switching Spotlight */}
        <div className="glass-surface-peach rounded-3xl p-6 sm:p-8 lg:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
            <div className="lg:col-span-6">
              <p
                className="text-xs font-semibold text-[var(--color-ink-subtle)] mb-2"
                style={{ fontFamily: 'var(--font-label)' }}
              >
                Bilingual Flow · Hindi + English
              </p>
              <h3 className="text-2xl sm:text-[26px] font-bold text-[var(--color-ink)] mb-3">
                Natural Hinglish conversations, never forced translation.
              </h3>
              <p className="text-sm sm:text-base text-[var(--color-ink-muted)] leading-relaxed mb-5">
                Children rarely stick to one strict vocabulary list. They mix English science and maths words seamlessly into Hindi sentences — and BoloBuddy listens to the whole thought effortlessly.
              </p>

              <div className="flex flex-wrap gap-2" role="group" aria-label="Hinglish conversation examples">
                {HINGLISH_SAMPLES.map((sample) => {
                  const active = sample.id === selectedHinglishId;
                  return (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => setSelectedHinglishId(sample.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D2B40] ${
                        active
                          ? 'glass-btn-primary text-[var(--color-ink)] font-semibold'
                          : 'bg-white/50 hover:bg-white/75 text-[var(--color-ink-muted)] border border-white/75'
                      }`}
                    >
                      {sample.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-6 rounded-2xl bg-white/58 border border-white/80 p-5 sm:p-6">
              <p
                className="text-xs font-medium text-[var(--color-ink-subtle)] mb-2"
                style={{ fontFamily: 'var(--font-label)' }}
              >
                Spoken Hinglish Example
              </p>
              <p className="text-lg sm:text-xl font-semibold text-[var(--color-ink)] leading-snug mb-3">
                {currentHinglish.spoken}
              </p>
              <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
                {currentHinglish.intent}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
