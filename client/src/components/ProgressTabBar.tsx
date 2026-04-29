/**
 * ProgressTabBar — rendered at the top of each Progress sub-page
 * Detects current tab from URL and allows switching between Overview/Badges/History
 */

import { useLocation } from 'wouter';

type Tab = 'overview' | 'badges' | 'history';

const TABS: { id: Tab; label: string; icon: string; path: string }[] = [
  { id: 'overview', label: 'Overview', icon: 'insights',      path: '/progress' },
  { id: 'badges',   label: 'Badges',   icon: 'military_tech', path: '/progress?tab=badges' },
  { id: 'history',  label: 'History',  icon: 'history',       path: '/progress?tab=history' },
];

function MIcon({ name }: { name: string }) {
  return (
    <span className="material-symbols-rounded" style={{ fontSize: 20, lineHeight: 1 }} aria-hidden="true">
      {name}
    </span>
  );
}

interface ProgressTabBarProps {
  activeTab: Tab;
}

export function ProgressTabBar({ activeTab }: ProgressTabBarProps) {
  const [, setLocation] = useLocation();

  const handleTabChange = (tab: Tab, path: string) => {
    window.history.replaceState(null, '', path);
    setLocation(path.split('?')[0]);
    // Store tab in sessionStorage so the target page knows which tab to show
    sessionStorage.setItem('progress-tab', tab);
  };

  return (
    <div
      className="border-b mb-4"
      style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}
    >
      <div className="flex" role="tablist" aria-label="Progress sections">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => handleTabChange(tab.id, tab.path)}
              className="relative flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              style={{
                color: isActive
                  ? 'var(--md-sys-color-primary)'
                  : 'var(--md-sys-color-on-surface-variant)',
                minHeight: 48,
              }}
            >
              <MIcon name={tab.icon} />
              <span>{tab.label}</span>
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full"
                  style={{ background: 'var(--md-sys-color-primary)' }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Hook to get the active progress tab from URL or sessionStorage */
export function useProgressTab(): Tab {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab') as Tab | null;
  if (tab && ['overview', 'badges', 'history'].includes(tab)) return tab;
  const stored = sessionStorage.getItem('progress-tab') as Tab | null;
  if (stored && ['overview', 'badges', 'history'].includes(stored)) return stored;
  return 'overview';
}
