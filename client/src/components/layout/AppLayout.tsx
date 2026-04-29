/**
 * App Layout — Material Design 3 shell
 *
 * Breakpoints:
 *   mobile  (<600px):   bottom nav + mobile header
 *   tablet  (600-840px): nav rail (80dp) + mobile header
 *   desktop (>840px):  sidebar (280/72dp collapsed)
 *
 * Page transitions:
 *   fade-through  — tab switches (opacity 0 → brief gap → 1)
 *   shared-axis-Y — drill-down (slide + fade)
 *
 * Safe area: env(safe-area-inset-*) applied throughout.
 */

import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { MobileBottomNav, NavRail } from './UnifiedNav';
import { MobileHeader } from './MobileHeader';
import { UnifiedSearch } from '../UnifiedSearch';
import { useSidebar } from '../../context/SidebarContext';
import { SkipLink } from '../a11y';
import { useFocusManagement } from '../../hooks/use-focus-management';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  fullWidth?: boolean;
  hideNav?: boolean;
  showBackOnMobile?: boolean;
}

// M3 fade-through: simultaneous fade + scale, brief overlap at low opacity
// Outgoing: opacity 1→0, scale 1→0.98 (accelerate easing for exit)
// Incoming: opacity 0→1, scale 0.98→1 (decelerate easing for enter)
// 300ms medium2 per M3 §7.3, simultaneous animation for "through" moment
const fadeThroughVariants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: [0, 0, 0, 1] } },
  exit:    { opacity: 0, scale: 0.98, transition: { duration: 0.3, ease: [0.3, 0, 1, 1] } },
};

// M3 shared-axis-Y: slide up + fade for drill-down navigation
const sharedAxisYVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0,  transition: { duration: 0.3, ease: [0.2, 0, 0, 1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15, ease: [0.2, 0, 0, 1] } },
};

// Tab-level paths use fade-through; nested paths use shared-axis-Y
const TAB_PATHS = new Set(['/', '/channels', '/voice-interview', '/profile']);

function isTabSwitch(location: string): boolean {
  return TAB_PATHS.has(location);
}

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
  const navRef = useRef<HTMLDivElement>(null);
  const { announceRouteChange } = useFocusManagement();

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

  // Scroll restoration and focus management on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    announceRouteChange(location);

    // Focus main content for keyboard users
    setTimeout(() => {
      const main = document.getElementById('main-content');
      if (main && main instanceof HTMLElement) {
        main.focus();
      }
    }, 100);
  }, [location, announceRouteChange]);

  if (hideNav) {
    return <>{children}</>;
  }

  const sidebarWidth = isCollapsed ? 72 : 280;
  const variants = isTabSwitch(location) ? fadeThroughVariants : sharedAxisYVariants;

  // Bottom nav height (80dp) + safe area bottom
  const mobileBottomPad = 'calc(80px + env(safe-area-inset-bottom, 0px))';
  // Nav rail width (80dp) + safe area left
  const railLeftPad = 'calc(80px + env(safe-area-inset-left, 0px))';

  return (
    <div
      className="min-h-screen min-h-dvh overflow-x-hidden w-full"
      style={{
        background: 'var(--md-sys-color-background)',
        '--safe-top':    'env(safe-area-inset-top, 0px)',
        '--safe-bottom': 'env(safe-area-inset-bottom, 0px)',
        '--safe-left':   'env(safe-area-inset-left, 0px)',
        '--safe-right':  'env(safe-area-inset-right, 0px)',
      } as React.CSSProperties}
    >
      <SkipLink />

      {/* Navigation - conditionally rendered based on viewport */}
      <div className="hidden lg:block" id="main-nav">
        <Sidebar />
      </div>
      <div className="hidden sm:block lg:hidden" id="main-nav">
        <NavRail />
      </div>

      {/* Mobile + Tablet Header (<840px) */}
      <MobileHeader
        title={title}
        showBack={showBackOnMobile}
        onSearchClick={() => setSearchOpen(true)}
      />

       {/* Main content - single element with responsive padding */}
       <div className="w-full overflow-x-hidden">
         <AnimatePresence initial={false}>
           <motion.main
             key={location}
             variants={variants}
             initial="initial"
             animate="animate"
             exit="exit"
             id="main-content"
             tabIndex={-1}
             className="w-full outline-none"
             style={{
               maxWidth: fullWidth ? 'none' : '80rem',
               margin: fullWidth ? '0' : '0 auto',
               padding: '0.75rem',
               paddingLeft: sidebarWidth,
               paddingBottom: mobileBottomPad,
             }}
           >
             {children}
           </motion.main>
         </AnimatePresence>
       </div>

      {/* Mobile Bottom Nav (<600px) */}
      <MobileBottomNav />

      <footer className="sr-only" role="contentinfo">
        Open Interview — Technical Interview Preparation
      </footer>

      <UnifiedSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Screen reader route announcer */}
      <div
        id="route-announcer"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
    </div>
  );
}
