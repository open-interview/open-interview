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
  Brain, Layers
} from 'lucide-react';
import { useCredits } from '../../context/CreditsContext';
import { useSidebar } from '../../context/SidebarContext';
import { useUserPreferences } from '../../context/UserPreferencesContext';
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
  { id: 'coding',     label: 'Coding',          icon: Code,   path: '/code',            description: 'Code challenges',     shortcut: 'X' },
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
            className="fixed inset-x-0 bottom-0 z-50 bg-background/90 backdrop-blur-2xl border-t border-white/20 shadow-[0_-8px_32px_rgba(0,0,0,0.2)] rounded-t-[28px] max-h-[80vh] flex flex-col lg:hidden"
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
                className="w-11 h-11 rounded-full bg-muted flex items-center justify-center"
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
                      'w-full flex items-center gap-3 p-3.5 rounded-[24px] transition-all border-2',
                      isActive
                        ? 'bg-gradient-to-r from-violet-500/15 via-primary/10 to-cyan-400/15 border-primary/40 text-primary shadow-[0_4px_16px_rgba(124,58,237,0.15)]'
                        : 'bg-muted/40 border-transparent hover:bg-muted hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
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
        <div className="bg-background/80 backdrop-blur-2xl border-t border-white/20 shadow-[0_-4px_24px_rgba(0,0,0,0.15)]">
          <div className="flex items-end justify-around h-14 px-1 max-w-md mx-auto">
            {mainNavItems.map((item) => {
              const isActive = activeSection === item.id;
              const isMenuOpen = showMenu === item.id;
              const isHighlighted = isActive || isMenuOpen;
              const Icon = item.icon;

              return (
                <motion.button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  className={cn(
                    'relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors',
                    isHighlighted ? 'text-primary' : 'text-muted-foreground'
                  )}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {/* Active indicator: gradient line at top */}
                  {isHighlighted && !item.highlight && (
                    <motion.div
                      layoutId="mobile-active-line"
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-gradient-to-r from-violet-500 via-primary to-cyan-400"
                      transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }}
                    />
                  )}

                  {/* Practice CTA: elevated with claymorphism glow */}
                  {item.highlight ? (
                    <motion.div
                      whileTap={{ scale: 0.96 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                      className={cn(
                        'w-12 h-12 rounded-2xl flex items-center justify-center -mt-3 transition-all',
                        isHighlighted
                          ? 'bg-gradient-to-br from-violet-500 to-primary shadow-[0_8px_24px_rgba(124,58,237,0.5),inset_0_1px_0_rgba(255,255,255,0.3)]'
                          : 'bg-gradient-to-br from-violet-500 to-primary/90 shadow-[0_4px_16px_rgba(124,58,237,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]'
                      )}
                      style={{
                        boxShadow: isHighlighted
                          ? '0 8px 24px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.3)'
                          : '0 4px 16px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
                      }}
                    >
                      <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </motion.div>
                  ) : (
                    <motion.div
                      className={cn(
                        'w-10 h-10 rounded-[20px] flex items-center justify-center transition-all',
                        isHighlighted
                          ? 'bg-gradient-to-br from-violet-500/20 via-primary/15 to-cyan-400/20 shadow-[0_4px_16px_rgba(124,58,237,0.2),inset_0_1px_0_rgba(255,255,255,0.15)]'
                          : 'hover:bg-muted/50 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
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
                </motion.button>
              );
            })}
          </div>
        </div>
      </nav>
    </>
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
              className="w-11 h-11 flex items-center justify-center rounded-xl bg-muted/50 hover:bg-muted transition-colors"
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
            className="flex items-center gap-1 px-2 py-1.5 min-h-[44px] bg-amber-500/15 border border-amber-500/30 rounded-lg"
          >
            <Coins className="w-3.5 h-3.5 text-amber-400" strokeWidth={2.5} />
            <span className="text-xs font-bold text-amber-400">{formatCredits(balance)}</span>
          </button>
          <button
            onClick={onSearchClick}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-muted/50 hover:bg-muted transition-colors"
          >
            <Search className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    </header>
  );
}
