import React from 'react';
import { Search, Sun, Moon, User } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { ToastQueue, useBackupReminder } from '@/components/ToastQueue';
import { SkipToContent } from '@/components/navigation/SkipToContent';
import { RouteTransition } from '@/components/navigation/RouteTransition';
import MobileBottomNav from '@/components/navigation/MobileBottomNav';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  hideHeader?: boolean;
}

export const Layout = React.memo(function Layout({ children }: LayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  useBackupReminder();

  return (
    <>
      <SkipToContent />
      <div className="min-h-screen bg-[var(--bg)]">
        <header className="sticky top-0 z-50 h-12 bg-[var(--surface)]/80 backdrop-blur-xl border-b border-[var(--border)] flex items-center justify-between px-4">
          <span className="font-[var(--font-heading)] text-[15px] font-semibold text-[var(--fg)]">openinterview</span>
          <nav className="flex items-center gap-3">
            <button aria-label="Search questions" className="p-1.5 text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">
              <Search size={18} />
            </button>
            <button onClick={toggleTheme} aria-label="Toggle theme" className="p-1.5 text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <a href="/profile" aria-label="Profile" className="w-7 h-7 rounded-full bg-[var(--accent)] text-[var(--accent-fg)] flex items-center justify-center text-xs font-semibold">
              <User size={14} />
            </a>
          </nav>
        </header>
        <div className="flex justify-center">
          <RouteTransition>
            <main id="main-content" className="flex-1 w-full max-w-[680px] mx-auto px-4 py-6">
              {children}
            </main>
          </RouteTransition>
        </div>
        <footer className="text-center text-[11px] text-[var(--fg-muted)] py-4">
          OpenInterview
        </footer>
        <MobileBottomNav />
      </div>
      <ToastQueue />
    </>
  );
});
