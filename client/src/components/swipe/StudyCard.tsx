import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform, type MotionValue } from 'framer-motion';
import type { SwipeCard } from '@/types/swipe';
import { RecallRatingBar } from '@/components/shared/RecallRatingBar';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

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

const modeColors: Record<string, { bg: string; text: string }> = {
  recall: { bg: 'bg-violet-500/20', text: 'text-violet-300' },
  feynman: { bg: 'bg-emerald-500/20', text: 'text-emerald-300' },
  palace: { bg: 'bg-amber-500/20', text: 'text-amber-300' },
  standard: { bg: 'bg-blue-500/20', text: 'text-blue-300' },
};

export const StudyCard = React.memo(function StudyCard({
  card,
  onSwipe,
  onFlip,
  onRate,
  isFlipped,
  setIsFlipped,
  showHint = false,
  dragX: dragXProp,
}: StudyCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const [exiting, setExiting] = useState<'left' | 'right' | 'up' | 'down' | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
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
    setRevealed(false);
    setShowExplanation(false);
    exitDir.current = null;
  }, [card.id]);

  const exitVariants: Record<string, { x?: number; y?: number; opacity: number; scale: number }> = {
    left: { x: -1200, opacity: 0, scale: 0.8 },
    right: { x: 1200, opacity: 0, scale: 0.8 },
    up: { y: -1200, opacity: 0, scale: 0.8 },
    down: { y: 1200, opacity: 0, scale: 0.8 },
  };

  const mc = modeColors[card.mode] || modeColors.recall;

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={card.id}
        drag={prefersReducedMotion ? false : (exiting ? false : 'x')}
        dragConstraints={prefersReducedMotion ? undefined : { left: 0, right: 0 }}
        dragElastic={prefersReducedMotion ? 0 : 0.2}
        style={{ x, y }}
        initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.9, y: 40 }}
        animate={
          exiting
            ? exitVariants[exiting]
            : prefersReducedMotion ? { opacity: 1 } : { x: 0, y: 0, opacity: 1, scale: 1 }
        }
        exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
        transition={
          exiting
            ? { duration: prefersReducedMotion ? 0 : 0.3, ease: 'easeIn' }
            : prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 30, mass: 0.8 }
        }
        onDragEnd={handleDragEnd}
        onAnimationComplete={handleSwipeComplete}
        onTap={() => {
          if (!exiting) {
            setIsFlipped(!isFlipped);
            onFlip?.();
          }
        }}
        whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
        className="w-full max-w-md min-h-[50vh] sm:min-h-[420px] lg:min-h-[500px] relative rounded-2xl select-none bg-[var(--swipe-bg-card)] border border-[var(--swipe-border)] shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col"
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
          animate={prefersReducedMotion ? {} : { rotateY: isFlipped ? 180 : 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4, ease: 'easeInOut' }}
          className="flex-1"
          style={{ transformStyle: 'preserve-3d', perspective: 1200 }}
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

            <span className={`absolute top-4 right-4 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${mc.bg} ${mc.text}`}>
              {modeLabels[card.mode] ?? card.mode}
            </span>

            {card.mode === 'palace' && card.palaceImage && (
              <div className="mb-3 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-center">
                <p className="text-2xl mb-1">{card.palaceImage}</p>
                <p className="text-[11px] text-violet-300/70">visualize the scene…</p>
              </div>
            )}

            <div className="flex-1 flex flex-col items-center justify-center min-h-0">
              <p
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded((v) => !v);
                }}
                className={cn(
                  'text-[15px] leading-relaxed text-[var(--text-primary)] text-center cursor-pointer transition-all',
                  expanded ? '' : 'line-clamp-3',
                )}
              >
                {card.front}
              </p>
              {!expanded && card.front.length > 200 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(true);
                  }}
                  className="mt-2 text-[11px] font-medium text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Tap to read more
                </button>
              )}
              {expanded && card.front.length > 200 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(false);
                  }}
                  className="mt-2 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Show less
                </button>
              )}
            </div>

            {(card.subChannel || card.tags?.length > 0) && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5 justify-center">
                {card.subChannel && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-500/10 text-violet-300 border border-violet-500/20">
                    {card.subChannel}
                  </span>
                )}
                {card.tags?.slice(0, 3).filter(t => t !== card.channel && t !== card.subChannel).map(tag => (
                  <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {showHint && card.hint && (
              <div className="mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setRevealed(v => !v);
                  }}
                  className="flex items-center gap-1 text-[11px] font-medium text-amber-400 hover:text-amber-300 transition-colors"
                >
                  {revealed ? '▾' : '▸'} {revealed ? 'Hint' : 'Show hint'}
                </button>
                {revealed && (
                  <div className="mt-1 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-[12px] text-amber-300/80">{card.hint}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            className="absolute inset-0 rounded-2xl p-5 flex flex-col"
          >
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              <div className="border-b border-white/5 pb-3">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider gradient-text mb-1">
                  Answer
                </h4>
                <p className="text-sm leading-relaxed text-[var(--text-primary)] whitespace-pre-wrap">
                  {card.back}
                </p>
              </div>

              {card.explanation && (
                <div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowExplanation(v => !v); }}
                    className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-violet-400 hover:text-violet-300 glow-violet transition-all duration-300"
                  >
                    {showExplanation ? '▾' : '▸'} Explanation
                  </button>
                  {showExplanation && (
                    <div className="mt-1 p-3 rounded-xl glass-card">
                      <p className="text-[13px] leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap">
                        {card.explanation}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {card.diagram && (
                <div className="p-3 rounded-lg glass-card">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400 mb-2">
                    Diagram
                  </h4>
                  <div className="overflow-x-auto">
                    <pre className="text-[12px] text-[var(--text-secondary)] font-mono whitespace-pre leading-relaxed">
                      {card.diagram}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {onRate && (
              <div className="mt-4 pt-3 border-t border-[var(--swipe-border)] shrink-0">
                <RecallRatingBar onRate={(r) => onRate(r)} size="md" />
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});
