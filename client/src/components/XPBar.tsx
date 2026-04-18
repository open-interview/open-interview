/**
 * XPBar — animated XP progress bar with level display
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { Zap } from 'lucide-react';
import { getLevelByXP, getNextLevel, getLevelProgress } from '../lib/achievements/levels';

interface XPBarProps {
  currentXP: number;
  className?: string;
  compact?: boolean;
}

export function XPBar({ currentXP, className = '', compact = false }: XPBarProps) {
  const level = getLevelByXP(currentXP);
  const nextLevel = getNextLevel(level.level);
  const progressPct = getLevelProgress(currentXP, level.level);

  const prevXPRef = useRef(currentXP);
  const [leveledUp, setLeveledUp] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const motionPct = useMotionValue(0);
  const springPct = useSpring(motionPct, { stiffness: 60, damping: 18 });

  useEffect(() => {
    const prevLevel = getLevelByXP(prevXPRef.current);
    if (level.level > prevLevel.level) {
      setLeveledUp(true);
      setTimeout(() => setLeveledUp(false), 2000);
    }
    prevXPRef.current = currentXP;
    motionPct.set(progressPct);
  }, [currentXP, progressPct, level.level, motionPct]);

  const xpToNext = nextLevel ? nextLevel.xpRequired - currentXP : 0;

  if (compact) {
    // Inline format: ⚡ 1,240 XP  ████████░░░░  Level 12
    return (
      <div
        className={`relative flex items-center gap-2 ${className}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        role="status"
        aria-live="polite"
      >
        <Zap className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
        <span className="text-xs font-bold text-amber-400 tabular-nums">{currentXP.toLocaleString()} XP</span>
        <div className="flex-1 h-1.5 bg-[var(--surface-3)] rounded-full overflow-hidden min-w-[60px]">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #f59e0b, #f97316)', boxShadow: '0 0 6px #f59e0b80' }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
        <motion.span
          className="text-xs font-bold text-violet-400 tabular-nums"
          animate={leveledUp ? { scale: [1, 1.4, 1], color: ['#a78bfa', '#ffd700', '#a78bfa'] } : {}}
          transition={{ duration: 0.6 }}
        >
          Level {level.level}
        </motion.span>

        {/* Tooltip */}
        <AnimatePresence>
          {showTooltip && nextLevel && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap z-50 pointer-events-none"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--color-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
            >
              <span className="text-amber-400 font-semibold">{xpToNext.toLocaleString()} XP</span>
              <span className="text-[var(--text-tertiary)]"> to Level {nextLevel.level}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`} role="status" aria-live="polite">
      {/* Level row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-foreground"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', boxShadow: leveledUp ? '0 0 20px #f59e0b' : '0 0 8px #f59e0b60' }}
            animate={leveledUp ? { scale: [1, 1.3, 1], boxShadow: ['0 0 8px #f59e0b60', '0 0 24px #ffd700', '0 0 8px #f59e0b60'] } : {}}
            transition={{ duration: 0.8 }}
          >
            {level.level}
          </motion.div>
          <div>
            <div className="text-sm font-bold leading-none">{level.title}</div>
            <div className="text-xs text-[var(--text-tertiary)]">{currentXP.toLocaleString()} XP</div>
          </div>
        </div>
        {nextLevel && (
          <div
            className="relative text-right cursor-default"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <div className="text-xs text-[var(--text-tertiary)]">Next: {nextLevel.title}</div>
            <div className="text-xs font-semibold text-amber-400">
              {xpToNext.toLocaleString()} XP to go
            </div>
            <AnimatePresence>
              {showTooltip && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="absolute right-0 bottom-full mb-2 px-3 py-2 rounded-lg text-xs whitespace-nowrap z-50"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--color-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
                >
                  <div className="text-[var(--text-secondary)]">Level {nextLevel.level}: <span className="text-amber-400 font-bold">{nextLevel.xpRequired.toLocaleString()} XP</span></div>
                  <div className="text-[var(--text-tertiary)]">{progressPct}% complete</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Bar */}
      <div className="relative h-3 bg-[var(--surface-3)] rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: 'linear-gradient(90deg, #f59e0b, #f97316)' }}
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        />
        {/* Glow overlay */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full opacity-60"
          style={{ background: 'linear-gradient(90deg, #f59e0b, #f97316)', filter: 'blur(4px)' }}
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        />
        {/* Shimmer */}
        <motion.div
          className="absolute inset-y-0 w-12 bg-white/20 skew-x-12"
          initial={{ left: '-3rem' }}
          animate={{ left: '110%' }}
          transition={{ duration: 1.5, delay: 1.3, ease: 'easeInOut' }}
        />
      </div>

      {/* Level-up celebration */}
      <AnimatePresence>
        {leveledUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center justify-center gap-2 py-1.5 rounded-lg text-sm font-bold text-amber-400"
            style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(124,58,237,0.10))', border: '1px solid rgba(245,158,11,0.3)' }}
            role="status"
            aria-live="polite"
          >
            Level Up! You reached Level {level.level}!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress label */}
      <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
        <span className="flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" />
          {progressPct}% to level {nextLevel?.level ?? level.level}
        </span>
        {nextLevel && <span>{nextLevel.xpRequired.toLocaleString()} XP</span>}
      </div>
    </div>
  );
}
