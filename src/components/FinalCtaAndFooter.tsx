import { ArrowUpRight } from 'lucide-react';

interface FinalCtaAndFooterProps {
  onStartLearning: () => void;
}

export default function FinalCtaAndFooter({ onStartLearning }: FinalCtaAndFooterProps) {
  return (
    <>
      {/* SECTION 8 — FINAL CTA */}
      <section className="relative py-20 sm:py-28 px-5 sm:px-8 lg:px-10 overflow-hidden">
        <div className="max-w-5xl mx-auto relative">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-16 -left-12 w-72 h-72 rounded-full aurora-orb-blue opacity-60"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-16 -right-12 w-72 h-72 rounded-full aurora-orb-peach opacity-60"
          />

          <div className="relative z-10 glass-surface-peach rounded-[32px] px-6 py-14 sm:px-12 sm:py-16 text-center">
            <p
              className="text-xs sm:text-sm font-semibold tracking-wide text-[var(--color-ink-subtle)] mb-3"
              style={{ fontFamily: 'var(--font-label)' }}
            >
              Your voice. Your language. Your learning buddy.
            </p>
            <h2 className="text-[clamp(2rem,3.8vw,3.1rem)] font-extrabold leading-[1.12] text-[var(--color-ink)] max-w-2xl mx-auto mb-4">
              Every question deserves to be understood.
            </h2>
            <p className="text-base sm:text-lg text-[var(--color-ink-muted)] max-w-xl mx-auto mb-8">
              Let children learn confidently, one conversation at a time.
            </p>

            <button
              type="button"
              onClick={onStartLearning}
              className="glass-btn-primary inline-flex items-center justify-center gap-2 text-[var(--color-ink)] font-semibold text-sm sm:text-base px-7 py-3.5 rounded-2xl whitespace-nowrap transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D2B40]"
            >
              <span>Discover BoloBuddy AI</span>
              <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 9 — MINIMAL FOOTER */}
      <footer className="border-t border-white/70 bg-white/30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-5">
              <a
                href="#home"
                className="inline-block text-lg font-bold text-[var(--color-ink)] mb-2.5"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                BoloBuddy AI
              </a>
              <p className="text-sm text-[var(--color-ink-muted)] max-w-sm leading-relaxed">
                A voice-first educational learning companion crafted for children aged 6–14 across six languages and natural Hinglish. Voice clips are processed temporarily in memory and never stored permanently.
              </p>
            </div>

            <nav
              aria-label="Footer navigation"
              className="md:col-span-4 flex flex-wrap gap-x-6 gap-y-2.5 text-sm font-medium text-[var(--color-ink-muted)]"
            >
              <a href="#home" className="hover:text-[var(--color-ink)] transition-colors">
                Home
              </a>
              <a href="#problem" className="hover:text-[var(--color-ink)] transition-colors">
                The Problem
              </a>
              <a href="#about" className="hover:text-[var(--color-ink)] transition-colors">
                Meet BoloBuddy
              </a>
              <a href="#how-it-works" className="hover:text-[var(--color-ink)] transition-colors">
                How It Works
              </a>
              <a href="#languages" className="hover:text-[var(--color-ink)] transition-colors">
                Languages
              </a>
              <button
                type="button"
                onClick={onStartLearning}
                className="hover:text-[var(--color-ink)] transition-colors font-semibold text-[var(--color-ink)]"
              >
                Learning Workspace
              </button>
            </nav>

            <div className="md:col-span-3 md:text-right text-xs text-[var(--color-ink-subtle)] space-y-1">
              <p className="font-medium text-[var(--color-ink-muted)]">
                Voice-First EdTech · Ages 6–14
              </p>
              <p>Hindi · English · Bengali · Tamil · Telugu · Marathi</p>
              <p>© {new Date().getFullYear()} BoloBuddy AI</p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
