/**
 * UnifiedQuestionView — Material Design 3 revamp
 *
 * M3 changes applied:
 * 1. Elevated card Level 1 (tonal overlay + shadow-1)
 * 2. Container-transform answer reveal (button morphs into panel)
 * 3. Filled-tonal icon buttons for prev/next, 48dp touch targets
 * 4. M3 linear progress indicator at top of screen
 * 5. Difficulty filter chip with tonal color
 * 6. Bookmark icon-button toggle with 150ms fill animation
 * 7. Metadata bar: Body Small, on-surface-variant, 8dp spacing
 * 8. Horizontal swipe with spring physics
 * 9. Bottom app bar + FAB for Voice Practice
 * 10. Code blocks: monospace, surface-variant bg, syntax highlighting (in AnswerPanel)
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion, PanInfo, useSpring, useTransform, useMotionValue } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Eye, EyeOff, Bookmark, BookmarkCheck,
  Mic, Share2, Loader2,
} from 'lucide-react';
import type { Question } from '../../types';
import { UnifiedQuestionPanel } from './UnifiedQuestionPanel';
import { UnifiedAnswerPanel } from './UnifiedAnswerPanel';
import { UnifiedMetadataBar } from './UnifiedMetadataBar';
import { cn } from '../../lib/utils';

export interface UnifiedQuestionViewProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  mode: 'browse' | 'test' | 'interview' | 'certification' | 'review';
  showAnswer?: boolean;
  onAnswerToggle?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onBookmark?: () => void;
  onVoicePractice?: () => void;
  isBookmarked?: boolean;
  autoReveal?: boolean;
  className?: string;
}

// ─── M3 color tokens per difficulty ─────────────────────────────────────────

const DIFFICULTY_CHIP: Record<string, { bg: string; color: string; border: string }> = {
  beginner:     { bg: 'rgba(52,168,83,0.12)',  color: '#34a853', border: 'rgba(52,168,83,0.3)'  },
  intermediate: { bg: 'rgba(251,188,5,0.12)',  color: '#f9ab00', border: 'rgba(251,188,5,0.3)'  },
  advanced:     { bg: 'rgba(234,67,53,0.12)',  color: '#ea4335', border: 'rgba(234,67,53,0.3)'  },
};

// ─── M3 Linear Progress ──────────────────────────────────────────────────────

function M3LinearProgress({ value }: { value: number }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        zIndex: 60,
        background: 'var(--md-sys-color-surface-variant, rgba(255,255,255,0.08))',
      }}
    >
      <motion.div
        style={{
          height: '100%',
          background: 'var(--md-sys-color-primary, #8ab4f8)',
          borderRadius: '0 2px 2px 0',
          transformOrigin: 'left',
        }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: value / 100 }}
        transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
      />
    </div>
  );
}

// ─── M3 Difficulty Chip ──────────────────────────────────────────────────────

function DifficultyChip({ difficulty }: { difficulty: string }) {
  const style = DIFFICULTY_CHIP[difficulty] ?? DIFFICULTY_CHIP.beginner;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 12px',
        borderRadius: 8, // M3 small shape
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: '0.1px',
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        lineHeight: '16px',
      }}
    >
      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
    </span>
  );
}

// ─── M3 Filled-Tonal Icon Button (48dp) ─────────────────────────────────────

function TonalIconButton({
  onClick,
  disabled,
  children,
  label,
  loading,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  label: string;
  loading?: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={label}
      whileTap={!disabled ? { scale: 0.92 } : {}}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 48,
        height: 48,
        borderRadius: 12, // M3 medium shape
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.38 : 1,
        background: disabled
          ? 'var(--md-sys-color-surface-variant, rgba(255,255,255,0.06))'
          : 'var(--md-sys-color-secondary-container, rgba(138,180,248,0.15))',
        color: disabled
          ? 'var(--md-sys-color-on-surface-variant, #9aa0a6)'
          : 'var(--md-sys-color-on-secondary-container, #8ab4f8)',
        transition: 'background 150ms cubic-bezier(0.2,0,0,1), opacity 150ms',
        flexShrink: 0,
      }}
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : children}
    </motion.button>
  );
}

// ─── M3 Bookmark Toggle ──────────────────────────────────────────────────────

function BookmarkToggle({ isBookmarked, onToggle }: { isBookmarked: boolean; onToggle: () => void }) {
  return (
    <motion.button
      onClick={onToggle}
      aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark question'}
      aria-pressed={isBookmarked}
      whileTap={{ scale: 0.88 }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 48,
        height: 48,
        borderRadius: 12,
        border: 'none',
        cursor: 'pointer',
        background: isBookmarked
          ? 'var(--md-sys-color-primary-container, rgba(138,180,248,0.2))'
          : 'transparent',
        color: isBookmarked
          ? 'var(--md-sys-color-primary, #8ab4f8)'
          : 'var(--md-sys-color-on-surface-variant, #9aa0a6)',
        // M3 spec: 150ms for icon state change
        transition: 'background 150ms cubic-bezier(0.2,0,0,1), color 150ms cubic-bezier(0.2,0,0,1)',
        flexShrink: 0,
      }}
    >
      <motion.div
        animate={isBookmarked ? { scale: [1, 1.25, 1] } : { scale: 1 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
      >
        {isBookmarked
          ? <BookmarkCheck className="w-5 h-5" style={{ fill: 'currentColor' }} />
          : <Bookmark className="w-5 h-5" />}
      </motion.div>
    </motion.button>
  );
}

// ─── Container Transform: Reveal Button → Answer Panel ──────────────────────

function ContainerTransformReveal({
  isRevealed,
  onReveal,
  onHide,
  children,
}: {
  isRevealed: boolean;
  onReveal: () => void;
  onHide: () => void;
  children: React.ReactNode;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div style={{ position: 'relative' }}>
      <AnimatePresence mode="wait">
        {!isRevealed ? (
          // The "seed" element — the reveal button
          <motion.div
            key="reveal-btn"
            layout
            initial={false}
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.95, y: -8 }
            }
            transition={{ duration: 0.2, ease: [0.3, 0, 1, 1] }} // M3 accelerate exit
          >
            <motion.button
              onClick={onReveal}
              data-testid="button-reveal-answer"
              layoutId="answer-container"
              whileTap={{ scale: 0.97 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 24px',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                border: 'none',
                background: 'var(--md-sys-color-primary, #1a73e8)',
                color: 'var(--md-sys-color-on-primary, #fff)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 2px 6px rgba(0,0,0,0.15)',
                transition: 'box-shadow 200ms cubic-bezier(0.2,0,0,1)',
              }}
            >
              <Eye className="w-4 h-4" />
              Show Answer
            </motion.button>
          </motion.div>
        ) : (
          // The "final" element — the answer panel, morphed from the button
          <motion.div
            key="answer-panel"
            layoutId="answer-container"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.3,
              ease: [0, 0, 0, 1], // M3 decelerate enter
            }}
            style={{
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            {/* Hide button */}
            <div style={{ marginBottom: 16 }}>
              <button
                onClick={onHide}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  background: 'transparent',
                  color: 'var(--md-sys-color-on-surface-variant, #9aa0a6)',
                  border: '1px solid var(--md-sys-color-outline-variant, rgba(255,255,255,0.12))',
                  transition: 'background 150ms',
                }}
              >
                <EyeOff className="w-4 h-4" />
                Hide answer
              </button>
            </div>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function UnifiedQuestionView({
  question,
  questionNumber,
  totalQuestions,
  mode,
  showAnswer = false,
  onAnswerToggle,
  onNext,
  onPrevious,
  onBookmark,
  onVoicePractice,
  isBookmarked = false,
  autoReveal = false,
  className,
}: UnifiedQuestionViewProps) {
  const [internalShowAnswer, setInternalShowAnswer] = useState(showAnswer);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // Spring-physics drag for swipe gesture
  const dragX = useMotionValue(0);
  const dragOpacity = useTransform(dragX, [-200, 0, 200], [0.6, 1, 0.6]);

  useEffect(() => {
    if (autoReveal && mode === 'browse') {
      const t = setTimeout(() => setInternalShowAnswer(true), 300);
      return () => clearTimeout(t);
    }
  }, [autoReveal, mode, question.id]);

  const triggerHaptic = useCallback((type: 'light' | 'medium' = 'light') => {
    if ('vibrate' in navigator) navigator.vibrate(type === 'light' ? 10 : 20);
  }, []);

  const handleAnswerToggle = useCallback(() => {
    setInternalShowAnswer(v => !v);
    triggerHaptic('light');
    onAnswerToggle?.();
  }, [onAnswerToggle, triggerHaptic]);

  const navigate = useCallback((dir: 'next' | 'prev') => {
    if (isTransitioning) return;
    if (dir === 'next' && questionNumber >= totalQuestions) return;
    if (dir === 'prev' && questionNumber <= 1) return;
    setIsTransitioning(true);
    triggerHaptic('medium');
    setTimeout(() => {
      dir === 'next' ? onNext?.() : onPrevious?.();
      setInternalShowAnswer(false);
      setIsTransitioning(false);
    }, shouldReduceMotion ? 0 : 250);
  }, [isTransitioning, questionNumber, totalQuestions, onNext, onPrevious, shouldReduceMotion, triggerHaptic]);

  // Swipe with spring physics
  const handleDragEnd = useCallback((_e: any, info: PanInfo) => {
    const threshold = 80;
    if (info.offset.x < -threshold || info.velocity.x < -400) {
      navigate('next');
    } else if (info.offset.x > threshold || info.velocity.x > 400) {
      navigate('prev');
    }
    dragX.set(0);
  }, [navigate, dragX]);

  const progress = Math.round((questionNumber / totalQuestions) * 100);
  const canPrev = questionNumber > 1;
  const canNext = questionNumber < totalQuestions;

  return (
    <div className={cn('relative min-h-screen w-full flex flex-col', className)}
      style={{ background: 'var(--background, #1a1a1a)' }}>

      {/* 4. M3 Linear Progress — fixed at top */}
      <M3LinearProgress value={progress} />

      {/* Scrollable content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.15, right: 0.15 }}
        style={{ x: dragX, opacity: dragOpacity, flex: 1 }}
        onDragEnd={handleDragEnd}
        className="flex-1 overflow-y-auto overflow-x-hidden pt-4"
      >
        <div className="max-w-3xl mx-auto px-4 pb-32 pt-6">

          {/* 7. Metadata bar — Body Small, on-surface-variant */}
          <UnifiedMetadataBar
            questionNumber={questionNumber}
            totalQuestions={totalQuestions}
            difficulty={question.difficulty}
            channel={question.channel}
            mode={mode}
          />

          {/* 1. M3 Elevated Card — Level 1 (tonal overlay + shadow) */}
          <motion.div
            key={question.id}
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0, 0, 0, 1] }}
            style={{
              marginTop: 16,
              borderRadius: 12, // M3 medium shape
              padding: '24px',
              // Level 1: 5% primary tonal overlay + shadow-1
              background: 'var(--md-sys-color-surface, #2d2d2d)',
              boxShadow: '0px 1px 2px rgba(0,0,0,0.3), 0px 2px 6px rgba(0,0,0,0.15)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Tonal overlay — 5% primary (Level 1) */}
            <div
              aria-hidden
              style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: 'var(--md-sys-color-primary, #8ab4f8)',
                opacity: 0.05,
                borderRadius: 'inherit',
              }}
            />

            {/* Meta row: difficulty chip + subchannel */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {/* 5. Difficulty filter chip */}
              {question.difficulty && <DifficultyChip difficulty={question.difficulty} />}
              {question.subChannel && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', padding: '4px 12px',
                  borderRadius: 8, fontSize: 12, fontWeight: 500,
                  background: 'rgba(138,180,248,0.08)',
                  color: 'var(--md-sys-color-primary, #8ab4f8)',
                  border: '1px solid rgba(138,180,248,0.2)',
                }}>
                  {question.subChannel.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </span>
              )}
              {question.companies?.[0] && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', padding: '4px 12px',
                  borderRadius: 8, fontSize: 12, fontWeight: 500,
                  background: 'rgba(138,180,248,0.08)',
                  color: 'var(--md-sys-color-on-surface-variant, #9aa0a6)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  {question.companies[0]}
                </span>
              )}
            </div>

            {/* 1. Title Large for question text (22sp / 1.375rem, weight 400) */}
            <h1 style={{
              fontSize: 'clamp(1.125rem, 3.5vw, 1.375rem)',
              fontWeight: 400,
              lineHeight: 1.45,
              letterSpacing: 0,
              marginBottom: 16,
              color: 'var(--md-sys-color-on-surface, #e8eaed)',
              fontFamily: "'Google Sans', 'Roboto', sans-serif",
            }}>
              {question.question}
            </h1>

            {/* Tags */}
            {question.tags && question.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                {question.tags.slice(0, 6).map((tag: string) => (
                  <span key={tag} style={{ fontSize: 12, color: 'var(--md-sys-color-on-surface-variant, #9aa0a6)', fontWeight: 500 }}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Answer section with container transform */}
            <div style={{ borderTop: '1px solid var(--md-sys-color-outline-variant, rgba(255,255,255,0.08))', paddingTop: 20, marginTop: 4 }}>
              {/* 2. Container transform reveal */}
              <ContainerTransformReveal
                isRevealed={internalShowAnswer}
                onReveal={handleAnswerToggle}
                onHide={handleAnswerToggle}
              >
                <UnifiedAnswerPanel question={question} mode={mode} onHideAnswer={handleAnswerToggle} />
              </ContainerTransformReveal>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* 9. M3 Bottom App Bar + FAB */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: 'var(--md-sys-color-surface, #2d2d2d)',
          borderTop: '1px solid var(--md-sys-color-outline-variant, rgba(255,255,255,0.08))',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div
          style={{
            maxWidth: 768,
            margin: '0 auto',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            height: 80,
          }}
        >
          {/* 3. Prev — filled tonal icon button */}
          <TonalIconButton onClick={() => navigate('prev')} disabled={!canPrev} label="Previous question">
            <ChevronLeft className="w-5 h-5" />
          </TonalIconButton>

          {/* Center: bookmark + share */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {/* 6. Bookmark toggle */}
            {onBookmark && (
              <BookmarkToggle isBookmarked={isBookmarked} onToggle={onBookmark} />
            )}
            <motion.button
              aria-label="Share question"
              whileTap={{ scale: 0.92 }}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 48, height: 48, borderRadius: 12, border: 'none', cursor: 'pointer',
                background: 'transparent',
                color: 'var(--md-sys-color-on-surface-variant, #9aa0a6)',
                transition: 'background 150ms',
              }}
            >
              <Share2 className="w-5 h-5" />
            </motion.button>
          </div>

          {/* FAB — Voice Practice (M3 large FAB, 56dp) */}
          {onVoicePractice && (
            <motion.button
              onClick={onVoicePractice}
              aria-label="Voice practice this question"
              whileTap={{ scale: 0.94 }}
              whileHover={{ scale: 1.04 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                height: 56, padding: '0 20px',
                borderRadius: 16, // M3 extraLarge shape for FAB
                border: 'none', cursor: 'pointer',
                background: 'var(--md-sys-color-primary-container, rgba(138,180,248,0.25))',
                color: 'var(--md-sys-color-on-primary-container, #8ab4f8)',
                fontWeight: 500, fontSize: 14,
                boxShadow: '0px 1px 3px rgba(0,0,0,0.3), 0px 4px 8px rgba(0,0,0,0.15)',
                transition: 'box-shadow 200ms cubic-bezier(0.2,0,0,1)',
                flexShrink: 0,
              }}
            >
              <Mic className="w-5 h-5" />
              <span className="hidden sm:inline">Voice Practice</span>
            </motion.button>
          )}

          {/* 3. Next — filled tonal icon button */}
          <TonalIconButton onClick={() => navigate('next')} disabled={!canNext} label="Next question" loading={isTransitioning}>
            <ChevronRight className="w-5 h-5" />
          </TonalIconButton>
        </div>
      </div>
    </div>
  );
}
