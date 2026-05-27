import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform, type MotionValue } from 'framer-motion';
import type { SwipeCard } from '@/types/swipe';
import { RecallRatingBar } from '@/components/shared/RecallRatingBar';
import { cn } from '@/lib/utils';

const SWIPE_THRESHOLD = 100;

interface StudyCardProps {
  card: SwipeCard;
  onSwipe: (direction: 'left' | 'right' | 'up' | 'down') => void;
  onFlip?: () => void;
  onRate?: (rating: 'again' | 'hard' | 'good' | 'easy') => void;
  isFlipped: boolean;
  setIsFlipped: (v: boolean) => void;
  showHint?: boolean;
  dragX?: MotionValue<number>;
}

const difficultyDot: Record<string, string> = {
  beginner: 'bg-green-500',
  intermediate: 'bg-yellow-500',
  advanced: 'bg-red-500',
};

const modeLabels: Record<string, string> = {
  recall: 'Recall',
  feynman: 'Feynman',
  palace: 'Palace',
  standard: 'Standard',
};

export function StudyCard({
  card,
  onSwipe,
  onFlip,
  onRate,
  isFlipped,
  setIsFlipped,
  showHint = false,
  dragX: dragXProp,
}: StudyCardProps) {
  const [exiting, setExiting] = useState<'left' | 'right' | 'up' | 'down' | null>(null);
  const [expanded, setExpanded] = useState(false);
  const exitDir = useRef<'left' | 'right' | 'up' | 'down' | null>(null);

  const internalX = useMotionValue(0);
  const x = dragXProp ?? internalX;
  const y = useMotionValue(0);

  const rightGlow = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const leftGlow = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);

  const triggerSwipe = useCallback((dir: 'left' | 'right' | 'up' | 'down') => {
    setExiting((prev) => {
      if (prev) return prev;
      exitDir.current = dir;
      return dir;
    });
  }, []);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const ox = info.offset.x;
      const oy = info.offset.y;

      if (Math.abs(ox) > Math.abs(oy)) {
        if (Math.abs(ox) > SWIPE_THRESHOLD) {
          triggerSwipe(ox > 0 ? 'right' : 'left');
        }
      } else {
        if (Math.abs(oy) > SWIPE_THRESHOLD) {
          triggerSwipe(oy > 0 ? 'down' : 'up');
        }
      }
    },
    [triggerSwipe],
  );

  const handleSwipeComplete = useCallback(() => {
    const dir = exitDir.current;
    if (!dir) return;
    onSwipe(dir);
  }, [onSwipe]);

  useEffect(() => {
    setExiting(null);
    setExpanded(false);
    exitDir.current = null;
  }, [card.id]);

  const exitVariants: Record<string, { x?: number; y?: number; opacity: number; scale: number }> = {
    left: { x: -1200, opacity: 0, scale: 0.8 },
    right: { x: 1200, opacity: 0, scale: 0.8 },
    up: { y: -1200, opacity: 0, scale: 0.8 },
    down: { y: 1200, opacity: 0, scale: 0.8 },
  };

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={card.id}
        drag={exiting ? false : 'x'}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        style={{ x, y }}
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={
          exiting
            ? exitVariants[exiting]
            : { x: 0, y: 0, opacity: 1, scale: 1 }
        }
        exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
        transition={
          exiting
            ? { duration: 0.3, ease: 'easeIn' }
            : { type: 'spring', stiffness: 300, damping: 30, mass: 0.8 }
        }
        onDragEnd={handleDragEnd}
        onAnimationComplete={handleSwipeComplete}
        onTap={() => {
          if (!exiting) {
            setIsFlipped(!isFlipped);
            onFlip?.();
          }
        }}
        whileTap={{ scale: 0.98 }}
        className="w-full max-w-md min-h-[50vh] sm:min-h-[420px] lg:min-h-[500px] relative rounded-2xl select-none bg-[var(--swipe-bg-card)] border border-[var(--swipe-border)] shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
      >
        <motion.div
          style={{ opacity: rightGlow }}
          className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-green-500/40 bg-green-500/10 shadow-[0_0_40px_rgba(34,197,94,0.2)]"
        />
        <motion.div
          style={{ opacity: leftGlow }}
          className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-red-500/40 bg-red-500/10 shadow-[0_0_40px_rgba(239,68,68,0.2)]"
        />

        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          style={{ transformStyle: 'preserve-3d', perspective: 1200, width: '100%', height: '100%' }}
        >
          <div
            style={{ backfaceVisibility: 'hidden' }}
            className="absolute inset-0 rounded-2xl p-5 flex flex-col"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--swipe-chip-bg)] text-[var(--swipe-chip-text)]">
                {card.channel}
              </span>
              <span className={cn('w-2 h-2 rounded-full', difficultyDot[card.difficulty])} />
            </div>

            <span className="absolute top-4 right-4 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-violet-500/20 text-violet-300">
              {modeLabels[card.mode] ?? card.mode}
            </span>

            <div className="flex-1 flex items-center justify-center">
              <p
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded((v) => !v);
                }}
                className={cn(
                  'text-[15px] leading-relaxed text-white/90 text-center cursor-pointer transition-all',
                  expanded ? '' : 'line-clamp-3',
                )}
              >
                {card.front}
              </p>
            </div>

            {showHint && card.hint && (
              <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-[12px] text-amber-300/80">{card.hint}</p>
              </div>
            )}
          </div>

          <div
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            className="absolute inset-0 rounded-2xl p-5 flex flex-col"
          >
            <div className="flex-1 overflow-y-auto">
              <p className="text-sm leading-relaxed text-white/90 whitespace-pre-wrap">
                {card.back}
              </p>
            </div>

            {onRate && (
              <div className="mt-4 pt-3 border-t border-[var(--swipe-border)]">
                <RecallRatingBar onRate={(r) => onRate(r)} size="md" />
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
