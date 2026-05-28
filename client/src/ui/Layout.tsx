import React, { useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { BookOpen, User, Code2, Download, Upload, Github, Flame, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Omnibar } from '@/components/Omnibar';
import { ToastQueue, useBackupReminder } from '@/components/ToastQueue';
import { getSRSStats } from '@/lib/spaced-repetition';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  hideHeader?: boolean;
}

const NAV_ITEMS = [
  { icon: BookOpen, label: 'Feed', path: '/feed' },
  { icon: Layers,   label: 'Study', path: '/study' },
  { icon: User,     label: 'Profile', path: '/profile' },
];

/** Height in px of the sticky top search header — must match the `h-[52px]` class below */
export const HEADER_HEIGHT = 52;

function TrendList() {
  return (
    <div className="p-3 rounded-2xl border border-[var(--tw-border)] bg-transparent">
      <h3 className="text-[15px] font-bold text-[#e7e9ea] mb-3">Trending Topics</h3>
      <div className="space-y-3">
        <div>
          <p className="text-[13px] text-[#71767b]">Technology</p>
          <p className="text-[15px] font-bold text-[#e7e9ea]">Kubernetes</p>
          <p className="text-[13px] text-[#71767b]">2,847 cards</p>
        </div>
        <div>
          <p className="text-[13px] text-[#71767b]">System Design</p>
          <p className="text-[15px] font-bold text-[#e7e9ea]">Distributed Systems</p>
          <p className="text-[13px] text-[#71767b]">1,932 cards</p>
        </div>
        <div>
          <p className="text-[13px] text-[#71767b]">Algorithms</p>
          <p className="text-[15px] font-bold text-[#e7e9ea]">Dynamic Programming</p>
          <p className="text-[13px] text-[#71767b]">1,456 cards</p>
        </div>
      </div>
    </div>
  );
}

function StreakWidget() {
  const [stats] = useState(() => getSRSStats());
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <div className="p-3 rounded-2xl border border-[var(--tw-border)] bg-transparent">
      <div className="flex items-center gap-2 mb-3">
        <Flame className="w-4 h-4 text-amber-400" />
        <h3 className="text-[15px] font-bold text-[#e7e9ea]">{stats.reviewStreak} day streak</h3>
      </div>
      <div className="flex gap-1">
        {days.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-[#71767b]">{d}</span>
            <div className={cn(
              'w-3 h-3 rounded-[3px]',
              i < stats.reviewStreak % 7 ? 'bg-emerald-500' : 'bg-[#2f3336]'
            )} />
          </div>
        ))}
      </div>
    </div>
  );
}

function DataHub() {
  const handleExport = useCallback(() => {
    try {
      const data = {
        version: 2,
        exportedAt: new Date().toISOString(),
        cards:      JSON.parse(localStorage.getItem('code-reels-srs') || '{}'),
        fcCards:    JSON.parse(localStorage.getItem('code-reels-fc-srs') || '{}'),
        stats:      JSON.parse(localStorage.getItem('code-reels-srs-stats') || '{}'),
        liked:      JSON.parse(localStorage.getItem('oi-liked-questions') || '[]'),
        bookmarked: JSON.parse(localStorage.getItem('oi-bookmarked-questions') || '[]'),
        settings:   JSON.parse(localStorage.getItem('oi-profile-settings') || '{}'),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `code-reels-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch {}
  }, []);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.cards)      localStorage.setItem('code-reels-srs',       JSON.stringify(data.cards));
        if (data.fcCards)    localStorage.setItem('code-reels-fc-srs',    JSON.stringify(data.fcCards));
        if (data.stats)      localStorage.setItem('code-reels-srs-stats', JSON.stringify(data.stats));
        if (data.liked)      localStorage.setItem('oi-liked-questions',   JSON.stringify(data.liked));
        if (data.bookmarked) localStorage.setItem('oi-bookmarked-questions', JSON.stringify(data.bookmarked));
        if (data.settings)   localStorage.setItem('oi-profile-settings',  JSON.stringify(data.settings));
        window.location.reload();
      } catch {}
    };
    input.click();
  }, []);

  return (
    <div className="p-3 rounded-2xl border border-[var(--tw-border)] bg-transparent">
      <h3 className="text-[15px] font-bold text-[#e7e9ea] mb-3">Data &amp; Sync</h3>
      <div className="space-y-1">
        <button onClick={handleExport} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] text-[#71767b] hover:text-[#e7e9ea] hover:bg-[#1d1f23] transition-all">
          <Download className="w-[18px] h-[18px]" />
          <span>Export Backup</span>
        </button>
        <button onClick={handleImport} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] text-[#71767b] hover:text-[#e7e9ea] hover:bg-[#1d1f23] transition-all">
          <Upload className="w-[18px] h-[18px]" />
          <span>Import Backup</span>
        </button>
        <a href="https://github.com/open-interview/open-interview" target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] text-[#71767b] hover:text-[#e7e9ea] hover:bg-[#1d1f23] transition-all">
          <Github className="w-[18px] h-[18px]" />
          <span>GitHub Sync</span>
        </a>
      </div>
    </div>
  );
}

const editorialGridStyles = `
.editorial-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.shape-outside-diagram {
  float: left;
  shape-outside: polygon(0 0, 100% 0, 85% 100%, 0 100%);
  shape-margin: 1rem;
}
`;

export const Layout = React.memo(function Layout({ children, hideHeader }: LayoutProps) {
  const [location, setLocation] = useLocation();
  useBackupReminder();

  const isActive = useCallback((path: string) => {
    if (path === '/feed') return location === '/' || location === '/feed' || location.startsWith('/feed/');
    if (path === '/study') return location === '/study' || location.startsWith('/study/');
    return location === path;
  }, [location]);

  return (
    <div className="flex justify-center min-h-dvh bg-black">
      <style>{editorialGridStyles}</style>

      <div className="flex w-full max-w-[1460px] min-h-dvh border-x border-[var(--tw-border)]">

        {/* Left icon nav (desktop) */}
        <div className="hidden md:flex flex-col sticky top-0 h-dvh w-[68px] min-w-[68px] border-r border-[var(--tw-border)] py-2 items-center gap-1 z-10">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-500 flex items-center justify-center mb-2 shrink-0">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          {NAV_ITEMS.slice(0, 2).map(({ icon: Icon, label, path }) => (
            <Tooltip key={path}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setLocation(path)}
                  className={cn(
                    'flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-200',
                    isActive(path) ? 'text-[#e7e9ea] bg-[#1d1f23]' : 'text-[#71767b] hover:text-[#e7e9ea] hover:bg-[#1d1f23]',
                  )}
                >
                  <Icon className="w-[22px] h-[22px]" strokeWidth={1.5} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs font-medium bg-[#1d1f23] text-[#e7e9ea] border border-[var(--tw-border)] ml-1">
                {label}
              </TooltipContent>
            </Tooltip>
          ))}
          <div className="flex-1" />
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setLocation('/profile')}
                className={cn(
                  'flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-200',
                  isActive('/profile') ? 'text-[#e7e9ea] bg-[#1d1f23]' : 'text-[#71767b] hover:text-[#e7e9ea] hover:bg-[#1d1f23]',
                )}
              >
                <User className="w-[22px] h-[22px]" strokeWidth={1.5} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs font-medium bg-[#1d1f23] text-[#e7e9ea] border border-[var(--tw-border)] ml-1">
              Profile
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Center content column */}
        <div className="flex flex-col flex-1 max-w-[800px] min-w-0 border-r border-[var(--tw-border)]">
          {/* Sticky search header — hidden on pages that opt out */}
          {!hideHeader && (
            <header className="sticky top-0 z-20 h-[52px] shrink-0 flex items-center px-3 border-b border-[var(--tw-border)] bg-black/95 backdrop-blur-md">
              <Omnibar />
            </header>
          )}
          <main id="main-content" className="flex-1">
            {children}
          </main>
        </div>

        {/* Right sidebar (xl+ only) */}
        <div className="hidden xl:flex flex-col sticky top-0 h-dvh w-[350px] min-w-[350px] py-3 px-4 gap-4 overflow-y-auto">
          <TrendList />
          <StreakWidget />
          <DataHub />
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden h-14 bg-black border-t border-[var(--tw-border)] flex items-center justify-around px-2">
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => (
          <button
            key={path}
            onClick={() => setLocation(path)}
            className={cn(
              'flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200',
              isActive(path) ? 'text-[#e7e9ea]' : 'text-[#71767b]',
            )}
          >
            <Icon className="w-[22px] h-[22px]" strokeWidth={1.5} />
          </button>
        ))}
      </nav>

      <ToastQueue />
    </div>
  );
});
