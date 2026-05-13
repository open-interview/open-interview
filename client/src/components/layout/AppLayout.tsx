/**
 * App Layout — Mobile-first shell
 * Safe area CSS vars, Framer Motion page transitions, scroll restoration
 */

import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './UnifiedNav';
import { MobileHeader } from './MobileHeader';
import { UnifiedSearch } from '../UnifiedSearch';
import { FaceliftNavbar } from '../facelift-navbar';
import { useSidebar } from '../../context/SidebarContext';
import { cn } from '../../lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  fullWidth?: boolean;
  hideNav?: boolean;
  showBackOnMobile?: boolean;
  useFacelift?: boolean;
}

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -4 },
};

const pageTransition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 25,
};

export function AppLayout({
  children,
  title,
  fullWidth = false,
  hideNav = false,
  showBackOnMobile = false,
  useFacelift = true,
}: AppLayoutProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [location] = useLocation();
  const { isCollapsed } = useSidebar();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const transition = prefersReducedMotion ? { duration: 0 } : pageTransition;

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Keyboard shortcut: ⌘K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Scroll restoration on route change
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location]);

  if (hideNav) {
    return <>{children}</>;
  }

  // Desktop sidebar width: 280px expanded, 72px collapsed
  const sidebarWidth = isCollapsed ? 72 : 280;

  return (
    <div
      className="min-h-screen min-h-dvh bg-background/80 backdrop-blur-md overflow-x-hidden w-full"
      style={{
        '--safe-top': 'env(safe-area-inset-top, 0px)',
        '--safe-bottom': 'env(safe-area-inset-bottom, 0px)',
        '--safe-left': 'env(safe-area-inset-left, 0px)',
        '--safe-right': 'env(safe-area-inset-right, 0px)',
      } as React.CSSProperties}
    >
      {/* Skip to main content — keyboard accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>
      {/* Facelift Navbar (top header for all breakpoints) */}
      {useFacelift && <div className="lg:hidden"><FaceliftNavbar onSearchOpen={() => setSearchOpen(true)} /></div>}

      {/* Desktop Sidebar — offset below the facelift navbar */}
      {useFacelift && (
        <div className="hidden lg:block">
          <Sidebar />
        </div>
      )}

      {/* Desktop Sidebar (legacy mode, full-height) */}
      {!useFacelift && (
        <div className="hidden lg:block">
          <Sidebar />
        </div>
      )}

      {/* Mobile Header (legacy mode) */}
      {!useFacelift && (
        <MobileHeader
          title={title}
          showBack={showBackOnMobile}
          onSearchClick={() => setSearchOpen(true)}
        />
      )}

      {/* Content area — single render with sidebar-aware padding */}
      <motion.div
        animate={{ paddingLeft: isMobile ? 0 : sidebarWidth }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={location}
            id="main-content"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
            ref={scrollRef as React.RefObject<HTMLElement>}
            className={cn(
              'w-full overflow-x-hidden',
              fullWidth
                ? ''
                : 'mx-auto px-4 py-4 max-w-6xl',
              isMobile && useFacelift && 'pt-16',
              isMobile && 'pb-[calc(80px+env(safe-area-inset-bottom,0px))]',
            )}
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </motion.div>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav />

      <footer className="sr-only" role="contentinfo">
        Open Interview — Technical Interview Preparation
      </footer>

      <UnifiedSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
