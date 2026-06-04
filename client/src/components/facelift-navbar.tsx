import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
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

// ─── Constants ───────────────────────────────────────────────────────────────

const SCROLL_THRESHOLD = 20;
const HEADER_HEIGHT = { expanded: 56, shrunk: 48 };

// ─── Scroll Progress Bar ─────────────────────────────────────────────────────

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-[60] h-[2px] origin-left"
      style={{
        scaleX,
        background: 'linear-gradient(90deg, var(--brand-500), var(--cyan-400))',
      }}
    />
  );
}

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
        'relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all',
        'bg-muted/50 hover:bg-muted/80 border border-border/50',
        'overflow-hidden'
      )}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="sun"
            initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="size-4 sm:size-[18px] text-amber-400" strokeWidth={2} />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ rotate: 90, opacity: 0, scale: 0.8 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -90, opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="size-4 sm:size-[18px] text-muted-foreground" strokeWidth={2} />
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

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 250 }}
            className="fixed top-0 right-0 bottom-0 z-[70] w-[300px] max-w-[85vw] lg:hidden flex flex-col"
          >
            <div className="absolute inset-0 bg-background/95 backdrop-blur-xl border-l border-border/50" />

            <div className="relative flex items-center justify-between h-16 px-5 border-b border-border/50">
              <span className="font-semibold text-lg">Menu</span>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-muted/50 hover:bg-muted transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

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
                    <Icon className="size-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                    <span className="flex-1 text-left text-sm">{link.label}</span>
                    {link.external && <ExternalLink className="size-3.5 opacity-50" />}
                    {isActive && (
                      <motion.div
                        layoutId="mobile-active-dot"
                        className="size-1.5 rounded-full bg-primary"
                      />
                    )}
                    <ChevronRight className="size-4 opacity-30" />
                  </motion.button>
                );
              })}

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
                <Search className="size-5 shrink-0" />
                <span className="flex-1 text-left text-sm">Search</span>
                <kbd className="px-2 py-0.5 text-[10px] bg-muted border border-border rounded font-mono">
                  K
                </kbd>
              </motion.button>
            </nav>

            <div className="relative px-5 py-4 border-t border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <div className="size-6 rounded-lg bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center">
                  <Brain className="size-3.5 text-white" />
                </div>
                <span>Open Interview v1.0</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Logo Component ──────────────────────────────────────────────────────────

function Logo({ onHome }: { onHome: () => void }) {
  return (
    <motion.button
      onClick={onHome}
      className="flex items-center gap-2.5 shrink-0"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      aria-label="Go to home page"
      data-testid="button-logo-home"
    >
      <motion.div
        className="size-8 sm:size-9 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center relative overflow-hidden shrink-0"
        style={{ boxShadow: '0 0 20px var(--brand-500/0.3), 0 0 40px var(--brand-500/0.1)' }}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
        <Brain className="size-4 sm:size-5 text-white relative z-10" strokeWidth={2.5} />
      </motion.div>

      <div className="hidden sm:block">
        <div className="font-bold text-sm sm:text-base leading-tight tracking-tight">
          <span className="text-foreground">Open </span>
          <span className="bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">
            Interview
          </span>
        </div>
        <div className="text-[10px] text-muted-foreground leading-none mt-0.5 -tracking-wide">
          Ace your next tech interview
        </div>
      </div>
    </motion.button>
  );
}

// ─── Desktop Nav Links ───────────────────────────────────────────────────────

function DesktopNav({
  links,
  activeLink,
  onNavigate,
}: {
  links: NavLink[];
  activeLink: string;
  onNavigate: (href: string) => void;
}) {
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  return (
    <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
      {links.map((link) => {
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
                onNavigate(link.href);
              }
            }}
            onMouseEnter={() => setHoveredLink(link.id)}
            onMouseLeave={() => setHoveredLink(null)}
            className={cn(
              'relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2',
              isActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
            data-testid={`button-nav-${link.id}`}
          >
            {isActive && (
              <motion.div
                layoutId="active-nav-indicator"
                className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full bg-gradient-to-r from-violet-500 via-primary to-cyan-400"
                style={{ width: '60%' }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}

            {isHovered && !isActive && (
              <motion.div
                layoutId="hover-nav-pill"
                className="absolute inset-0 rounded-lg bg-muted/50"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}

            <Icon className="size-4 relative z-10" strokeWidth={isActive ? 2.5 : 2} />
            <span className="relative z-10">{link.label}</span>

            {link.external && (
              <ExternalLink className="size-3 relative z-10 opacity-40" strokeWidth={2} />
            )}
          </motion.button>
        );
      })}
    </nav>
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
      {/* Scroll progress bar */}
      <ScrollProgress />

      <motion.header
        className="fixed top-0 left-0 right-0 z-50"
        animate={{
          height: scrolled ? HEADER_HEIGHT.shrunk : HEADER_HEIGHT.expanded,
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
            borderBottom: `1px solid ${scrolled ? 'var(--border-default)' : 'var(--border-subtle)'}`,
          }}
        />

        {/* Inner content */}
        <div className="relative h-full flex items-center justify-between px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <Logo onHome={() => setLocation('/')} />

          <DesktopNav
            links={NAV_LINKS}
            activeLink={activeLink}
            onNavigate={(href) => setLocation(href)}
          />

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
              aria-label="Open search"
              data-testid="button-search-open"
            >
              <Search className="size-4" strokeWidth={2} />
              <span className="flex-1 text-left text-xs">Search...</span>
              <kbd className="px-1.5 py-0.5 text-[10px] bg-background border border-border rounded font-mono">
                K
              </kbd>
            </motion.button>

            {/* Mobile search */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSearchOpen}
              className="sm:hidden size-9 rounded-xl flex items-center justify-center bg-muted/50 hover:bg-muted transition-colors"
              aria-label="Open search"
              data-testid="button-search-open-mobile"
            >
              <Search className="size-4" strokeWidth={2} />
            </motion.button>

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Mobile hamburger */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileOpen(true)}
              className="lg:hidden size-9 rounded-xl flex items-center justify-center bg-muted/50 hover:bg-muted transition-colors relative overflow-hidden"
              aria-label="Open menu"
              data-testid="button-menu-open"
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
                    <X className="size-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Menu className="size-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Spacer */}
      <motion.div
        className="hidden lg:block"
        animate={{ height: scrolled ? HEADER_HEIGHT.shrunk : HEADER_HEIGHT.expanded }}
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
