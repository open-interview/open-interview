import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  Maximize2,
  X,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface SwipeHintsProps {
  onDismiss: () => void;
}

interface HintCard {
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
}

const MOBILE_HINTS: HintCard[] = [
  { icon: <ChevronRight className="w-4 h-4" />, label: 'Swipe right', description: 'Easy',   color: 'text-emerald-400' },
  { icon: <ChevronLeft  className="w-4 h-4" />, label: 'Swipe left',  description: 'Again',  color: 'text-rose-400' },
  { icon: <ChevronUp    className="w-4 h-4" />, label: 'Swipe up',    description: 'Feynman', color: 'text-amber-400' },
];

const DESKTOP_HINTS: HintCard[] = [
  { icon: <Maximize2    className="w-4 h-4" />, label: 'Space',   description: 'Flip card',    color: 'text-blue-400' },
  { icon: <ChevronRight className="w-4 h-4" />, label: '→ / D',   description: 'Easy',         color: 'text-emerald-400' },
  { icon: <ChevronLeft  className="w-4 h-4" />, label: '← / A',   description: 'Again',        color: 'text-rose-400' },
  { icon: <ChevronUp    className="w-4 h-4" />, label: 'E',       description: 'Feynman mode', color: 'text-amber-400' },
];

export function SwipeHints({ onDismiss }: SwipeHintsProps) {
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();
  const hints = isMobile ? MOBILE_HINTS : DESKTOP_HINTS;

  const dismiss = useCallback(() => onDismiss(), [onDismiss]);

  useEffect(() => {
    const timer = setTimeout(dismiss, 5000);
    return () => clearTimeout(timer);
  }, [dismiss]);

  return (
    <AnimatePresence>
      <motion.div
        initial={prefersReducedMotion ? {} : { opacity: 0, y: 16 }}
        animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
        exit={prefersReducedMotion ? {} : { opacity: 0, y: 16 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.25, ease: 'easeOut' }}
        className="fixed bottom-[72px] md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-4 py-2.5 rounded-2xl bg-[#1d1f23]/95 border border-[var(--tw-border)] shadow-2xl backdrop-blur-sm"
      >
        <div className="flex items-center gap-4 mr-2">
          {hints.map((hint) => (
            <div key={hint.label} className="flex items-center gap-1.5">
              <span className={hint.color}>{hint.icon}</span>
              <span className="text-[11px] text-[#71767b]">
                <span className="font-semibold text-[#e7e9ea]">{hint.label}</span>
                {' '}{hint.description}
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={dismiss}
          className="w-5 h-5 flex items-center justify-center rounded-full text-[#71767b] hover:text-[#e7e9ea] hover:bg-[#2f3336] transition-colors ml-1 shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-3 h-3" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
