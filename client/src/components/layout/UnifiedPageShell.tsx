import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sidebar } from "./Sidebar";
import { MobileBottomNav } from "./UnifiedNav";
import { MobileHeader } from "./MobileHeader";
import { FaceliftNavbar } from "../facelift-navbar";
import { UnifiedSearch } from "../UnifiedSearch";
import { cn } from "../../lib/utils";

interface UnifiedPageShellProps {
  children: React.ReactNode;
  title?: string;
  fullWidth?: boolean;
  hideNav?: boolean;
  showBack?: boolean;
  useFacelift?: boolean;
  chromeHidden?: boolean;
}

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

export function UnifiedPageShell({
  children,
  title,
  fullWidth = false,
  hideNav = false,
  showBack = false,
  useFacelift = true,
  chromeHidden = false,
}: UnifiedPageShellProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [location] = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();
  const { direction: scrollDirection } = useScrollDirection({ threshold: 16 });

  const transition = prefersReducedMotion ? { duration: 0 } : {
    type: "spring" as const,
    stiffness: 300,
    damping: 25,
  };

  const chromeVisible = chromeHidden
    ? false
    : isMobile
      ? scrollDirection !== "down"
      : true;

  if (hideNav) {
    return <>{children}</>;
  }

  return (
    <div
      className="min-h-screen min-h-dvh overflow-x-hidden w-full"
      style={
        {
          "--safe-top": "env(safe-area-inset-top, 0px)",
          "--safe-bottom": "env(safe-area-inset-bottom, 0px)",
          "--safe-left": "env(safe-area-inset-left, 0px)",
          "--safe-right": "env(safe-area-inset-right, 0px)",
        } as React.CSSProperties
      }
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>

      <div
        className={cn(
          "fixed top-0 left-0 right-0 z-40 transition-transform duration-300",
          !chromeVisible && "-translate-y-full"
        )}
      >
        {useFacelift ? (
          <FaceliftNavbar onSearchOpen={() => setSearchOpen(true)} />
        ) : (
          <MobileHeader
            title={title}
            showBack={showBack}
            onSearchClick={() => setSearchOpen(true)}
          />
        )}
      </div>

      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <motion.div
        animate={{ paddingLeft: isMobile ? 0 : undefined }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
              "w-full overflow-x-hidden min-h-screen",
              fullWidth
                ? "px-3 sm:px-4"
                : "md:mx-auto md:px-3 md:py-3 md:max-w-6xl",
              isMobile && useFacelift && "pt-[var(--chrome-height)]",
              isMobile && "pb-[calc(72px+var(--safe-bottom))]",
              isMobile && "px-3",
              !isMobile && "px-4"
            )}
            style={{
              paddingTop: isMobile
                ? "var(--chrome-height)"
                : undefined,
            }}
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </motion.div>

      <MobileBottomNav />

      <footer className="sr-only" role="contentinfo">
        Open Interview — Technical Interview Preparation
      </footer>

      <UnifiedSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
