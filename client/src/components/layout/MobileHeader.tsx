/**
 * Mobile Header — Material Design 3 Top App Bar
 *
 * Visible on mobile + tablet (<840px).
 * 64dp tall (h-16), center-aligned title, search icon + avatar on right.
 * Hides on scroll-down, shows on scroll-up.
 * Uses M3 color roles via CSS custom properties.
 * Safe area: env(safe-area-inset-top) applied.
 */

import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useCredits } from '../../context/CreditsContext';
import { useTheme } from '../../context/ThemeContext';

const GOOGLE_SANS = "'Google Sans Display', 'Roboto Flex', sans-serif";

interface MobileHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  onSearchClick?: () => void;
  transparent?: boolean;
  showSearch?: boolean;
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

function IconButton({
  onClick,
  children,
  ariaLabel,
  ariaPressed,
  testId,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  ariaLabel: string;
  ariaPressed?: boolean;
  testId?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      data-testid={testId}
      className="min-w-[48px] w-10 min-h-[48px] h-10 flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2"
      style={{ color: 'var(--md-sys-color-on-surface)' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {children}
    </button>
  );
}

function useScrollBehavior() {
  const lastY = useRef(0);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 4);
      if (y > lastY.current + 4) setHidden(true);
      else if (y < lastY.current - 4) setHidden(false);
      lastY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return { hidden, scrolled };
}

function useIsNestedRoute() {
  const [location] = useLocation();
  return location.split('/').filter(Boolean).length > 1;
}

export function MobileHeader({
  title,
  showBack,
  onBack,
  onSearchClick,
  transparent,
  showSearch = true,
}: MobileHeaderProps) {
  const [, setLocation] = useLocation();
  const { balance, formatCredits } = useCredits();
  const { theme, toggleTheme } = useTheme();
  const isNested = useIsNestedRoute();
  const shouldShowBack = showBack ?? isNested;
  const { hidden, scrolled } = useScrollBehavior();

  const handleBack = () => (onBack ? onBack() : window.history.back());

  const bgColor = transparent && !scrolled
    ? 'transparent'
    : scrolled
      ? 'var(--md-sys-color-surface-container)'
      : 'var(--md-sys-color-surface)';

  return (
    <header
      className="sticky top-0 z-40 lg:hidden transition-transform duration-300"
      style={{
        background: bgColor,
        borderBottom: scrolled ? '1px solid var(--md-sys-color-outline-variant)' : '1px solid transparent',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
        transform: hidden ? 'translateY(-100%)' : 'translateY(0)',
        boxShadow: scrolled
          ? '0 1px 3px color-mix(in srgb, var(--md-sys-color-shadow) 15%, transparent)'
          : 'none',
      }}
    >
      {/* 64dp = h-16 */}
      <div className="flex items-center h-16 px-1 gap-1">

        {/* Leading: back button or brand logo */}
        <div className="w-12 flex items-center justify-center shrink-0">
          {shouldShowBack ? (
            <IconButton onClick={handleBack} ariaLabel="Go back" testId="button-back">
              <MIcon name="arrow_back" size={24} />
            </IconButton>
          ) : (
            <button
              onClick={() => setLocation('/')}
              className="min-w-[48px] w-10 min-h-[48px] h-10 flex items-center justify-center rounded-full"
              data-testid="button-brand"
              style={{
                background: 'var(--md-sys-color-primary)',
                color: 'var(--md-sys-color-on-primary)',
                fontFamily: GOOGLE_SANS,
                fontWeight: 600,
                fontSize: 13,
                letterSpacing: '-0.01em',
              }}
            >
              OI
            </button>
          )}
        </div>

        {/* Center title — M3 center-aligned top app bar */}
        <div className="flex-1 flex items-center justify-center min-w-0">
          <h1
            className="text-lg truncate"
            style={{
              color: 'var(--md-sys-color-on-surface)',
              fontFamily: GOOGLE_SANS,
              fontWeight: 400,
              letterSpacing: 0,
            }}
          >
            {title ?? 'Open Interview'}
          </h1>
        </div>

        {/* Trailing: search + theme toggle + avatar */}
        <div className="flex items-center shrink-0">
          {showSearch && (
            <IconButton onClick={onSearchClick} ariaLabel="Search" testId="button-search-mobile">
              <MIcon name="search" size={24} />
            </IconButton>
          )}

          <IconButton onClick={toggleTheme} ariaLabel="Toggle theme" aria-pressed={theme === 'dark'} testId="button-theme-toggle">
            <MIcon name={theme === 'dark' ? 'light_mode' : 'dark_mode'} size={24} />
          </IconButton>

          {/* Avatar / credits chip */}
          <button
            onClick={() => setLocation('/profile')}
            data-testid="button-credits-mobile"
            className="min-w-[48px] w-10 min-h-[48px] h-10 flex items-center justify-center rounded-full transition-colors"
            style={{
              background: 'color-mix(in srgb, var(--md-sys-color-tertiary) 16%, transparent)',
              color: 'var(--md-sys-color-tertiary)',
              fontFamily: GOOGLE_SANS,
              fontWeight: 600,
              fontSize: 12,
            }}
            title={`${formatCredits(balance)} credits`}
          >
            <MIcon name="person" size={20} filled />
          </button>
        </div>
      </div>
    </header>
  );
}
