import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Maximize2,
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
  {
    icon: <ChevronRight className="w-5 h-5" aria-hidden={true} />,
    label: 'Right',
    description: 'Easy — longer interval',
    color: 'text-green-400',
  },
  {
    icon: <ChevronLeft className="w-5 h-5" aria-hidden={true} />,
    label: 'Left',
    description: 'Again — review soon',
    color: 'text-red-400',
  },
  {
    icon: <ChevronUp className="w-5 h-5" aria-hidden={true} />,
    label: 'Up',
    description: 'Feynman — explain yourself',
    color: 'text-amber-400',
  },
  {
    icon: <ChevronDown className="w-5 h-5" aria-hidden={true} />,
    label: 'Down',
    description: 'Skip — bury for later',
    color: 'text-indigo-400',
  },
];

const DESKTOP_HINTS: HintCard[] = [
  {
    icon: <Maximize2 className="w-5 h-5" aria-hidden={true} />,
    label: '[Space]',
    description: 'Flip card',
    color: 'text-blue-400',
  },
  {
    icon: <ChevronRight className="w-5 h-5" aria-hidden={true} />,
    label: '[→] or [D]',
    description: 'Easy',
    color: 'text-green-400',
  },
  {
    icon: <ChevronLeft className="w-5 h-5" aria-hidden={true} />,
    label: '[←] or [A]',
    description: 'Again',
    color: 'text-red-400',
  },
  {
    icon: <ChevronUp className="w-5 h-5" aria-hidden={true} />,
    label: '[E]',
    description: 'Feynman mode',
    color: 'text-amber-400',
  },
];

export function SwipeHints({ onDismiss }: SwipeHintsProps) {
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();
  const hints = isMobile ? MOBILE_HINTS : DESKTOP_HINTS;

  const dismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  useEffect(() => {
    const timer = setTimeout(dismiss, 5000);
    return () => clearTimeout(timer);
  }, [dismiss]);

  return (
    <AnimatePresence>
      <motion.div
        initial={prefersReducedMotion ? {} : { opacity: 0 }}
        animate={prefersReducedMotion ? {} : { opacity: 1 }}
        exit={prefersReducedMotion ? {} : { opacity: 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
        onClick={dismiss}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 cursor-default"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className={
            isMobile
              ? 'grid grid-cols-2 gap-3 p-4 max-w-xs'
              : 'flex gap-4 p-6 flex-wrap justify-center'
          }
        >
          {hints.map((hint) => (
            <motion.div
              key={hint.label}
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
              className={
                'flex flex-col items-center gap-2 rounded-xl px-4 py-3 text-center ' +
                'bg-[#141414]/80 backdrop-blur-sm border border-[#2a2a2a] ' +
                (isMobile ? 'min-w-[120px]' : 'min-w-[130px]')
              }
            >
              <span className={hint.color}>{hint.icon}</span>
              <span className="text-xs font-semibold text-white">
                {hint.label}
              </span>
              <span className="text-[10px] leading-tight text-gray-400">
                {hint.description}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
