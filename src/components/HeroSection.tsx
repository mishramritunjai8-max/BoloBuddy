import { motion } from 'motion/react';
import { ArrowRight, Mic } from 'lucide-react';
import heroBoyImage from '../assets/images/hero_bolobuddy_boy_1794731177836.jpg';

interface HeroSectionProps {
  onStartLearning: () => void;
}

export default function HeroSection({ onStartLearning }: HeroSectionProps) {
  return (
    <section
      id="home"
      className="relative min-h-screen w-full overflow-hidden flex items-end md:items-center"
    >
      {/* Full-Bleed Hero Artwork */}
      <div className="absolute inset-0 z-0 bg-[#E9E8F8]">
        <img
          src={heroBoyImage}
          alt="Friendly young Indian boy speaking naturally into a microphone with gentle sound waves and warm yellow sunshine behind him"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-[74%_24%] sm:object-[68%_32%] md:object-center select-none"
        />

        {/* Subtle Brand-Coloured Readability Scrim (Left for Desktop, Soft Bottom/Top Balance for Mobile) */}
        <div
          aria-hidden="true"
          className="hidden md:block absolute inset-0"
          style={{
            background:
              'linear-gradient(96deg, rgba(233, 232, 248, 0.90) 0%, rgba(233, 232, 248, 0.72) 34%, rgba(141, 185, 240, 0.16) 54%, rgba(245, 182, 158, 0.04) 76%, rgba(233, 232, 248, 0) 100%)',
          }}
        />
        <div
          aria-hidden="true"
          className="md:hidden absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(233, 232, 248, 0.12) 0%, rgba(233, 232, 248, 0.15) 38%, rgba(233, 232, 248, 0.86) 66%, rgba(233, 232, 248, 0.95) 100%)',
          }}
        />
      </div>

      {/* Subtle Brand Aurora Mist Layer */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full aurora-orb-blue opacity-45 z-[1]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 left-1/4 w-[380px] h-[380px] rounded-full aurora-orb-peach opacity-40 z-[1]"
      />

      {/* Hero Editorial Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 pt-28 pb-12 sm:pb-16 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-xl lg:max-w-[560px]"
        >
          <p
            className="text-xs sm:text-sm font-medium tracking-wide text-[var(--color-ink-muted)] mb-4"
            style={{ fontFamily: 'var(--font-label)' }}
          >
            Voice-First Learning Companion · Ages 6–14
          </p>

          <h1
            className="text-[clamp(2.25rem,4.4vw,3.85rem)] font-extrabold leading-[1.08] text-[var(--color-ink)] mb-5"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Every child has a voice. Let&apos;s understand it.
          </h1>

          <p className="text-lg sm:text-xl font-medium text-[var(--color-ink)] mb-3">
            Your voice. Your language. Your learning buddy.
          </p>

          <p className="text-base text-[var(--color-ink-muted)] leading-relaxed max-w-lg mb-8">
            Meet BoloBuddy AI — a learning companion that listens carefully, understands different languages, and makes learning feel natural.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
            <button
              type="button"
              onClick={onStartLearning}
              className="glass-btn-primary inline-flex items-center justify-center gap-2.5 text-[var(--color-ink)] font-semibold text-sm sm:text-base px-6 py-3.5 rounded-2xl whitespace-nowrap transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D2B40]"
            >
              <Mic className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Start Learning</span>
            </button>

            <a
              href="#how-it-works"
              className="glass-btn-secondary inline-flex items-center justify-center gap-2 text-[var(--color-ink)] font-medium text-sm sm:text-base px-6 py-3.5 rounded-2xl whitespace-nowrap transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D2B40]"
            >
              <span>Discover How It Works</span>
              <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
