/**
 * Desktop Sidebar — Collapsible, 280px / 72px
 * Spring animation, violet active state, tooltip on collapse
 */

import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useCredits } from '../../context/CreditsContext';
import { useSidebar } from '../../context/SidebarContext';
import { useUserPreferences } from '../../context/UserPreferencesContext';
import { cn } from '../../lib/utils';
import { useState } from 'react';
import {
  Home, BookOpen, Award, Mic, Code, Target, Flame,
  Trophy, Bookmark, Brain, Coins, Layers,
  GraduationCap, BarChart3, ChevronLeft, ChevronRight,
  Search, User, Info, Settings, Zap
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: string;
  shortcut?: string;
}

const sections: { label: string; icon: React.ElementType; items: NavItem[] }[] = [
  {
    label: 'Learn',
    icon: GraduationCap,
    items: [
      { id: 'channels',       label: 'Channels',       icon: BookOpen, path: '/channels',       shortcut: 'C' },
      { id: 'certifications', label: 'Certifications', icon: Award,    path: '/certifications', shortcut: 'E' },
      { id: 'my-path',        label: 'My Path',        icon: Brain,    path: '/my-path',        badge: 'NEW' },
    ],
  },
  {
    label: 'Practice',
    icon: Mic,
    items: [
      { id: 'voice',      label: 'Voice Interview', icon: Mic,    path: '/voice-interview', badge: '+10', shortcut: 'V' },
      { id: 'tests',      label: 'Quick Tests',     icon: Target, path: '/tests',           shortcut: 'T' },
      { id: 'coding',     label: 'Code Challenges', icon: Code,   path: '/code',           shortcut: 'X', badge: 'NEW' },
      { id: 'review',     label: 'SRS Review',      icon: Flame,  path: '/review',          shortcut: 'R' },
      { id: 'flashcards', label: 'Flashcards',      icon: Layers, path: '/flashcards',      badge: 'NEW' },
    ],
  },
  {
    label: 'Progress',
    icon: BarChart3,
    items: [
      { id: 'badges',    label: 'Badges',     icon: Trophy,    path: '/badges' },
      { id: 'bookmarks', label: 'Bookmarks',  icon: Bookmark,  path: '/bookmarks' },
      { id: 'profile',   label: 'Profile',    icon: User,      path: '/profile' },
      { id: 'manage-subscriptions', label: 'My Subscriptions', icon: Settings, path: '/manage-subscriptions' },
      { id: 'about',     label: 'About',      icon: Info,      path: '/about' },
    ],
  },
];

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { balance, formatCredits, level } = useCredits();
  const totalXP = balance;
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { preferences } = useUserPreferences();
  const [hovered, setHovered] = useState<string | null>(null);

  const isActive = (path: string) =>
    location === path || location.startsWith(path.replace(/\/$/, '') + '/');

  const filteredSections = sections.map(s =>
    s.label === 'Learn' && preferences.hideCertifications
      ? { ...s, items: s.items.filter(i => i.id !== 'certifications') }
      : s
  );

  const NavItemEl = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const active = isActive(item.path);
    const showTip = isCollapsed && hovered === item.id;

    return (
      <div className="relative">
        <button
          onClick={() => setLocation(item.path)}
          onMouseEnter={() => setHovered(item.id)}
          onMouseLeave={() => setHovered(null)}
          style={active ? { boxShadow: '0 0 12px rgba(124,58,237,0.12)' } : undefined}
          className={cn(
            'w-full flex items-center gap-3 rounded-lg transition-all duration-150 group relative overflow-hidden',
            isCollapsed ? 'justify-center p-2' : 'px-3 py-2',
            active
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
          )}
        >
          {/* Violet left border */}
          {active && !isCollapsed && (
            <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-primary" />
          )}

          <div className={cn(
            'flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-colors',
            active ? 'bg-primary/20' : 'bg-transparent group-hover:bg-muted/80'
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
                <kbd className="opacity-0 group-hover:opacity-50 text-[10px] px-1 py-0.5 bg-muted rounded border border-border font-mono shrink-0 transition-opacity">
                  {item.shortcut}
                </kbd>
              )}
            </>
          )}
        </button>

        {/* Tooltip */}
        <AnimatePresence>
          {showTip && (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.12 }}
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

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 72 : 280 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed left-0 top-0 bottom-0 bg-card/95 backdrop-blur-xl border-r border-border z-40 flex flex-col overflow-hidden hidden lg:flex"
    >
      {/* Logo + wordmark */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-border shrink-0">
        <button
          onClick={() => setLocation('/')}
          className={cn('flex items-center gap-2.5 min-w-0', isCollapsed && 'justify-center w-full')}
        >
          <div
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center shrink-0"
            style={{ boxShadow: '0 0 16px rgba(124,58,237,0.3)' }}
          >
            <Mic className="w-4 h-4 text-white" />
          </div>
          {!isCollapsed && (
            <div className="text-left overflow-hidden">
              <div className="font-bold text-sm leading-tight whitespace-nowrap">Code Reels</div>
              <div className="text-[10px] text-muted-foreground whitespace-nowrap">Interview Prep</div>
            </div>
          )}
        </button>

        {!isCollapsed && (
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
            title="Collapse"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Expand toggle when collapsed */}
      {isCollapsed && (
        <div className="px-1.5 py-2 shrink-0">
          <button
            onClick={toggleSidebar}
            className="w-full p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
            title="Expand"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className={cn('flex-1 overflow-y-auto overflow-x-hidden py-2 custom-scrollbar', isCollapsed ? 'px-1.5' : 'px-2')}>
        {/* Home */}
        <NavItemEl item={{ id: 'home', label: 'Home', icon: Home, path: '/', shortcut: 'H' }} />

        {filteredSections.map(section => (
          <div key={section.label} className="mt-1">
            {isCollapsed
              ? <div className="h-px bg-border/50 my-2 mx-1" />
              : (
                <div className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                  <section.icon className="w-3 h-3" />
                  <span>{section.label}</span>
                </div>
              )
            }
            {section.items.map(item => <NavItemEl key={item.id} item={item} />)}
          </div>
        ))}
      </nav>

      {/* Bottom: credits + XP + settings */}
      <div className={cn('border-t border-border shrink-0 p-2', isCollapsed && 'p-1.5')}>
        {/* XP / Level row */}
        {!isCollapsed && (
          <button
            onClick={() => setLocation('/profile')}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 mb-1.5 rounded-lg bg-primary/8 hover:bg-primary/12 border border-primary/15 transition-colors overflow-hidden"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-violet-400 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Level {level}</span>
                <span className="text-[10px] text-primary font-semibold">{totalXP.toLocaleString()} XP</span>
              </div>
              <div className="mt-1 h-1 rounded-full bg-primary/20 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${((totalXP % 1000) / 1000) * 100}%` }}
                />
              </div>
            </div>
          </button>
        )}
        {isCollapsed && (
          <button
            onClick={() => setLocation('/profile')}
            className="w-full flex items-center justify-center p-2 mb-1 rounded-lg bg-primary/8 hover:bg-primary/12 transition-colors"
            title={`Level ${level} · ${totalXP} XP`}
          >
            <Zap className="w-4 h-4 text-primary" />
          </button>
        )}

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
