import { Menu, X } from 'lucide-react';
import { useState } from 'react';

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'The Problem', href: '#problem' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Languages', href: '#languages' },
  { label: 'About', href: '#about' },
];

interface NavbarProps {
  onStartLearning: () => void;
}

export default function Navbar({ onStartLearning }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 px-4 sm:px-6 lg:px-10 pt-3 sm:pt-4">
      <div className="max-w-7xl mx-auto">
        <div className="glass-nav rounded-2xl px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <a
            href="#home"
            className="flex items-center gap-2.5 text-[var(--color-ink)] font-bold text-lg tracking-tight whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8DB9F0] rounded-lg"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="shrink-0"
            >
              <circle cx="12" cy="12" r="10" fill="url(#boloBrandGrad)" fillOpacity="0.92" />
              <path
                d="M8.5 12C8.5 10.067 10.067 8.5 12 8.5C13.933 8.5 15.5 10.067 15.5 12"
                stroke="#1D2B40"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <path
                d="M10.5 14.5C11.35 15.2 12.65 15.2 13.5 14.5"
                stroke="#1D2B40"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="boloBrandGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#8DB9F0" />
                  <stop offset="1" stopColor="#F5B69E" />
                </linearGradient>
              </defs>
            </svg>
            <span>BoloBuddy AI</span>
          </a>

          {/* Zone 2: Desktop Nav Links */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-6 lg:gap-7 text-sm font-medium text-[var(--color-ink-muted)]"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="whitespace-nowrap shrink-0 hover:text-[var(--color-ink)] transition-colors duration-150 relative py-1 after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[1.5px] after:w-0 hover:after:w-full after:bg-[#8DB9F0] after:transition-all after:duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8DB9F0] rounded"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Zone 3: Single Primary Action + Mobile Trigger */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onStartLearning}
              className="hidden sm:inline-flex items-center justify-center glass-btn-primary text-[var(--color-ink)] font-semibold text-xs sm:text-sm px-4 py-2 rounded-xl whitespace-nowrap shrink-0 transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D2B40]"
            >
              Start Learning
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileOpen}
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl glass-btn-secondary text-[var(--color-ink)]"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileOpen && (
          <div className="md:hidden mt-2 glass-surface rounded-2xl p-4 flex flex-col gap-1.5">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--color-ink)] hover:bg-white/45 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onStartLearning();
              }}
              className="mt-2 inline-flex items-center justify-center glass-btn-primary text-[var(--color-ink)] font-semibold text-sm px-4 py-2.5 rounded-xl"
            >
              Start Learning
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
