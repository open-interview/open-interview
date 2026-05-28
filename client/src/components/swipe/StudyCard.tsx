import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform, type MotionValue } from 'framer-motion';
import type { SwipeCard } from '@/types/swipe';
import { MermaidDiagram } from '@/components/MermaidDiagram';
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
  beginner: 'bg-emerald-500',
  intermediate: 'bg-amber-500',
  advanced: 'bg-rose-500',
};

const modeLabels: Record<string, string> = {
  recall: 'Recall',
  feynman: 'Feynman',
  palace: 'Palace',
  standard: 'Standard',
};

const modeColors: Record<string, { bg: string; text: string; border: string }> = {
  recall: { bg: 'bg-violet-500/15', text: 'text-violet-300', border: 'border-violet-500/20' },
  feynman: { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/20' },
  palace: { bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/20' },
  standard: { bg: 'bg-blue-500/15', text: 'text-blue-300', border: 'border-blue-500/20' },
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
        style={{ x }}
        initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.92, y: 30 }}
        animate={
          exiting
            ? exitVariants[exiting]
            : prefersReducedMotion ? { opacity: 1 } : { x: 0, y: 0, opacity: 1, scale: 1 }
        }
        exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
        transition={
          exiting
            ? { duration: prefersReducedMotion ? 0 : 0.25, ease: 'easeIn' }
            : prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 350, damping: 28, mass: 0.8 }
        }
        onDragEnd={handleDragEnd}
        onAnimationComplete={handleSwipeComplete}
        onTap={() => {
          if (!exiting) {
            setIsFlipped(!isFlipped);
            onFlip?.();
          }
        }}
        whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
        className="w-full max-w-md min-h-[50vh] sm:min-h-[420px] lg:min-h-[500px] relative rounded-2xl select-none bg-[var(--swipe-bg-card)] border border-[var(--swipe-border)] shadow-xl flex flex-col overflow-hidden gradient-border-subtle"
      >
        {/* Drag tint overlays */}
        <motion.div
          style={{ opacity: leftGlow }}
          className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-rose-500/20 via-transparent to-transparent z-10"
        />
        <motion.div
          style={{ opacity: rightGlow }}
          className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-l from-cyan-500/20 via-transparent to-transparent z-10"
        />

        <motion.div
          animate={prefersReducedMotion ? {} : { rotateY: isFlipped ? 180 : 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : {
            type: 'spring',
            stiffness: 200,
            damping: 16,
            mass: 1.2,
          }}
          className="flex-1 relative"
          style={{ transformStyle: 'preserve-3d', perspective: 1200 }}
        >
          {/* Front */}
          <div
            style={{ backfaceVisibility: 'hidden' }}
            className="absolute inset-0 rounded-2xl p-6 flex flex-col"
          >
            {/* Inline pill tags at top (no absolute positioning) */}
            <div className="flex items-center gap-2 mb-4 shrink-0">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--swipe-chip-bg)] text-[var(--swipe-chip-text)] border border-violet-500/15">
                {card.channel}
              </span>
              <span className={cn('w-2 h-2 rounded-full shrink-0', difficultyDot[card.difficulty])} />
              <span className={cn('ml-auto inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border', mc.bg, mc.text, mc.border)}>
                {modeLabels[card.mode] ?? card.mode}
              </span>
            </div>

            {card.mode === 'palace' && card.palaceImage && (
              <div className="mb-4 p-3 rounded-xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/15 text-center shrink-0">
                <p className="text-2xl mb-1">{card.palaceImage}</p>
                <p className="text-[11px] text-violet-300/60">visualize the scene...</p>
              </div>
            )}

            <div className="flex-1 flex flex-col items-center justify-center min-h-0 px-2">
              <p
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded((v) => !v);
                }}
                className={cn(
                  'text-base leading-relaxed text-[var(--text-primary)] text-center cursor-pointer transition-all font-medium',
                  expanded ? '' : 'line-clamp-3',
                )}
              >
                {card.front}
              </p>
              {!expanded && card.front.length > 200 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
                  className="mt-2 text-[11px] font-medium text-violet-400/70 hover:text-violet-300 transition-colors"
                >
                  Tap to read more
                </button>
              )}
              {expanded && card.front.length > 200 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
                  className="mt-2 text-[11px] font-medium text-muted-foreground/70 hover:text-foreground transition-colors"
                >
                  Show less
                </button>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[var(--swipe-border)] text-center shrink-0">
              <p className="text-[11px] text-muted-foreground/60">Tap to reveal answer</p>
            </div>
          </div>

          {/* Back */}
          <div
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            className="absolute inset-0 rounded-2xl p-6 flex flex-col"
          >
            <div className="flex items-center gap-2 mb-4 shrink-0">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/15">
                Answer
              </span>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-4 pr-1 custom-scrollbar">
              <div className="rounded-xl bg-gradient-to-br from-[var(--surface-raised)] to-[var(--surface-elevated)] border border-border/30 p-4">
                <p className="text-sm leading-relaxed text-[var(--text-primary)] whitespace-pre-wrap">
                  {card.back}
                </p>
              </div>

              {card.explanation && (
                <div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowExplanation(v => !v); }}
                    className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-violet-400/70 hover:text-violet-300 transition-all duration-300"
                  >
                    {showExplanation ? '\u25BE' : '\u25B8'} Explanation
                  </button>
                  {showExplanation && (
                    <div className="mt-2 p-4 rounded-xl bg-gradient-to-br from-violet-500/5 to-indigo-500/5 border border-violet-500/10">
                      <p className="text-[13px] leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap">
                        {card.explanation}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {card.diagram && (
                <div className="rounded-xl bg-gradient-to-br from-cyan-500/5 to-blue-500/5 border border-cyan-500/10 overflow-hidden">
                  <div className="px-4 pt-3 pb-1">
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400/70">Diagram</h4>
                  </div>
                  <div className="p-3">
                    <MermaidDiagram chart={card.diagram} />
                  </div>
                </div>
              )}
            </div>

            {onRate && (
              <div className="mt-4 pt-4 border-t border-[var(--swipe-border)] shrink-0">
                <p className="text-[11px] text-muted-foreground/50 text-center">Press [1-4] or swipe to grade</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});
