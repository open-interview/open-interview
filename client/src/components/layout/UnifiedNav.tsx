/**
 * Unified Navigation — Layout & Nav Revamp
 * Desktop: 280px expanded / 72px collapsed sidebar with spring animation
 * Mobile: 5-tab bottom nav with elevated Practice CTA
 */

import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, GraduationCap, Mic, BarChart3, Code, Coins,
  ChevronRight, ChevronLeft, Target, Flame, Award,
  BookOpen, Bookmark, Trophy, Search, User, Info,
  Brain, Layers, Settings, Sun, Moon
} from 'lucide-react';
import { useCredits } from '../../context/CreditsContext';
import { useSidebar } from '../../context/SidebarContext';
import { useUserPreferences } from '../../context/UserPreferencesContext';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';
import { useState } from 'react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  highlight?: boolean;
  badge?: string;
  description?: string;
  shortcut?: string;
}

const mainNavItems: NavItem[] = [
  { id: 'home',     label: 'Home',     icon: Home,          path: '/' },
  { id: 'learn',    label: 'Learn',    icon: GraduationCap, path: '/channels' },
  { id: 'practice', label: 'Practice', icon: Mic,           path: '/voice-interview', highlight: true },
  { id: 'profile',  label: 'Profile',  icon: User,          path: '/profile' },
];

const learnSubNav: NavItem[] = [
  { id: 'channels',       label: 'Channels',        icon: BookOpen,      path: '/channels',        description: 'Browse by topic',       shortcut: 'C' },
  { id: 'certifications', label: 'Certifications',  icon: Award,         path: '/certifications',  description: 'Exam prep',             shortcut: 'E' },
  { id: 'paths',          label: 'Learning Paths',  icon: Brain,         path: '/learning-paths',  description: 'Structured curricula',  badge: 'NEW' },
  { id: 'my-path',        label: 'My Path',         icon: Target,        path: '/my-path',         description: 'Your learning journey' },
];

const practiceSubNav: NavItem[] = [
  { id: 'voice',      label: 'Voice Interview', icon: Mic,    path: '/voice-interview', description: 'AI mock interviews',  badge: '+10', shortcut: 'V' },
  { id: 'tests',      label: 'Quick Tests',     icon: Target, path: '/tests',           description: 'Timed challenges',    shortcut: 'T' },
  { id: 'coding',     label: 'Coding',          icon: Code,   path: '/coding',          description: 'Code challenges',     shortcut: 'X' },
  { id: 'review',     label: 'SRS Review',      icon: Flame,  path: '/review',          description: 'Spaced repetition',   shortcut: 'R' },
  { id: 'flashcards', label: 'Flashcards',      icon: Layers, path: '/flashcards',      description: 'Flip & memorize',     badge: 'NEW' },
];

const progressSubNav: NavItem[] = [
  { id: 'profile',   label: 'Profile & Stats', icon: User,      path: '/profile',   description: 'Your profile & stats' },
  { id: 'badges',    label: 'Badges',          icon: Trophy,    path: '/badges',    description: 'Achievements' },
  { id: 'bookmarks', label: 'Bookmarks',       icon: Bookmark,  path: '/bookmarks', description: 'Saved questions' },
  { id: 'about',     label: 'About',           icon: Info,      path: '/about',     description: 'About Open-Interview' },
];

function getActiveSection(location: string): string {
  if (location === '/') return 'home';
  if (location === '/channels' || location.startsWith('/channel/') || location === '/certifications' || location.startsWith('/certification/') || location === '/my-path' || location === '/learning-paths' || location.startsWith('/learning-path/')) return 'learn';
  if (location.startsWith('/voice') || location.startsWith('/test') || location.startsWith('/coding') || location === '/review' || location === '/training' || location === '/flashcards') return 'practice';
  if (location === '/profile' || location === '/badges' || location === '/bookmarks' || location === '/about') return 'progress';
  return 'home';
}

// ─── Mobile Bottom Nav ────────────────────────────────────────────────────────

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
        ? learnSubNav.filter(i => i.id !== 'certifications')
        : learnSubNav,
      practice: practiceSubNav,
      progress: progressSubNav,
    };
    return map[id] ?? [];
  };

  const currentSubNav = showMenu ? getSubNav(showMenu) : [];

  const sectionTitle: Record<string, string> = {
    learn: 'Learn', practice: 'Practice', progress: 'Progress',
  };
  const sectionDesc: Record<string, string> = {
    learn: 'Browse topics and certifications',
    practice: 'Choose your practice mode',
    progress: 'Track your progress',
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-md lg:hidden"
            onClick={() => setShowMenu(null)}
          />
        )}
      </AnimatePresence>

      {/* Submenu sheet */}
      <AnimatePresence>
        {showMenu && currentSubNav.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-background border-t border-border rounded-t-[28px] shadow-2xl max-h-[80vh] flex flex-col lg:hidden"
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">{sectionTitle[showMenu!]}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{sectionDesc[showMenu!]}</p>
              </div>
              <button
                onClick={() => setShowMenu(null)}
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 pb-24">
              {currentSubNav.map((item, i) => {
                const Icon = item.icon;
                const isActive = location === item.path || location.startsWith(item.path + '/');
                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => { setLocation(item.path); setShowMenu(null); }}
                    className={cn(
                      'w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all border-2',
                      isActive
                        ? 'bg-primary/10 border-primary/40 text-primary'
                        : 'bg-muted/40 border-transparent hover:bg-muted'
                    )}
                  >
                    <div className={cn(
                      'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
                      isActive ? 'bg-primary text-primary-foreground' : 'bg-background'
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{item.label}</span>
                        {item.badge && (
                          <span className={cn(
                            'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                            item.badge === 'NEW'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-amber-500/20 text-amber-400'
                          )}>{item.badge}</span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="bg-background/95 backdrop-blur-xl border-t border-border">
          <div className="flex items-end justify-around h-14 px-1 max-w-md mx-auto">
            {mainNavItems.map((item) => {
              const isActive = activeSection === item.id;
              const isMenuOpen = showMenu === item.id;
              const isHighlighted = isActive || isMenuOpen;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={cn(
                    'relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors',
                    isHighlighted ? 'text-primary' : 'text-muted-foreground'
                  )}
                  aria-label={item.label}
                >
                  {/* Active indicator: violet line at top */}
                  {isHighlighted && !item.highlight && (
                    <motion.div
                      layoutId="mobile-active-line"
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary"
                      transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }}
                    />
                  )}

                  {/* Practice CTA: elevated with glow */}
                  {item.highlight ? (
                    <motion.div
                      whileTap={{ scale: 0.9 }}
                      className={cn(
                        'w-12 h-12 rounded-2xl flex items-center justify-center -mt-3 shadow-lg transition-all',
                        isHighlighted
                          ? 'bg-primary shadow-primary/50'
                          : 'bg-primary/90 shadow-primary/30'
                      )}
                      style={{ boxShadow: isHighlighted ? '0 0 20px rgba(124,58,237,0.55)' : '0 0 12px rgba(124,58,237,0.3)' }}
                    >
                      <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </motion.div>
                  ) : (
                    <motion.div
                      whileTap={{ scale: 0.88 }}
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
                        isHighlighted ? 'bg-primary/15' : 'bg-transparent'
                      )}
                    >
                      <Icon className="w-5 h-5" strokeWidth={isHighlighted ? 2.5 : 2} />
                    </motion.div>
                  )}

                  <span className={cn(
                    'text-[10px] font-medium leading-none',
                    item.highlight && '-mt-1'
                  )}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────

interface DesktopSidebarProps {
  onSearchClick: () => void;
}

export function DesktopSidebar({ onSearchClick }: DesktopSidebarProps) {
  const [location, setLocation] = useLocation();
  const { balance, formatCredits } = useCredits();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { preferences } = useUserPreferences();
  const { theme, toggleTheme } = useTheme();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const isActive = (path: string) =>
    location === path || location.startsWith(path.replace(/\/$/, '') + '/');

  const filteredLearnSubNav = preferences.hideCertifications
    ? learnSubNav.filter(i => i.id !== 'certifications')
    : learnSubNav;

  const SidebarNavItem = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const active = isActive(item.path);
    const showTooltip = isCollapsed && hoveredItem === item.id;

    return (
      <div className="relative">
        <button
          onClick={() => setLocation(item.path)}
          onMouseEnter={() => setHoveredItem(item.id)}
          onMouseLeave={() => setHoveredItem(null)}
          style={active ? { boxShadow: '0 0 12px rgba(124,58,237,0.12)' } : undefined}
          className={cn(
            'w-full flex items-center gap-3 rounded-lg transition-all duration-150 group relative overflow-hidden',
            isCollapsed ? 'justify-center p-2' : 'px-3 py-2',
            active
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          )}
        >
          {/* Violet left border for active */}
          {active && !isCollapsed && (
            <motion.div
              layoutId="sidebar-active-border"
              className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-primary"
            />
          )}

          <div className={cn(
            'flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-colors',
            active
              ? 'bg-primary/20 text-primary'
              : 'bg-transparent group-hover:bg-muted'
          )}>
            <Icon className="w-4 h-4" />
          </div>

          {!isCollapsed && (
            <>
              <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0',
                  item.badge === 'NEW'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/20 text-amber-400'
                )}>{item.badge}</span>
              )}
              {item.shortcut && (
                <kbd className="opacity-0 group-hover:opacity-60 text-[10px] px-1 py-0.5 bg-muted rounded border border-border font-mono shrink-0 transition-opacity">
                  {item.shortcut}
                </kbd>
              )}
            </>
          )}
        </button>

        {/* Collapsed tooltip */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.15 }}
              className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 pointer-events-none"
            >
              <div className="bg-popover border border-border rounded-lg shadow-xl px-3 py-1.5 whitespace-nowrap flex items-center gap-2">
                <span className="text-sm font-medium">{item.label}</span>
                {item.badge && (
                  <span className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded font-medium',
                    item.badge === 'NEW'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/20 text-amber-400'
                  )}>{item.badge}</span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const SectionHeader = ({ icon: Icon, label }: { icon: React.ElementType; label: string }) =>
    isCollapsed
      ? <div className="h-px bg-border/50 my-2 mx-2" />
      : (
        <div className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
          <Icon className="w-3 h-3" />
          <span>{label}</span>
        </div>
      );

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 72 : 280 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed left-0 top-0 bottom-0 bg-card/95 backdrop-blur-xl border-r border-border z-40 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-border shrink-0">
        <button
          onClick={() => setLocation('/')}
          className={cn('flex items-center gap-2.5 min-w-0', isCollapsed && 'justify-center w-full')}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center shrink-0 shadow-lg"
            style={{ boxShadow: '0 0 16px rgba(124,58,237,0.3)' }}>
            <Mic className="w-4 h-4 text-white" />
          </div>
          {!isCollapsed && (
            <motion.div
              initial={false}
              animate={{ opacity: 1 }}
              className="text-left overflow-hidden"
            >
              <div className="font-bold text-sm leading-tight whitespace-nowrap">Code Reels</div>
              <div className="text-[10px] text-muted-foreground whitespace-nowrap">Interview Prep</div>
            </motion.div>
          )}
        </button>

        {!isCollapsed && (
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {isCollapsed && (
        <div className="px-2 py-2 shrink-0">
          <button
            onClick={toggleSidebar}
            className="w-full p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
            title="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search */}
      <div className={cn('px-2 py-2 shrink-0', isCollapsed && 'px-1.5')}>
        <button
          onClick={onSearchClick}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 bg-muted/50 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors',
            isCollapsed && 'justify-center px-2'
          )}
        >
          <Search className="w-4 h-4 shrink-0" />
          {!isCollapsed && (
            <>
              <span className="text-sm flex-1 text-left truncate">Search</span>
              <kbd className="text-[10px] px-1.5 py-0.5 bg-background rounded border border-border font-mono shrink-0">⌘K</kbd>
            </>
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className={cn('flex-1 overflow-y-auto overflow-x-hidden py-1 custom-scrollbar', isCollapsed ? 'px-1.5' : 'px-2')}>
        <SidebarNavItem item={{ id: 'home', label: 'Home', icon: Home, path: '/', shortcut: 'H' }} />

        <SectionHeader icon={GraduationCap} label="Learn" />
        {filteredLearnSubNav.map(item => <SidebarNavItem key={item.id} item={item} />)}

        <SectionHeader icon={Mic} label="Practice" />
        {practiceSubNav.map(item => <SidebarNavItem key={item.id} item={item} />)}

        <SectionHeader icon={BarChart3} label="Progress" />
        {progressSubNav.map(item => <SidebarNavItem key={item.id} item={item} />)}
      </nav>

      {/* Credits footer */}
      <div className={cn('p-2 border-t border-border shrink-0', isCollapsed && 'p-1.5')}>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            'w-full flex items-center gap-2.5 px-2.5 py-2 mb-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors',
            isCollapsed && 'justify-center px-1.5'
          )}
          aria-label="Toggle theme"
        >
          {theme === 'dark'
            ? <Sun className="w-4 h-4 text-amber-400 shrink-0" />
            : <Moon className="w-4 h-4 shrink-0" />
          }
          {!isCollapsed && (
            <span className="text-sm">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          )}
        </button>
        <button
          onClick={() => setLocation('/profile')}
          className={cn(
            'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 transition-colors overflow-hidden',
            isCollapsed && 'justify-center px-1.5'
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0">
            <Coins className="w-4 h-4 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 text-left min-w-0">
              <div className="text-[10px] text-muted-foreground">Credits</div>
              <div className="text-sm font-bold text-amber-500 truncate">{formatCredits(balance)}</div>
            </div>
          )}
        </button>

        {!isCollapsed && (
          <button
            onClick={() => setLocation('/profile')}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 mt-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-xs"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        )}
      </div>
    </motion.aside>
  );
}

// ─── Mobile Header (re-exported from UnifiedNav for AppLayout) ────────────────

interface UnifiedMobileHeaderProps {
  title?: string;
  showBack?: boolean;
  onSearchClick: () => void;
}

export function UnifiedMobileHeader({ title, showBack, onSearchClick }: UnifiedMobileHeaderProps) {
  const [, setLocation] = useLocation();
  const { balance, formatCredits } = useCredits();

  return (
    <header className="sticky top-0 z-40 lg:hidden bg-card/90 backdrop-blur-xl border-b border-border"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="flex items-center justify-between h-14 px-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {showBack ? (
            <button
              onClick={() => window.history.back()}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={2} />
            </button>
          ) : (
            <button onClick={() => setLocation('/')} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center"
                style={{ boxShadow: '0 0 12px rgba(124,58,237,0.3)' }}>
                <Brain className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-sm">Code Reels</span>
            </button>
          )}
          {title && <h1 className="font-bold text-sm truncate ml-2">{title}</h1>}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLocation('/profile')}
            className="flex items-center gap-1 px-2 py-1.5 bg-amber-500/15 border border-amber-500/30 rounded-lg"
          >
            <Coins className="w-3.5 h-3.5 text-amber-400" strokeWidth={2.5} />
            <span className="text-xs font-bold text-amber-400">{formatCredits(balance)}</span>
          </button>
          <button
            onClick={onSearchClick}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-muted/50 hover:bg-muted transition-colors"
          >
            <Search className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    </header>
  );
}
