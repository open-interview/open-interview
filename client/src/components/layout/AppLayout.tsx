/**
 * App Layout — Mobile-first shell
 * Safe area CSS vars, Framer Motion page transitions, scroll restoration
 */

import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './UnifiedNav';
import { MobileHeader } from './MobileHeader';
import { UnifiedSearch } from '../UnifiedSearch';
import { useSidebar } from '../../context/SidebarContext';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  fullWidth?: boolean;
  hideNav?: boolean;
  showBackOnMobile?: boolean;
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
}: AppLayoutProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [location] = useLocation();
  const { isCollapsed } = useSidebar();
  const scrollRef = useRef<HTMLDivElement>(null);

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
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Header */}
      <MobileHeader
        title={title}
        showBack={showBackOnMobile}
        onSearchClick={() => setSearchOpen(true)}
      />

      {/* Content area — offset by sidebar on desktop */}
      <motion.div
        animate={{ paddingLeft: sidebarWidth }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="hidden lg:block"
        style={{ paddingLeft: sidebarWidth }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={location}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            ref={scrollRef as React.RefObject<HTMLElement>}
            className={fullWidth ? 'w-full overflow-x-hidden' : 'max-w-7xl mx-auto px-6 py-6 w-full overflow-x-hidden'}
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </motion.div>

      {/* Mobile content — below header, above bottom nav */}
      <div className="lg:hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={location}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            className={fullWidth
              ? 'w-full overflow-x-hidden pb-[calc(56px+env(safe-area-inset-bottom,0px))]'
              : 'max-w-7xl mx-auto px-3 py-3 w-full overflow-x-hidden pb-[calc(56px+env(safe-area-inset-bottom,0px))]'
            }
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav />

      <footer className="sr-only" role="contentinfo">
        Code Reels — Technical Interview Preparation
      </footer>

      <UnifiedSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
