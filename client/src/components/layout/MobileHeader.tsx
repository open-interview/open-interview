/**
 * Mobile Header
 * Transparent → frosted glass on scroll
 * Back button for nested routes (depth > 1)
 * Height: 56px + safe-area-inset-top
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Brain, Coins, Sun, Moon } from 'lucide-react';
import { useCredits } from '../../context/CreditsContext';
import { useTheme } from '../../context/ThemeContext';

interface MobileHeaderProps {
  title?: string;
  showBack?: boolean;
  onSearchClick?: () => void;
  transparent?: boolean;
  showSearch?: boolean;
}

/** Detect nested route: path depth > 1 (e.g. /channel/react → depth 2) */
function useIsNestedRoute() {
  const [location] = useLocation();
  const segments = location.split('/').filter(Boolean);
  return segments.length > 1;
}

/** Compact inline theme toggle for the header */
function InlineThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'genz-dark';
  return (
    <button
      onClick={toggleTheme}
      className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/15 transition-colors"
      aria-label="Toggle theme"
    >
      {isDark
        ? <Sun className="w-4 h-4 text-amber-400" />
        : <Moon className="w-4 h-4 text-white/80" />
      }
    </button>
  );
}

export function MobileHeader({
  title,
  showBack,
  onSearchClick,
  transparent,
  showSearch = true,
}: MobileHeaderProps) {
  const [location, setLocation] = useLocation();
  const { balance, formatCredits } = useCredits();
  const [scrolled, setScrolled] = useState(false);
  const isNested = useIsNestedRoute();
  const shouldShowBack = showBack ?? isNested;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const frosted = scrolled && !transparent;

  return (
    <motion.header
      className="sticky top-0 z-40 lg:hidden"
      animate={{
        backgroundColor: frosted ? 'rgba(10,14,26,0.85)' : 'rgba(10,14,26,0)',
        backdropFilter: frosted ? 'blur(20px) saturate(180%)' : 'blur(0px)',
        borderBottomColor: frosted ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0)',
      }}
      transition={{ duration: 0.2 }}
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        borderBottomWidth: 1,
        borderBottomStyle: 'solid',
      }}
    >
      <div className="flex items-center justify-between h-14 px-3 gap-2">
        {/* Left */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {shouldShowBack ? (
            <button
              onClick={() => window.history.back()}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/15 transition-colors shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-white/80" strokeWidth={2} />
            </button>
          ) : (
            <button
              onClick={() => setLocation('/')}
              className="flex items-center gap-2 shrink-0"
            >
              <div
                className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center"
                style={{ boxShadow: '0 0 12px rgba(124,58,237,0.35)' }}
              >
                <Brain className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              {!title && (
                <span className="font-bold text-sm text-white">Code Reels</span>
              )}
            </button>
          )}

          {title && (
            <h1 className="font-bold text-sm text-white truncate">{title}</h1>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setLocation('/profile')}
            className="flex items-center gap-1 px-2 py-1.5 bg-amber-500/15 border border-amber-500/30 rounded-lg"
          >
            <Coins className="w-3.5 h-3.5 text-amber-400" strokeWidth={2.5} />
            <span className="text-xs font-bold text-amber-400">{formatCredits(balance)}</span>
          </button>

          {showSearch && (
            <button
              onClick={onSearchClick}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/15 transition-colors"
              aria-label="Search"
            >
              <Search className="w-4 h-4 text-white/80" strokeWidth={2} />
            </button>
          )}

          <InlineThemeToggle />
        </div>
      </div>
    </motion.header>
  );
}
