/**
 * Unified Navigation — Material Design 3
 *
 * Bottom nav  (<600px):    4 items, 80dp height, pill active indicator,
 *                           always-visible labels, hide-on-scroll-down.
 * Nav rail    (600–840px): 80dp wide, pill active indicator, FAB at top.
 * Sidebar     (>840px):   handled by Sidebar component.
 *
 * Page transitions: fade-through for tab switches, shared-axis-Y for drill-down.
 * No expandable sub-menus — bottom nav items are direct destinations (M3 spec).
 */

import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';

const GOOGLE_SANS = "'Google Sans Display', 'Roboto Flex', sans-serif";

interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

function MIcon({ name, size = 24, filled = false }: { name: string; size?: number; filled?: boolean }) {
  return (
    <span
      className={`material-symbols-rounded${filled ? ' filled' : ''}`}
      style={{ fontSize: size, lineHeight: 1 }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}

// Exactly 4 bottom nav items per M3 spec — direct destinations, no sub-menus
const NAV_ITEMS: NavItem[] = [
  { id: 'home',     label: 'Home',     icon: 'home',   path: '/' },
  { id: 'learn',    label: 'Learn',    icon: 'school', path: '/channels' },
  { id: 'practice', label: 'Practice', icon: 'fitness_center', path: '/practice' },
  { id: 'profile',  label: 'Profile',  icon: 'person', path: '/profile' },
];

function getActiveSection(location: string): string {
  if (location === '/') return 'home';
  // Learn: channels, certifications, learning paths, and deep routes within them
  if (location.startsWith('/channels') || location.startsWith('/channel/') ||
      location.startsWith('/certifications') || location.startsWith('/certification/') ||
      location.startsWith('/learning-paths') || location.startsWith('/personalized-path')) return 'learn';
  // Practice: hub + all practice modes and their deep routes
  if (location.startsWith('/practice') || location.startsWith('/voice-interview') ||
      location.startsWith('/voice-session') || location.startsWith('/tests') ||
      location.startsWith('/test/') || location.startsWith('/coding') ||
      location.startsWith('/challenge/') || location.startsWith('/review') ||
      location.startsWith('/flashcards')) return 'practice';
  // Profile: account, progress, bookmarks
  if (location.startsWith('/profile') || location.startsWith('/progress') ||
      location.startsWith('/badges') || location.startsWith('/bookmarks') ||
      location.startsWith('/about') || location.startsWith('/manage-subscriptions')) return 'profile';
  return 'home';
}

function useScrollHide() {
  const lastY = useRef(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y > lastY.current + 8) setHidden(true);
      else if (y < lastY.current - 8) setHidden(false);
      lastY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return hidden;
}

// ─── Mobile Bottom Nav (<600px) ──────────────────────────────────────────────

export function MobileBottomNav() {
  const [location, setLocation] = useLocation();
  const activeSection = getActiveSection(location);
  const navHidden = useScrollHide();
  const navRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    navRefs.current = navRefs.current.slice(0, NAV_ITEMS.length);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let targetIndex: number | null = null;
    if (e.key === 'ArrowRight') {
      targetIndex = (index + 1) % NAV_ITEMS.length;
    } else if (e.key === 'ArrowLeft') {
      targetIndex = (index - 1 + NAV_ITEMS.length) % NAV_ITEMS.length;
    } else if (e.key === 'Home') {
      targetIndex = 0;
      e.preventDefault();
    } else if (e.key === 'End') {
      targetIndex = NAV_ITEMS.length - 1;
      e.preventDefault();
    }
    if (targetIndex !== null) {
      e.preventDefault();
      navRefs.current[targetIndex]?.focus();
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 sm:hidden transition-transform duration-300"
      style={{
        transform: navHidden ? 'translateY(100%)' : 'translateY(0)',
        background: 'var(--md-sys-color-surface-container)',
        borderTop: '1px solid var(--md-sys-color-outline-variant)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
      aria-label="Main navigation"
    >
      {/* 80dp = h-20 */}
      <div className="flex items-center justify-around h-20 px-2 max-w-xl mx-auto" role="list">
        {NAV_ITEMS.map((item, index) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              ref={(el) => { navRefs.current[index] = el; }}
              onClick={() => setLocation(item.path)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              data-testid={`bottom-nav-${item.id}`}
              className="flex flex-col items-center justify-center flex-1 gap-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--md-sys-color-primary)]"
              style={{
                minWidth: 48,
                minHeight: 48,
                color: isActive
                  ? 'var(--md-sys-color-on-secondary-container)'
                  : 'var(--md-sys-color-on-surface-variant)',
                fontFamily: GOOGLE_SANS,
                background: 'transparent',
                border: 'none',
              }}
            >
              {/* M3 pill active indicator: 64dp wide × 32dp tall */}
              <div className="relative flex items-center justify-center" style={{ width: 64, height: 32 }}>
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-pill"
                    className="absolute inset-0 rounded-full"
                    style={{ background: 'var(--md-sys-color-secondary-container)' }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative">
                  <MIcon name={item.icon} size={24} filled={isActive} />
                </span>
              </div>

              {/* Always-visible label — M3 label-medium */}
              <span
                className="text-[12px] leading-none"
                style={{
                  fontWeight: isActive ? 700 : 500,
                  letterSpacing: '0.005em',
                  color: isActive
                    ? 'var(--md-sys-color-on-surface)'
                    : 'var(--md-sys-color-on-surface-variant)',
                }}
                aria-hidden="true"
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Nav Rail (600-840px tablet per M3 §12.2) ────────────────────────────────────────────

export function NavRail() {
  const [location, setLocation] = useLocation();
  const activeSection = getActiveSection(location);
  const railRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    railRefs.current = railRefs.current.slice(0, NAV_ITEMS.length);
  }, []);

  const handleRailKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let targetIndex: number | null = null;
    if (e.key === 'ArrowDown') {
      targetIndex = (index + 1) % NAV_ITEMS.length;
    } else if (e.key === 'ArrowUp') {
      targetIndex = (index - 1 + NAV_ITEMS.length) % NAV_ITEMS.length;
    } else if (e.key === 'Home') {
      targetIndex = 0;
      e.preventDefault();
    } else if (e.key === 'End') {
      targetIndex = NAV_ITEMS.length - 1;
      e.preventDefault();
    }
    if (targetIndex !== null) {
      e.preventDefault();
      railRefs.current[targetIndex]?.focus();
    }
  };

  return (
    <nav
      className="fixed left-0 top-0 bottom-0 z-40 hidden sm:flex lg:hidden flex-col items-center py-3 gap-1"
      aria-label="Navigation rail"
      style={{
        width: 80,
        background: 'var(--md-sys-color-surface)',
        borderRight: '1px solid var(--md-sys-color-outline-variant)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
      }}
    >
      {/* FAB at top — M3 rail spec */}
      <button
        onClick={() => setLocation('/practice')}
        className="flex items-center justify-center rounded-2xl mb-4 mt-2 shrink-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--md-sys-color-primary)]"
        style={{
          width: 56,
          height: 56,
          minWidth: 48,
          minHeight: 48,
          background: 'var(--md-sys-color-primary-container)',
          color: 'var(--md-sys-color-on-primary-container)',
          boxShadow: '0 1px 3px color-mix(in srgb, var(--md-sys-color-shadow) 30%, transparent), 0 4px 8px color-mix(in srgb, var(--md-sys-color-shadow) 15%, transparent)',
        }}
        aria-label="Practice"
        data-testid="rail-fab"
        onMouseEnter={(e) => (e.currentTarget.style.background = 'color-mix(in srgb, var(--md-sys-color-primary-container) 92%, var(--md-sys-color-on-primary-container) 8%)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--md-sys-color-primary-container)')}
      >
        <MIcon name="fitness_center" size={24} />
      </button>

      <div role="list" className="flex flex-col w-full gap-1">
        {NAV_ITEMS.map((item, index) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              ref={(el) => { railRefs.current[index] = el; }}
              onClick={() => setLocation(item.path)}
              onKeyDown={(e) => handleRailKeyDown(e, index)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              data-testid={`rail-${item.id}`}
              className="flex flex-col items-center justify-center gap-1 w-full py-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--md-sys-color-primary)]"
              style={{
                minWidth: 48,
                minHeight: 48,
                color: isActive ? 'var(--md-sys-color-on-secondary-container)' : 'var(--md-sys-color-on-surface-variant)',
                fontFamily: GOOGLE_SANS,
                background: 'transparent',
                border: 'none',
              }}
            >
              {/* Pill indicator: 56dp wide × 32dp tall */}
              <div className="relative flex items-center justify-center" style={{ width: 56, height: 32 }}>
                {isActive && (
                  <motion.div
                    layoutId="rail-pill"
                    className="absolute inset-0 rounded-full"
                    style={{ background: 'var(--md-sys-color-secondary-container)' }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative">
                  <MIcon name={item.icon} size={24} filled={isActive} />
                </span>
              </div>
              <span
                className="text-[12px] leading-none text-center"
                style={{ fontWeight: isActive ? 700 : 500, letterSpacing: '0.005em' }}
                aria-hidden="true"
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
