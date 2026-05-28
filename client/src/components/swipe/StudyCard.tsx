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
  beginner: 'bg-[var(--success)]',
  intermediate: 'bg-[var(--warning)]',
  advanced: 'bg-[var(--error)]',
};

const modeLabels: Record<string, string> = {
  recall: 'Recall',
  feynman: 'Feynman',
  palace: 'Palace',
  standard: 'Standard',
};

const modeColors: Record<string, { bg: string; text: string; border: string }> = {
  recall: { bg: 'bg-[var(--accent-subtle)]', text: 'text-[var(--accent)]', border: 'border-[var(--accent-subtle)]' },
  feynman: { bg: 'bg-[var(--success-subtle)]', text: 'text-[var(--success)]', border: 'border-[var(--success-subtle)]' },
  palace: { bg: 'bg-[var(--warning-subtle)]', text: 'text-[var(--warning)]', border: 'border-[var(--warning-subtle)]' },
  standard: { bg: 'bg-[var(--accent-subtle)]', text: 'text-[var(--accent)]', border: 'border-[var(--accent-subtle)]' },
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
        className="w-full max-w-md min-h-[300px] sm:min-h-[360px] relative rounded-[12px] select-none bg-[var(--surface)] border border-[var(--border)] flex flex-col overflow-hidden"
      >
        {/* Drag tint overlays */}
        <motion.div
          style={{ opacity: leftGlow }}
          className="pointer-events-none absolute inset-0 rounded-[12px] bg-gradient-to-r from-rose-500/20 via-transparent to-transparent z-10"
        />
        <motion.div
          style={{ opacity: rightGlow }}
          className="pointer-events-none absolute inset-0 rounded-[12px] bg-gradient-to-l from-cyan-500/20 via-transparent to-transparent z-10"
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
            className="absolute inset-0 rounded-[12px] p-5 flex flex-col"
          >
            {/* Inline pill tags at top (no absolute positioning) */}
            <div className="flex items-center gap-2 mb-3 shrink-0">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--accent-subtle)] text-[var(--accent)]">
                {card.channel}
              </span>
              <span className={cn('w-2 h-2 rounded-full shrink-0', difficultyDot[card.difficulty])} />
              <span className={cn('ml-auto inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border', mc.bg, mc.text, mc.border)}>
                {modeLabels[card.mode] ?? card.mode}
              </span>
            </div>

            {card.mode === 'palace' && card.palaceImage && (
              <div className="mb-4 p-3 rounded-xl bg-gradient-to-br from-[var(--accent-subtle)] to-[var(--accent-subtle)] border border-[var(--accent-subtle)] text-center shrink-0">
                <p className="text-2xl mb-1">{card.palaceImage}</p>
                <p className="text-[11px] text-[var(--accent)]">visualize the scene...</p>
              </div>
            )}

            {/* Question text — grows to fill, footer is pushed to bottom */}
            <div className="flex-1 min-h-0 px-1 overflow-hidden">
              <p
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded((v) => !v);
                }}
                className={cn(
                  'text-[17px] sm:text-[18px] leading-relaxed text-[var(--fg)] cursor-pointer transition-all font-[var(--font-heading)] font-semibold',
                  card.front.length > 100 ? 'text-left' : 'text-center w-full',
                  expanded ? '' : 'line-clamp-6',
                )}
              >
                {card.front}
              </p>
              {!expanded && card.front.length > 320 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
                  className="mt-2 text-[11px] font-medium text-[var(--accent)] hover:opacity-80 transition-colors"
                >
                  Read more ↓
                </button>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-[var(--border)] shrink-0">
              <div className="flex items-center justify-center gap-2">
                <span className="w-4 h-px bg-[var(--border)]" />
                <p className="text-[13px] font-medium text-[var(--fg-muted)]">Tap anywhere to flip</p>
                <span className="w-4 h-px bg-[var(--border)]" />
              </div>
            </div>
          </div>

          {/* Back */}
          <div
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            className="absolute inset-0 rounded-[12px] p-6 flex flex-col"
          >
            <div className="flex items-center gap-2 mb-4 shrink-0">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--success-subtle)] text-[var(--success)] border border-[var(--success-subtle)]">
                Answer
              </span>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-4 pr-1 custom-scrollbar">
              <div className="rounded-xl bg-gradient-to-br from-[var(--surface-elevated)] to-[var(--surface-elevated)] border border-[var(--border)] p-4">
                <p className="text-sm leading-relaxed text-[var(--fg)] whitespace-pre-wrap font-[var(--font-body)]">
                  {card.back}
                </p>
              </div>

              {card.explanation && (
                <div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowExplanation(v => !v); }}
                    className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--accent)] hover:opacity-80 transition-all duration-300"
                  >
                    {showExplanation ? '\u25BE' : '\u25B8'} Explanation
                  </button>
                  {showExplanation && (
                    <div className="mt-2 p-4 rounded-xl bg-gradient-to-br from-[var(--accent-subtle)] to-transparent border border-[var(--accent-subtle)]">
                      <p className="text-[13px] leading-relaxed text-[var(--fg-secondary)] whitespace-pre-wrap">
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
              <div className="mt-4 pt-4 border-t border-[var(--border)] shrink-0">
                <p className="text-[11px] text-[var(--fg-muted)] text-center">Press [1-4] or swipe to grade</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});
