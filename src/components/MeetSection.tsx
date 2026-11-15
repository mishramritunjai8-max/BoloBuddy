import { UNDERSTANDING_PILLARS } from '../data/bolobuddyContent';
import meetListeningImage from '../assets/images/meet_bolobuddy_listening_1794731178289.jpg';

export default function MeetSection() {
  return (
    <section id="about" className="relative py-20 sm:py-28 px-5 sm:px-8 lg:px-10 overflow-hidden">
      {/* Soft Aurora Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 w-[640px] h-[420px] rounded-full aurora-orb-blue opacity-45"
      />

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          {/* Left Illustration Showcase inside Glass Frame */}
          <div className="lg:col-span-6 flex flex-col justify-between glass-surface rounded-3xl p-5 sm:p-7">
            <div className="relative overflow-hidden rounded-2xl aspect-[4/3] bg-[#E9E8F8] border border-white/75">
              <img
                src={meetListeningImage}
                alt="Editorial illustration of an open notebook illuminated by gentle acoustic sound curves and a warm peach orb"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="pt-6 px-1">
              <p
                className="text-xs font-semibold text-[var(--color-ink-subtle)] mb-2"
                style={{ fontFamily: 'var(--font-label)' }}
              >
                Patient Conversational Design
              </p>
              <p className="text-base sm:text-lg font-medium text-[var(--color-ink)] leading-relaxed">
                Instead of treating every pause like the end of a command, BoloBuddy follows a child&apos;s curiosity at their own rhythm — meeting hesitation with gentle clarity.
              </p>
            </div>
          </div>

          {/* Right Heading & 5 Core Understanding Pillars */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <p
              className="text-xs sm:text-sm font-semibold tracking-wide text-[var(--color-ink-subtle)] mb-3"
              style={{ fontFamily: 'var(--font-label)' }}
            >
              Meet BoloBuddy
            </p>
            <h2 className="text-[clamp(1.85rem,3.4vw,2.85rem)] font-bold leading-[1.14] text-[var(--color-ink)] mb-8">
              More than recognition. Real understanding.
            </h2>

            <div className="space-y-3.5">
              {UNDERSTANDING_PILLARS.map((pillar) => (
                <div
                  key={pillar.index}
                  className="glass-surface rounded-2xl px-5 py-4 transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <div className="flex items-start gap-4">
                    <span
                      className="text-xs font-semibold text-[var(--color-ink-subtle)] pt-1 tabular-nums shrink-0"
                      style={{ fontFamily: 'var(--font-label)' }}
                    >
                      {pillar.index}
                    </span>
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-[var(--color-ink)] mb-1">
                        {pillar.title}
                      </h3>
                      <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
                        {pillar.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
