/**
 * Mobile Header — Material 3 top app bar
 * Light surface, IconButton circles, Material Symbols icons.
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useCredits } from '../../context/CreditsContext';
import { useTheme } from '../../context/ThemeContext';

const GOOGLE_SANS = "'Google Sans Display', 'Roboto Flex', sans-serif";

interface MobileHeaderProps {
  title?: string;
  showBack?: boolean;
  onSearchClick?: () => void;
  transparent?: boolean;
  showSearch?: boolean;
}

function useIsNestedRoute() {
  const [location] = useLocation();
  return location.split('/').filter(Boolean).length > 1;
}

function MIcon({ name, size = 22, filled = false }: { name: string; size?: number; filled?: boolean }) {
  return (
    <span
      className={`material-symbols-rounded${filled ? ' filled' : ''}`}
      style={{ fontSize: size }}
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
  testId,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  ariaLabel: string;
  testId?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      data-testid={testId}
      className="w-10 h-10 flex items-center justify-center rounded-full transition-colors"
      style={{ color: 'var(--foreground)' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--muted)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {children}
    </button>
  );
}

function InlineThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <IconButton
      onClick={toggleTheme}
      ariaLabel="Toggle theme"
      testId="button-theme-toggle"
    >
      <MIcon name={isDark ? 'light_mode' : 'dark_mode'} size={20} />
    </IconButton>
  );
}

export function MobileHeader({
  title,
  showBack,
  onSearchClick,
  transparent,
  showSearch = true,
}: MobileHeaderProps) {
  const [, setLocation] = useLocation();
  const { balance, formatCredits } = useCredits();
  const [scrolled, setScrolled] = useState(false);
  const isNested = useIsNestedRoute();
  const shouldShowBack = showBack ?? isNested;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className="sticky top-0 z-40 lg:hidden transition-colors"
      style={{
        background: transparent && !scrolled ? 'transparent' : 'var(--background)',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      <div className="flex items-center justify-between h-14 px-2 gap-2">
        {/* Left */}
        <div className="flex items-center gap-1 min-w-0 flex-1">
          {shouldShowBack ? (
            <IconButton
              onClick={() => window.history.back()}
              ariaLabel="Go back"
              testId="button-back"
            >
              <MIcon name="arrow_back" size={20} />
            </IconButton>
          ) : (
            <button
              onClick={() => setLocation('/')}
              className="flex items-center gap-2.5 shrink-0 pl-2 pr-1"
              data-testid="button-brand"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[12px]"
                style={{
                  background: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  fontFamily: GOOGLE_SANS,
                  fontWeight: 500,
                  letterSpacing: '-0.01em',
                }}
              >
                OI
              </div>
              {!title && (
                <span
                  className="text-base"
                  style={{
                    color: 'var(--foreground)',
                    fontFamily: GOOGLE_SANS,
                    fontWeight: 500,
                    letterSpacing: '-0.005em',
                  }}
                >
                  Open Interview
                </span>
              )}
            </button>
          )}

          {title && (
            <h1
              className="text-base truncate ml-1"
              style={{
                color: 'var(--foreground)',
                fontFamily: GOOGLE_SANS,
                fontWeight: 500,
                letterSpacing: '-0.005em',
              }}
            >
              {title}
            </h1>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-1 shrink-0 pr-1">
          <button
            onClick={() => setLocation('/profile')}
            data-testid="button-credits-mobile"
            className="flex items-center gap-1.5 h-9 px-3 rounded-full transition-colors"
            style={{
              background: 'color-mix(in srgb, #f9ab00 14%, transparent)',
              color: '#f9ab00',
              fontFamily: GOOGLE_SANS,
              fontWeight: 500,
            }}
          >
            <MIcon name="paid" size={16} filled />
            <span className="text-xs">{formatCredits(balance)}</span>
          </button>

          {showSearch && (
            <IconButton onClick={onSearchClick} ariaLabel="Search" testId="button-search-mobile">
              <MIcon name="search" size={20} />
            </IconButton>
          )}

          <InlineThemeToggle />
        </div>
      </div>
    </header>
  );
}
