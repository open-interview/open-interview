/**
 * Unified Navigation — Material 3 mobile bottom navigation bar.
 * 5-tab nav with M3 active "pill" indicator behind the icon, no neon glow.
 */

import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useCredits } from '../../context/CreditsContext';
import { useUserPreferences } from '../../context/UserPreferencesContext';
import { cn } from '../../lib/utils';

const GOOGLE_SANS = "'Google Sans Display', 'Roboto Flex', sans-serif";

interface NavItem {
  id: string;
  label: string;
  icon: string;          // Material Symbols Rounded ligature
  path: string;
  highlight?: boolean;
  badge?: string;
  description?: string;
  shortcut?: string;
}

function MIcon({ name, size = 22, filled = false }: { name: string; size?: number; filled?: boolean }) {
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

const mainNavItems: NavItem[] = [
  { id: 'home',     label: 'Home',     icon: 'home',           path: '/' },
  { id: 'learn',    label: 'Learn',    icon: 'school',         path: '/channels' },
  { id: 'practice', label: 'Practice', icon: 'mic',            path: '/voice-interview', highlight: true },
  { id: 'profile',  label: 'Profile',  icon: 'person',         path: '/profile' },
];

const learnSubNav: NavItem[] = [
  { id: 'channels',       label: 'Channels',       icon: 'view_module',       path: '/channels',       description: 'Browse by topic',       shortcut: 'C' },
  { id: 'certifications', label: 'Certifications', icon: 'workspace_premium', path: '/certifications', description: 'Exam prep',             shortcut: 'E' },
  { id: 'paths',          label: 'Learning Paths', icon: 'route',             path: '/learning-paths', description: 'Structured curricula',  badge: 'NEW' },
  { id: 'my-path',        label: 'My Path',        icon: 'flag',              path: '/my-path',        description: 'Your learning journey' },
];

const practiceSubNav: NavItem[] = [
  { id: 'voice',      label: 'Voice Interview', icon: 'mic',          path: '/voice-interview', description: 'AI mock interviews',  badge: '+10', shortcut: 'V' },
  { id: 'tests',      label: 'Quick Tests',     icon: 'task_alt',     path: '/tests',           description: 'Timed challenges',    shortcut: 'T' },
  { id: 'coding',     label: 'Coding',          icon: 'code',         path: '/code',            description: 'Code challenges',     shortcut: 'X' },
  { id: 'review',     label: 'SRS Review',      icon: 'event_repeat', path: '/review',          description: 'Spaced repetition',   shortcut: 'R' },
  { id: 'flashcards', label: 'Flashcards',      icon: 'style',        path: '/flashcards',      description: 'Flip & memorize',     badge: 'NEW' },
];

const progressSubNav: NavItem[] = [
  { id: 'profile',   label: 'Profile & Stats', icon: 'person',        path: '/profile',   description: 'Your profile & stats' },
  { id: 'badges',    label: 'Badges',          icon: 'military_tech', path: '/badges',    description: 'Achievements' },
  { id: 'bookmarks', label: 'Bookmarks',       icon: 'bookmark',      path: '/bookmarks', description: 'Saved questions' },
  { id: 'about',     label: 'About',           icon: 'info',          path: '/about',     description: 'About Open Interview' },
];

function getActiveSection(location: string): string {
  if (location === '/') return 'home';
  if (location === '/channels' || location.startsWith('/channel/') || location === '/certifications' || location.startsWith('/certification/') || location === '/my-path' || location === '/learning-paths' || location.startsWith('/learning-path/')) return 'learn';
  if (location.startsWith('/voice') || location.startsWith('/test') || location.startsWith('/coding') || location === '/review' || location === '/training' || location === '/flashcards') return 'practice';
  if (location === '/profile' || location === '/badges' || location === '/bookmarks' || location === '/about') return 'progress';
  return 'home';
}

// ─── Mobile Bottom Nav (Material 3) ───────────────────────────────────────────

export function MobileBottomNav() {
  const [location, setLocation] = useLocation();
  const { preferences } = useUserPreferences();
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const activeSection = getActiveSection(location);

  const handleNavClick = (item: NavItem) => {
    if (['practice', 'learn', 'progress'].includes(item.id)) {
      setShowMenu(showMenu === item.id ? null : item.id);
    } else {
      setShowMenu(null);
      setLocation(item.path);
    }
  };

  const getSubNav = (id: string): NavItem[] => {
    const map: Record<string, NavItem[]> = {
      learn: preferences.hideCertifications
        ? learnSubNav.filter((i) => i.id !== 'certifications')
        : learnSubNav,
      practice: practiceSubNav,
      progress: progressSubNav,
    };
    return map[id] ?? [];
  };

  const currentSubNav = showMenu ? getSubNav(showMenu) : [];

  const sectionTitle: Record<string, string> = { learn: 'Learn', practice: 'Practice', progress: 'Progress' };
  const sectionDesc: Record<string, string> = {
    learn: 'Browse topics and certifications',
    practice: 'Choose your practice mode',
    progress: 'Track your progress',
  };

  return (
    <>
      {/* Scrim */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: 'rgba(0,0,0,0.32)' }}
            onClick={() => setShowMenu(null)}
          />
        )}
      </AnimatePresence>

      {/* M3 bottom sheet */}
      <AnimatePresence>
        {showMenu && currentSubNav.length > 0 && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-50 lg:hidden flex flex-col max-h-[80vh]"
            style={{
              background: 'var(--background)',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div
                className="w-8 h-1 rounded-full"
                style={{ background: 'color-mix(in srgb, var(--foreground) 24%, transparent)' }}
              />
            </div>

            <div
              className="px-5 py-3 flex items-center justify-between"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div>
                <h3
                  className="text-xl"
                  style={{
                    color: 'var(--foreground)',
                    fontFamily: GOOGLE_SANS,
                    fontWeight: 500,
                    letterSpacing: '-0.005em',
                  }}
                >
                  {sectionTitle[showMenu!]}
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  {sectionDesc[showMenu!]}
                </p>
              </div>
              <button
                onClick={() => setShowMenu(null)}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                style={{ color: 'var(--foreground)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--muted)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                data-testid="button-close-bottom-sheet"
              >
                <MIcon name="close" size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 pb-24 space-y-1">
              {currentSubNav.map((item, i) => {
                const isActive = location === item.path || location.startsWith(item.path + '/');
                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => {
                      setLocation(item.path);
                      setShowMenu(null);
                    }}
                    data-testid={`nav-${item.id}`}
                    className="w-full flex items-center gap-4 p-3 rounded-2xl transition-colors text-left"
                    style={{
                      background: isActive ? 'var(--secondary)' : 'transparent',
                      color: isActive ? 'var(--secondary-foreground)' : 'var(--foreground)',
                      fontFamily: GOOGLE_SANS,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'var(--muted)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span
                      className="flex items-center justify-center w-11 h-11 rounded-full shrink-0"
                      style={{
                        background: isActive ? 'var(--primary)' : 'var(--muted)',
                        color: isActive ? 'var(--primary-foreground)' : 'var(--foreground)',
                      }}
                    >
                      <MIcon name={item.icon} size={22} filled={isActive} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm" style={{ fontWeight: 500 }}>
                          {item.label}
                        </span>
                        {item.badge && (
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full"
                            style={{
                              background: item.badge === 'NEW'
                                ? 'color-mix(in srgb, var(--primary) 16%, transparent)'
                                : 'color-mix(in srgb, #f9ab00 18%, transparent)',
                              color: item.badge === 'NEW' ? 'var(--primary)' : '#f9ab00',
                              fontWeight: 500,
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                          {item.description}
                        </p>
                      )}
                    </div>
                    <MIcon name="chevron_right" size={18} />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* M3 bottom navigation bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          background: 'var(--background)',
          borderTop: '1px solid var(--border)',
        }}
      >
        <div className="flex items-center justify-around h-20 px-2 max-w-xl mx-auto">
          {mainNavItems.map((item) => {
            const isActive = activeSection === item.id;
            const isMenuOpen = showMenu === item.id;
            const highlighted = isActive || isMenuOpen;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                data-testid={`bottom-nav-${item.id}`}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors',
                )}
                style={{
                  color: highlighted ? 'var(--secondary-foreground)' : 'var(--muted-foreground)',
                  fontFamily: GOOGLE_SANS,
                }}
              >
                {/* M3 active "pill" behind the icon */}
                <div className="relative w-16 h-8 flex items-center justify-center">
                  {highlighted && (
                    <motion.div
                      layoutId="bottom-nav-pill"
                      className="absolute inset-0 rounded-full"
                      style={{ background: 'var(--secondary)' }}
                      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                    />
                  )}
                  <span className="relative">
                    <MIcon name={item.icon} size={22} filled={highlighted} />
                  </span>
                </div>
                <span
                  className="text-[11px]"
                  style={{ fontWeight: highlighted ? 500 : 400, letterSpacing: '0.01em' }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

// ─── Mobile Header (re-exported for compat — same M3 design as MobileHeader) ──

interface UnifiedMobileHeaderProps {
  title?: string;
  showBack?: boolean;
  onSearchClick: () => void;
}

export function UnifiedMobileHeader({ title, showBack, onSearchClick }: UnifiedMobileHeaderProps) {
  const [, setLocation] = useLocation();
  const { balance, formatCredits } = useCredits();

  return (
    <header
      className="sticky top-0 z-40 lg:hidden"
      style={{
        background: 'var(--background)',
        borderBottom: '1px solid var(--border)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      <div className="flex items-center justify-between h-14 px-2">
        <div className="flex items-center gap-1 min-w-0 flex-1">
          {showBack ? (
            <button
              onClick={() => window.history.back()}
              className="w-10 h-10 flex items-center justify-center rounded-full transition-colors"
              style={{ color: 'var(--foreground)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--muted)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              data-testid="button-back"
            >
              <MIcon name="arrow_back" size={20} />
            </button>
          ) : (
            <button
              onClick={() => setLocation('/')}
              className="flex items-center gap-2.5 pl-2"
              data-testid="button-brand-unified"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[12px]"
                style={{
                  background: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  fontFamily: GOOGLE_SANS,
                  fontWeight: 500,
                }}
              >
                OI
              </div>
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
            </button>
          )}
          {title && (
            <h1
              className="text-base truncate ml-1"
              style={{
                color: 'var(--foreground)',
                fontFamily: GOOGLE_SANS,
                fontWeight: 500,
              }}
            >
              {title}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-1 pr-1">
          <button
            onClick={() => setLocation('/profile')}
            data-testid="button-credits-unified"
            className="flex items-center gap-1.5 h-9 px-3 rounded-full"
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
          <button
            onClick={onSearchClick}
            className="w-10 h-10 flex items-center justify-center rounded-full transition-colors"
            style={{ color: 'var(--foreground)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--muted)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            data-testid="button-search-unified"
          >
            <MIcon name="search" size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
