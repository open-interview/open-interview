import React, { useCallback } from 'react';
import { useLocation } from 'wouter';
import { BookOpen, User } from 'lucide-react';
import { cn } from '../../lib/utils';

const TABS = [
  { icon: BookOpen, label: 'Study', path: '/study' },
  { icon: User, label: 'Profile', path: '/profile' },
] as const;

function MobileBottomNav() {
  const [location, setLocation] = useLocation();
  const handleNav = useCallback((path: string) => setLocation(path), [setLocation]);

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-50 h-14 lg:hidden glass-nav border-t border-white/5 safe-bottom"
    >
      <div className="flex justify-around items-center h-full max-w-lg mx-auto px-2">
        {TABS.map(({ icon: Icon, label, path }) => {
          const active = location === path;
          return (
            <button
              key={path}
              aria-current={active ? 'page' : undefined}
              onClick={() => handleNav(path)}
              className={cn(
                'flex flex-col items-center gap-0.5 min-w-[64px] min-h-[44px] justify-center rounded-xl px-3 py-1 transition-all',
                active ? 'gradient-text' : 'text-muted-foreground',
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'glow-violet')} aria-hidden="true" />
              <span className="text-[11px] font-medium leading-none">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default React.memo(MobileBottomNav);
