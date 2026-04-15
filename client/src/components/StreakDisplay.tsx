/**
 * StreakDisplay — fire streak + 7-day calendar row
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Snowflake } from 'lucide-react';

interface StreakDisplayProps {
  streak: number;
  /** ISO date strings of days studied (last 7 days checked) */
  studiedDates?: string[];
  hasFreezeActive?: boolean;
  className?: string;
  compact?: boolean;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MILESTONES = [3, 7, 14, 30, 60, 100, 365];

function getLast7Days(): Date[] {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d;
  });
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function getMilestoneLabel(streak: number): string | null {
  if (streak === 3) return '🎉 3-day streak!';
  if (streak === 7) return '🔥 One week!';
  if (streak === 14) return '💪 Two weeks!';
  if (streak === 30) return '🏆 30 days!';
  if (streak === 60) return '⚡ 60 days!';
  if (streak === 100) return '👑 100 days!';
  if (streak === 365) return '🌟 One year!';
  return null;
}

export function StreakDisplay({
  streak,
  studiedDates = [],
  hasFreezeActive = false,
  className = '',
  compact = false,
}: StreakDisplayProps) {
  const days = getLast7Days();
  const today = new Date();
  const studied = studiedDates.map(d => new Date(d));
  const isBroken = streak === 0;
  const milestone = getMilestoneLabel(streak);
  const [showMilestone, setShowMilestone] = useState(false);

  useEffect(() => {
    if (milestone) {
      setShowMilestone(true);
      const t = setTimeout(() => setShowMilestone(false), 3000);
      return () => clearTimeout(t);
    }
  }, [streak]);

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <span className="text-lg leading-none">{isBroken ? '😔' : '🔥'}</span>
        <span className={`font-black tabular-nums ${isBroken ? 'text-[var(--text-tertiary)]' : 'text-[var(--color-streak)]'}`}>{streak}</span>
        <span className="text-xs text-[var(--text-tertiary)]">day streak</span>
        {hasFreezeActive && <Snowflake className="w-3.5 h-3.5 text-cyan-400" />}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.span
            className="text-2xl leading-none"
            animate={isBroken ? {} : { scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
          >
            {isBroken ? '😔' : '🔥'}
          </motion.span>
          <div>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-black tabular-nums ${isBroken ? 'text-[var(--text-tertiary)]' : 'text-[var(--color-streak)]'}`}>
                {streak}
              </span>
              <span className="text-sm text-[var(--text-secondary)]">day streak</span>
            </div>
            {isBroken && (
              <p className="text-xs text-[var(--text-tertiary)]">Study today to start a new streak!</p>
            )}
          </div>
        </div>
        {hasFreezeActive && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30">
            <Snowflake className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs text-cyan-400 font-semibold">Freeze active</span>
          </div>
        )}
      </div>

      {/* Milestone celebration */}
      <AnimatePresence>
        {showMilestone && milestone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85 }}
            className="text-center py-2 px-3 rounded-lg text-sm font-bold text-orange-400"
            style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)' }}
            role="status"
            aria-live="polite"
          >
            {milestone}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7-day calendar */}
      <div className="flex gap-1.5 justify-between">
        {days.map((day, i) => {
          const done = studied.some(s => isSameDay(s, day));
          const isToday = isSameDay(day, today);
          const dayLabel = DAY_LABELS[day.getDay() === 0 ? 6 : day.getDay() - 1];

          return (
            <motion.div
              key={i}
              className="flex flex-col items-center gap-1 flex-1"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <span className="text-[10px] text-[var(--text-tertiary)] font-medium">{dayLabel}</span>
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all text-[11px] ${
                  done
                    ? 'bg-[var(--color-streak)] shadow-[0_0_8px_var(--color-streak)]'
                    : isToday
                    ? 'border-2 border-[var(--color-streak)] border-dashed'
                    : 'bg-[var(--surface-3)] border border-[var(--color-border-subtle)]'
                } ${isToday ? 'ring-2 ring-[var(--color-streak)]/30' : ''}`}
              >
                {done ? '✅' : isToday ? '🎯' : ''}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Next milestone hint */}
      {!isBroken && (() => {
        const next = MILESTONES.find(m => m > streak);
        return next ? (
          <p className="text-[11px] text-[var(--text-tertiary)] text-center">
            {next - streak} more day{next - streak !== 1 ? 's' : ''} to {next}-day milestone 🎯
          </p>
        ) : null;
      })()}
    </div>
  );
}
