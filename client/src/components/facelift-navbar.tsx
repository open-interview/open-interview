/**
 * Facelift Navbar — Modern glassmorphic sticky header
 * Features: scroll-aware shrink, glassmorphism, mobile slide-out, theme toggle, search trigger
 */

import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, Search, Sun, Moon, ChevronRight,
  Brain, BookOpen, Home, Mic, ExternalLink,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';

// ─── Nav link definitions ────────────────────────────────────────────────────

interface NavLink {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  external?: boolean;
}

const NAV_LINKS: NavLink[] = [
  { id: 'home', label: 'Home', href: '/', icon: Home },
  { id: 'topics', label: 'Topics', href: '/channels', icon: BookOpen },
  { id: 'blog', label: 'Blog', href: '/blog', icon: BookOpen },
  { id: 'practice', label: 'Practice', href: '/voice-interview', icon: Mic },
];

// ─── Scroll threshold constants ──────────────────────────────────────────────

const SCROLL_THRESHOLD = 20;
const HEADER_HEIGHT_EXPANDED = 64;
const HEADER_HEIGHT_SHRUNK = 52;

// ─── Theme Toggle ────────────────────────────────────────────────────────────

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      onClick={toggleTheme}
      className={cn(
        'relative w-10 h-10 rounded-xl flex items-center justify-center transition-all',
        'bg-muted/50 hover:bg-muted/80 border border-border/50',
        'overflow-hidden'
      )}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="sun"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="w-[18px] h-[18px] text-amber-400" strokeWidth={2} />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="w-[18px] h-[18px] text-muted-foreground" strokeWidth={2} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ─── Mobile Menu ─────────────────────────────────────────────────────────────

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSearchOpen: () => void;
  activeLink: string;
  onNavigate: (href: string) => void;
}

function MobileMenu({ isOpen, onClose, onSearchOpen, activeLink, onNavigate }: MobileMenuProps) {
  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Slide-out panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 250 }}
            className="fixed top-0 right-0 bottom-0 z-[70] w-[300px] max-w-[85vw] lg:hidden flex flex-col"
          >
            {/* Panel background */}
            <div className="absolute inset-0 bg-background/95 backdrop-blur-xl border-l border-border/50" />

            {/* Close button */}
            <div className="relative flex items-center justify-between h-16 px-5 border-b border-border/50">
              <span className="font-semibold text-lg">Menu</span>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-muted/50 hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="relative flex-1 overflow-y-auto py-4 px-3 space-y-1">
              {NAV_LINKS.map((link, index) => {
                const Icon = link.icon;
                const isActive = activeLink === link.id;

                return (
                  <motion.button
                    key={link.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.06 }}
                    onClick={() => {
                      onNavigate(link.href);
                      onClose();
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                      isActive
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    <Icon className="w-5 h-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                    <span className="flex-1 text-left text-sm">{link.label}</span>
                    {link.external && <ExternalLink className="w-3.5 h-3.5 opacity-50" />}
                    {isActive && (
                      <motion.div
                        layoutId="mobile-active-dot"
                        className="w-1.5 h-1.5 rounded-full bg-primary"
                      />
                    )}
                    <ChevronRight className="w-4 h-4 opacity-30" />
                  </motion.button>
                );
              })}

              {/* Search trigger */}
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: NAV_LINKS.length * 0.06 }}
                onClick={() => {
                  onSearchOpen();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all mt-2"
              >
                <Search className="w-5 h-5 shrink-0" />
                <span className="flex-1 text-left text-sm">Search</span>
                <kbd className="px-2 py-0.5 text-[10px] bg-muted border border-border rounded font-mono">
                  K
                </kbd>
              </motion.button>
            </nav>

            {/* Footer branding */}
            <div className="relative px-5 py-4 border-t border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center">
                  <Brain className="w-3.5 h-3.5 text-white" />
                </div>
                <span>DevInsights v1.0</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Main Facelift Navbar ────────────────────────────────────────────────────

interface FaceliftNavbarProps {
  onSearchOpen: () => void;
}

export function FaceliftNavbar({ onSearchOpen }: FaceliftNavbarProps) {
  const [location, setLocation] = useLocation();
  const { theme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  // Scroll detection
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onSearchOpen();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onSearchOpen]);

  // Determine active link
  const getActiveLink = useCallback((): string => {
    if (location === '/') return 'home';
    if (location.startsWith('/channel') || location.startsWith('/channels')) return 'topics';
    if (location.startsWith('/blog')) return 'blog';
    if (location.startsWith('/voice') || location.startsWith('/test') || location.startsWith('/coding') || location.startsWith('/review') || location.startsWith('/flashcard')) return 'practice';
    return 'home';
  }, [location]);

  const activeLink = getActiveLink();

  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 z-50"
        animate={{
          height: scrolled ? HEADER_HEIGHT_SHRUNK : HEADER_HEIGHT_EXPANDED,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Glass background */}
        <div
          className="absolute inset-0"
          style={{
            background: theme === 'dark'
              ? 'linear-gradient(180deg, rgba(10,10,15,0.85) 0%, rgba(10,10,15,0.6) 100%)'
              : 'linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.6) 100%)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderBottom: `1px solid ${scrolled ? 'rgba(99,102,241,0.12)' : 'rgba(148,163,184,0.1)'}`,
          }}
        />

        {/* Inner content */}
        <div className="relative h-full flex items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* ── Logo ──────────────────────────────────────────────────── */}
          <motion.button
            onClick={() => setLocation('/')}
            className="flex items-center gap-2.5 shrink-0"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center relative overflow-hidden"
              style={{ boxShadow: '0 0 20px rgba(124,58,237,0.3), 0 0 40px rgba(124,58,237,0.1)' }}
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              />
              <Brain className="w-5 h-5 text-white relative z-10" strokeWidth={2.5} />
            </motion.div>

            <div className="hidden sm:block">
              <div className="font-bold text-base leading-tight tracking-tight">
                <span className="text-foreground">Dev</span>
                <span className="bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">
                  Insights
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground leading-none mt-0.5 -tracking-wide">
                Engineering Knowledge Hub
              </div>
            </div>
          </motion.button>

          {/* ── Desktop Nav Links ─────────────────────────────────────── */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              const isActive = activeLink === link.id;
              const isHovered = hoveredLink === link.id;

              return (
                <motion.button
                  key={link.id}
                  onClick={() => {
                    if (link.external) {
                      window.open(link.href, '_blank', 'noopener,noreferrer');
                    } else {
                      setLocation(link.href);
                    }
                  }}
                  onMouseEnter={() => setHoveredLink(link.id)}
                  onMouseLeave={() => setHoveredLink(null)}
                  className={cn(
                    'relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {/* Active indicator - animated underline */}
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-indicator"
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full bg-gradient-to-r from-violet-500 via-primary to-cyan-400"
                      style={{ width: '60%' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}

                  {/* Hover background pill */}
                  {isHovered && !isActive && (
                    <motion.div
                      layoutId="hover-nav-pill"
                      className="absolute inset-0 rounded-lg bg-muted/50"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}

                  <Icon className="w-4 h-4 relative z-10" strokeWidth={isActive ? 2.5 : 2} />
                  <span className="relative z-10">{link.label}</span>

                  {link.external && (
                    <ExternalLink className="w-3 h-3 relative z-10 opacity-40" strokeWidth={2} />
                  )}
                </motion.button>
              );
            })}
          </nav>

          {/* ── Right Actions ─────────────────────────────────────────── */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Search trigger */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSearchOpen}
              className={cn(
                'hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl',
                'bg-muted/40 hover:bg-muted/70 border border-border/50',
                'transition-colors text-sm text-muted-foreground min-w-[180px]'
              )}
            >
              <Search className="w-4 h-4" strokeWidth={2} />
              <span className="flex-1 text-left text-xs">Search...</span>
              <kbd className="px-1.5 py-0.5 text-[10px] bg-background border border-border rounded font-mono">
                K
              </kbd>
            </motion.button>

            {/* Mobile search (icon only) */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSearchOpen}
              className="sm:hidden w-10 h-10 rounded-xl flex items-center justify-center bg-muted/50 hover:bg-muted transition-colors"
            >
              <Search className="w-[18px] h-[18px]" strokeWidth={2} />
            </motion.button>

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Mobile hamburger */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileOpen(true)}
              className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center bg-muted/50 hover:bg-muted transition-colors relative overflow-hidden"
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Menu className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Spacer to prevent content overlap */}
      <motion.div
        className="hidden lg:block"
        animate={{ height: scrolled ? HEADER_HEIGHT_SHRUNK : HEADER_HEIGHT_EXPANDED }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      />

      {/* Mobile menu */}
      <MobileMenu
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onSearchOpen={onSearchOpen}
        activeLink={activeLink}
        onNavigate={(href) => {
          if (href.startsWith('http')) {
            window.open(href, '_blank', 'noopener,noreferrer');
          } else {
            setLocation(href);
          }
        }}
      />
    </>
  );
}
