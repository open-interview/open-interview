import React, { useCallback } from 'react';
import { useLocation } from 'wouter';
import { House, Target, User } from 'lucide-react';

const TABS = [
  { id: 'feed', label: 'Feed', icon: House, href: '/' },
  { id: 'study', label: 'Study', icon: Target, href: '/study' },
  { id: 'profile', label: 'You', icon: User, href: '/profile' },
] as const;

function MobileBottomNav() {
  const [location, setLocation] = useLocation();
  const handleNav = useCallback((href: string) => setLocation(href), [setLocation]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--surface)] border-t border-[var(--border)] lg:hidden">
      <div className="flex items-center justify-around h-14">
        {TABS.map((tab) => {
          const active = location === tab.href || (tab.href !== '/' && location.startsWith(tab.href));
          return (
            <a
              key={tab.id}
              href={tab.href}
              onClick={(e) => { e.preventDefault(); handleNav(tab.href) }}
              className="flex flex-col items-center gap-0.5 relative pt-1"
            >
              {active && <div className="absolute -top-px w-5 h-0.5 rounded-full bg-[var(--accent)]" />}
              <tab.icon size={20} className={active ? 'text-[var(--accent)]' : 'text-[var(--fg-muted)]'} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}

export { MobileBottomNav };
export default React.memo(MobileBottomNav);
