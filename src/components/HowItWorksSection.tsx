import { BookOpen, Ear, Mic, Sparkles } from 'lucide-react';
import { PROCESS_STEPS, type ProcessStep } from '../data/bolobuddyContent';

function StepIcon({ stepKey }: { stepKey: ProcessStep['key'] }) {
  switch (stepKey) {
    case 'speak':
      return <Mic className="w-5 h-5 text-[var(--color-ink)]" aria-hidden="true" />;
    case 'listen':
      return <Ear className="w-5 h-5 text-[var(--color-ink)]" aria-hidden="true" />;
    case 'understand':
      return <Sparkles className="w-5 h-5 text-[var(--color-ink)]" aria-hidden="true" />;
    case 'learn':
      return <BookOpen className="w-5 h-5 text-[var(--color-ink)]" aria-hidden="true" />;
  }
}

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="relative py-20 sm:py-28 px-5 sm:px-8 lg:px-10 overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 right-1/4 w-[480px] h-[480px] rounded-full aurora-orb-blue opacity-40"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-16 left-1/4 w-[440px] h-[440px] rounded-full aurora-orb-peach opacity-40"
      />

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="max-w-2xl mb-14">
          <p
            className="text-xs sm:text-sm font-semibold tracking-wide text-[var(--color-ink-subtle)] mb-3"
            style={{ fontFamily: 'var(--font-label)' }}
          >
            How It Works
          </p>
          <h2 className="text-[clamp(1.85rem,3.4vw,2.85rem)] font-bold leading-[1.14] text-[var(--color-ink)] mb-4">
            A calm, natural rhythm built around curiosity.
          </h2>
          <p className="text-base sm:text-lg text-[var(--color-ink-muted)]">
            Four simple moments turn an everyday spoken wonder into genuine clarity.
          </p>
        </div>

        {/* Connected 4-Step Flow */}
        <div className="relative">
          {/* Desktop Connecting Gradient Line */}
          <div
            aria-hidden="true"
            className="hidden lg:block absolute top-11 left-[12%] right-[12%] h-[2px] bg-gradient-to-r from-[#8DB9F0] via-[#E9E8F8] to-[#F5B69E] opacity-85"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
            {PROCESS_STEPS.map((item, idx) => (
              <div
                key={item.step}
                className={`relative rounded-3xl p-6 sm:p-7 transition-transform duration-200 hover:-translate-y-1 ${
                  idx % 2 === 0 ? 'glass-surface' : 'glass-surface-peach'
                }`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center border border-white/80 shadow-sm"
                    style={{
                      background:
                        idx % 2 === 0
                          ? 'linear-gradient(135deg, rgba(141,185,240,0.45), rgba(233,232,248,0.85))'
                          : 'linear-gradient(135deg, rgba(245,182,158,0.48), rgba(233,232,248,0.85))',
                    }}
                  >
                    <StepIcon stepKey={item.key} />
                  </div>
                  <span
                    className="text-xs font-semibold text-[var(--color-ink-subtle)] tabular-nums"
                    style={{ fontFamily: 'var(--font-label)' }}
                  >
                    Step {item.step}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-[var(--color-ink)] mb-2.5">
                  {item.title}
                </h3>
                <p className="text-sm sm:text-base text-[var(--color-ink-muted)] leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
