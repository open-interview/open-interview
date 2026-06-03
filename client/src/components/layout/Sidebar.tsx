/**
 * Desktop Sidebar — Collapsible, 280px / 72px
 * Spring animation, violet active state, tooltip on collapse
 */

import React, { useCallback, useMemo } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useCredits } from '../../context/CreditsContext';
import { useSidebar } from '../../context/SidebarContext';
import { useUserPreferences } from '../../context/UserPreferencesContext';
import { cn } from '../../lib/utils';
import { useState } from 'react';
import {
  Home, BookOpen, Award, Mic, Code, Target, Flame,
  Trophy, Bookmark, Brain, Layers,
  GraduationCap, BarChart3, ChevronLeft, ChevronRight,
  User, Settings, Zap, Activity, Bell, Sparkles, FileText, Bot
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: string;
  shortcut?: string;
}

const sections: { label: string; icon: React.ElementType; items: NavItem[]; adminOnly?: boolean }[] = [
  {
    label: 'Learn',
    icon: GraduationCap,
    items: [
      { id: 'channels',       label: 'Channels',       icon: BookOpen, path: '/channels',       shortcut: 'C' },
      { id: 'certifications', label: 'Certifications', icon: Award,    path: '/certifications', shortcut: 'E' },
      { id: 'my-path',        label: 'My Path',        icon: Brain,    path: '/my-path' },
    ],
  },
  {
    label: 'Practice',
    icon: Mic,
    items: [
      { id: 'voice',      label: 'Voice Interview', icon: Mic,    path: '/voice-interview', shortcut: 'V' },
      { id: 'tests',      label: 'Quick Tests',     icon: Target, path: '/tests',           shortcut: 'T' },
      { id: 'coding',     label: 'Code Challenges', icon: Code,   path: '/code',           shortcut: 'X' },
      { id: 'review',     label: 'SRS Review',      icon: Flame,  path: '/review',          shortcut: 'R' },
      { id: 'flashcards', label: 'Flashcards',      icon: Layers, path: '/flashcards' },
    ],
  },
  {
    label: 'Progress',
    icon: BarChart3,
    items: [
      { id: 'badges',    label: 'Badges',        icon: Trophy,    path: '/badges' },
      { id: 'bookmarks', label: 'Bookmarks',     icon: Bookmark,  path: '/bookmarks' },
      { id: 'whats-new', label: "What's New",    icon: Sparkles,  path: '/whats-new' },
      { id: 'notifications', label: 'Notifications', icon: Bell,  path: '/notifications' },
    ],
  },
  {
    label: 'Resources',
    icon: BookOpen,
    items: [
      { id: 'blog', label: 'Blog', icon: FileText, path: '/blog' },
    ],
  },
  {
    label: 'Admin',
    icon: Activity,
    adminOnly: true,
    items: [
      { id: 'bot-activity', label: 'Bot Activity', icon: Bot,      path: '/bot-activity' },
      { id: 'events',       label: 'Activity Log', icon: Activity, path: '/events' },
      { id: 'docs',         label: 'Docs',         icon: BookOpen, path: '/admin/docs' },
    ],
  },
];

interface NavItemElProps {
  item: NavItem;
  isCollapsed: boolean;
  hovered: string | null;
  setHovered: (id: string | null) => void;
  isActive: (path: string) => boolean;
  setLocation: (path: string) => void;
}

const NavItemEl = React.memo(function NavItemEl({
  item, isCollapsed, hovered, setHovered, isActive, setLocation,
}: NavItemElProps) {
  const Icon = item.icon;
  const active = isActive(item.path);
  const showTip = isCollapsed && hovered === item.id;

  return (
    <div className="relative">
      <motion.button
        onClick={() => setLocation(item.path)}
        onMouseEnter={() => setHovered(item.id)}
        onMouseLeave={() => setHovered(null)}
        whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'w-full flex items-center gap-3 rounded-[24px] transition-all duration-150 group relative overflow-hidden',
          isCollapsed ? 'justify-center p-2' : 'px-3 py-2',
          active
            ? 'bg-gradient-to-r from-violet-500/20 via-primary/15 to-cyan-400/20 text-primary shadow-[0_4px_16px_rgba(124,58,237,0.15),inset_0_1px_0_rgba(255,255,255,0.1)]'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/70 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
        )}
      >
        {/* Gradient left border */}
        {active && !isCollapsed && (
          <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-gradient-to-b from-violet-500 via-primary to-cyan-400" />
        )}

        <div className={cn(
          'flex items-center justify-center w-8 h-8 rounded-xl shrink-0 transition-colors',
          active ? 'bg-primary/25' : 'bg-transparent group-hover:bg-muted/80'
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
      </motion.button>

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
});

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { state, formatCredits, level } = useCredits();
  const totalXP = state.balance;
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { preferences } = useUserPreferences();
  const [hovered, setHovered] = useState<string | null>(null);

  const isActive = useCallback((path: string) =>
    path === '/'
      ? location === '/'
      : location === path || location.startsWith(path.replace(/\/$/, '') + '/'),
    [location]
  );

  const isAdmin = localStorage.getItem('admin_mode') === 'true' || window.location.search.includes('admin=true');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(sections.map(s => [s.label, true]))
  );
  const toggleSection = useCallback((label: string) =>
    setExpandedSections(prev => ({ ...prev, [label]: !prev[label] })),
    []
  );

  const handleGoHome = useCallback(() => setLocation('/'), [setLocation]);
  const handleGoProfile = useCallback(() => setLocation('/profile'), [setLocation]);
  const handleGoAbout = useCallback(() => setLocation('/about'), [setLocation]);

  const filteredSections = useMemo(() =>
    sections
      .filter(s => !s.adminOnly || isAdmin)
      .map(s => {
        if (s.label === 'Learn' && preferences.hideCertifications) {
          return { ...s, items: s.items.filter(i => i.id !== 'certifications') };
        }
        return s;
      }),
    [isAdmin, preferences.hideCertifications]
  );

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 72 : 280 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed left-0 top-0 bottom-0 bg-background/80 backdrop-blur-2xl border-r border-white/15 shadow-[4px_0_24px_rgba(0,0,0,0.1)] z-40 flex flex-col overflow-hidden hidden lg:flex"
    >
      {/* Logo + wordmark */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-border shrink-0">
        <button
          onClick={handleGoHome}
          className={cn('flex items-center gap-2.5 min-w-0', isCollapsed && 'justify-center w-full')}
        >
          <motion.div
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center shrink-0"
            style={{ boxShadow: '0 0 16px rgba(124,58,237,0.3)' }}
          >
            <Mic className="w-4 h-4 text-white" />
          </motion.div>
          {!isCollapsed && (
            <div className="text-left overflow-hidden">
              <div className="font-bold text-sm leading-tight whitespace-nowrap">Open Interview</div>
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
        <NavItemEl item={{ id: 'home', label: 'Home', icon: Home, path: '/', shortcut: 'H' }} isCollapsed={isCollapsed} hovered={hovered} setHovered={setHovered} isActive={isActive} setLocation={setLocation} />

        {filteredSections.map(section => (
          <div key={section.label} className="mt-1">
            {isCollapsed
              ? <div className="h-px bg-border/50 my-2 mx-1" />
              : (
                <button
                  onClick={() => toggleSection(section.label)}
                  aria-expanded={expandedSections[section.label]}
                  aria-controls={`section-${section.label}`}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors"
                >
                  <section.icon className="w-3 h-3" />
                  <span>{section.label}</span>
                </button>
              )
            }
            {(isCollapsed || expandedSections[section.label]) && (
              <div id={`section-${section.label}`}>
                {section.items.map(item => <NavItemEl key={item.id} item={item} isCollapsed={isCollapsed} hovered={hovered} setHovered={setHovered} isActive={isActive} setLocation={setLocation} />)}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Bottom: Level/XP + Credits + actions — compact single row */}
      <div className={cn('border-t border-border shrink-0', isCollapsed ? 'p-1.5' : 'px-1.5 py-1')}>
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={handleGoProfile}
              className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
              title="Profile"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-violet-400">
                <Zap className="w-4 h-4 text-white" />
              </div>
            </button>
            <span className="text-[10px] text-amber-500 font-bold">🪙 {formatCredits(state.balance)}</span>
          </div>
        ) : (
          <div className="flex items-center gap-0.5">
            <button
              onClick={handleGoProfile}
              className="flex items-center gap-1.5 flex-1 min-w-0 rounded-lg hover:bg-muted/50 transition-colors px-1.5 py-1.5"
            >
              <div className="flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br from-primary to-violet-400 shrink-0">
                <Zap className="w-3 h-3 text-white" />
              </div>
              <span className="text-[11px] font-medium shrink-0">Lvl {level}</span>
              <span className="text-[10px] text-muted-foreground">{totalXP.toLocaleString()} XP</span>
              <span className="text-[10px] font-bold text-amber-500 ml-auto shrink-0">🪙 {formatCredits(state.balance)}</span>
            </button>
            <button
              onClick={handleGoProfile}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleGoAbout}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="About"
            >
              <User className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
