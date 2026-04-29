/**
 * Desktop Sidebar — Material 3 Navigation Drawer
 * 280px expanded / 80px collapsed (rail), pill-shaped selected items,
 * Material Symbols Rounded icons, Google Sans Display labels.
 */

import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useCredits } from '../../context/CreditsContext';
import { useSidebar } from '../../context/SidebarContext';
import { useUserPreferences } from '../../context/UserPreferencesContext';
import { cn } from '../../lib/utils';

interface NavItem {
  id: string;
  label: string;
  icon: string;     // Material Symbols Rounded ligature
  path: string;
  badge?: string;
  shortcut?: string;
}

const sections: { label: string; icon: string; items: NavItem[] }[] = [
  {
    label: 'Learn',
    icon: 'school',
    items: [
      { id: 'channels',       label: 'Channels',       icon: 'view_module',       path: '/channels',       shortcut: 'C' },
      { id: 'certifications', label: 'Certifications', icon: 'workspace_premium', path: '/certifications', shortcut: 'E' },
      { id: 'learning-paths', label: 'Learning Paths', icon: 'route',             path: '/learning-paths' },
    ],
  },
  {
    label: 'Practice',
    icon: 'fitness_center',
    items: [
      { id: 'practice',   label: 'Practice Hub',    icon: 'fitness_center', path: '/practice',        badge: 'NEW' },
      { id: 'voice',      label: 'Voice Interview', icon: 'mic',            path: '/voice-interview', badge: '+10', shortcut: 'V' },
      { id: 'tests',      label: 'Quick Tests',     icon: 'task_alt',       path: '/tests',           shortcut: 'T' },
      { id: 'coding',     label: 'Code Challenges', icon: 'code',           path: '/coding',          shortcut: 'X' },
      { id: 'review',     label: 'SRS Review',      icon: 'event_repeat',   path: '/review',          shortcut: 'R' },
      { id: 'flashcards', label: 'Flashcards',      icon: 'style',          path: '/flashcards' },
    ],
  },
  {
    label: 'Progress',
    icon: 'insights',
    items: [
      { id: 'progress',  label: 'My Progress', icon: 'insights',      path: '/progress' },
      { id: 'bookmarks', label: 'Bookmarks',   icon: 'bookmark',      path: '/bookmarks' },
      { id: 'manage-subscriptions', label: 'Subscriptions', icon: 'tune', path: '/manage-subscriptions' },
    ],
  },
  {
    label: 'Account',
    icon: 'person',
    items: [
      { id: 'profile', label: 'Profile', icon: 'person', path: '/profile' },
      { id: 'about',   label: 'About',   icon: 'info',   path: '/about' },
    ],
  },
];

const HOME_ITEM: NavItem = { id: 'home', label: 'Home', icon: 'home', path: '/', shortcut: 'H' };

const GOOGLE_SANS = "'Google Sans Display', 'Roboto Flex', sans-serif";

function MIcon({ name, size = 20, filled = false, className = '' }: { name: string; size?: number; filled?: boolean; className?: string }) {
  return (
    <span
      className={`material-symbols-rounded${filled ? ' filled' : ''} ${className}`}
      style={{ fontSize: size }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { balance, formatCredits, level } = useCredits();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { preferences } = useUserPreferences();
  const [hovered, setHovered] = useState<string | null>(null);

  const totalXP = balance;

  const isActive = (path: string) =>
    path === '/'
      ? location === '/'
      : location === path || location.startsWith(path.replace(/\/$/, '') + '/');

  const filteredSections = sections.map((s) =>
    s.label === 'Learn' && preferences.hideCertifications
      ? { ...s, items: s.items.filter((i) => i.id !== 'certifications') }
      : s
  );

  const NavItemEl = ({ item }: { item: NavItem }) => {
    const active = isActive(item.path);
    const showTip = isCollapsed && hovered === item.id;

    return (
      <div className="relative">
        <button
          onClick={() => setLocation(item.path)}
          onMouseEnter={() => setHovered(item.id)}
          onMouseLeave={() => setHovered(null)}
          aria-current={active ? 'page' : undefined}
          data-testid={`nav-${item.id}`}
          className={cn(
            'w-full flex items-center transition-colors duration-150 relative',
            isCollapsed
              ? 'justify-center h-12 mx-auto rounded-2xl'
              : 'gap-3 h-14 px-4 rounded-full'
          )}
          style={{
            background: active ? 'var(--secondary)' : 'transparent',
            color: active ? 'var(--secondary-foreground)' : 'var(--muted-foreground)',
            width: isCollapsed ? 56 : '100%',
            fontFamily: GOOGLE_SANS,
          }}
          onMouseOver={(e) => {
            if (!active) e.currentTarget.style.background = 'var(--muted)';
          }}
          onMouseOut={(e) => {
            if (!active) e.currentTarget.style.background = 'transparent';
          }}
        >
          <MIcon name={item.icon} size={22} filled={active} />
          {!isCollapsed && (
            <>
              <span
                className="text-sm flex-1 text-left truncate"
                style={{ fontWeight: active ? 500 : 400, color: active ? 'var(--secondary-foreground)' : 'var(--foreground)' }}
              >
                {item.label}
              </span>
              {item.badge && (
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full shrink-0"
                  style={{
                    background: item.badge === 'NEW'
                      ? 'color-mix(in srgb, var(--primary) 15%, transparent)'
                      : 'color-mix(in srgb, #f9ab00 18%, transparent)',
                    color: item.badge === 'NEW' ? 'var(--primary)' : '#f9ab00',
                    fontWeight: 500,
                  }}
                >
                  {item.badge}
                </span>
              )}
            </>
          )}
        </button>

        <AnimatePresence>
          {showTip && (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.12 }}
              className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 pointer-events-none"
            >
              <div
                className="px-3 py-1.5 rounded-md whitespace-nowrap text-sm"
                style={{
                  background: 'var(--popover)',
                  color: 'var(--popover-foreground)',
                  border: '1px solid var(--border)',
                  fontFamily: GOOGLE_SANS,
                  fontWeight: 500,
                }}
              >
                {item.label}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed left-0 top-0 bottom-0 z-40 hidden lg:flex flex-col overflow-hidden"
      style={{
        background: 'var(--background)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Brand row + collapse */}
      <div
        className={cn(
          'h-16 flex items-center shrink-0',
          isCollapsed ? 'justify-center px-3' : 'justify-between px-5'
        )}
      >
        <button
          onClick={() => setLocation('/')}
          className="flex items-center gap-3 min-w-0"
          data-testid="nav-brand"
        >
          <div
            className="flex items-center justify-center shrink-0 w-9 h-9 rounded-full"
            style={{
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              fontFamily: GOOGLE_SANS,
              fontWeight: 500,
              fontSize: 13,
              letterSpacing: '-0.01em',
            }}
          >
            OI
          </div>
          {!isCollapsed && (
            <div
              className="text-base truncate"
              style={{
                color: 'var(--foreground)',
                fontFamily: GOOGLE_SANS,
                fontWeight: 500,
                letterSpacing: '-0.005em',
              }}
            >
              Open Interview
            </div>
          )}
        </button>

        {!isCollapsed && (
          <button
            onClick={toggleSidebar}
            className="min-w-[48px] w-10 min-h-[48px] h-10 flex items-center justify-center rounded-full transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--muted)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            title="Collapse"
            data-testid="button-sidebar-collapse"
          >
            <MIcon name="menu_open" size={20} />
          </button>
        )}
      </div>

      {isCollapsed && (
        <button
          onClick={toggleSidebar}
          className="mx-auto mb-2 w-12 h-12 flex items-center justify-center rounded-2xl transition-colors"
          style={{ color: 'var(--muted-foreground)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--muted)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          title="Expand"
          data-testid="button-sidebar-expand"
        >
          <MIcon name="menu" size={20} />
        </button>
      )}

      {/* Nav list */}
      <nav
        className={cn(
          'flex-1 overflow-y-auto overflow-x-hidden py-2 space-y-0.5',
          isCollapsed ? 'px-3' : 'px-3'
        )}
      >
        <NavItemEl item={HOME_ITEM} />

        {filteredSections.map((section) => (
          <div key={section.label} className="mt-3">
            {!isCollapsed ? (
              <div
                className="px-4 pt-2 pb-1.5 text-[11px] uppercase tracking-[0.08em]"
                style={{
                  color: 'var(--muted-foreground)',
                  fontFamily: GOOGLE_SANS,
                  fontWeight: 500,
                }}
              >
                {section.label}
              </div>
            ) : (
              <div className="my-2 mx-auto h-px w-8" style={{ background: 'var(--border)' }} />
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItemEl key={item.id} item={item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom: profile / credits */}
      <div
        className={cn('shrink-0 p-3 space-y-1.5', isCollapsed && 'px-2')}
        style={{ borderTop: '1px solid var(--border)' }}
      >
        {!isCollapsed ? (
          <button
            onClick={() => setLocation('/profile')}
            data-testid="button-profile-xp"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors"
            style={{ background: 'var(--muted)', fontFamily: GOOGLE_SANS }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--secondary)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--muted)')}
          >
            <span
              className="flex items-center justify-center w-9 h-9 rounded-full shrink-0"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              <MIcon name="bolt" size={18} filled />
            </span>
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Level {level}
                </span>
                <span className="text-xs" style={{ color: 'var(--primary)', fontWeight: 500 }}>
                  {totalXP.toLocaleString()} XP
                </span>
              </div>
              <div
                className="mt-1.5 h-1 rounded-full overflow-hidden"
                style={{ background: 'color-mix(in srgb, var(--primary) 18%, transparent)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${((totalXP % 1000) / 1000) * 100}%`,
                    background: 'var(--primary)',
                    transition: 'width 500ms ease',
                  }}
                />
              </div>
            </div>
          </button>
        ) : (
          <button
            onClick={() => setLocation('/profile')}
            data-testid="button-profile-xp-collapsed"
            className="w-12 h-12 mx-auto flex items-center justify-center rounded-2xl transition-colors"
            style={{ background: 'var(--muted)', color: 'var(--primary)' }}
            title={`Level ${level} · ${totalXP} XP`}
          >
            <MIcon name="bolt" size={20} filled />
          </button>
        )}

        <button
          onClick={() => setLocation('/profile')}
          data-testid="button-credits"
          className={cn(
            'w-full flex items-center rounded-2xl transition-colors',
            isCollapsed ? 'justify-center w-12 h-12 mx-auto' : 'gap-3 px-3 py-2.5'
          )}
          style={{ background: 'transparent', fontFamily: GOOGLE_SANS, color: 'var(--foreground)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--muted)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <span
            className="flex items-center justify-center w-9 h-9 rounded-full shrink-0"
            style={{ background: 'color-mix(in srgb, #f9ab00 18%, transparent)', color: '#f9ab00' }}
          >
            <MIcon name="paid" size={18} filled />
          </span>
          {!isCollapsed && (
            <div className="flex-1 text-left min-w-0">
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Credits
              </div>
              <div className="text-sm truncate" style={{ color: '#f9ab00', fontWeight: 500 }}>
                {formatCredits(balance)}
              </div>
            </div>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
