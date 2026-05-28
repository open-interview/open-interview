import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { Flame } from 'lucide-react';

interface StreakRingProps {
  streak: number;
  xp: number;
  level: number;
  xpProgress: number;
}

export const StreakRing = React.memo(function StreakRing({ streak, xp, level, xpProgress }: StreakRingProps) {
  const prefersReducedMotion = useReducedMotion();
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(streak / 100, 1);
  const strokeDashoffset = circumference * (1 - progress);
  const ringStroke = streak > 0 ? 'url(#streak-gradient)' : 'var(--text-tertiary)';

  return (
    <motion.div
      initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.8 }}
      animate={prefersReducedMotion ? {} : { opacity: 1, scale: 1 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col items-center py-6"
    >
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="streak-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r={radius} fill="none" className="stroke-[var(--border-subtle)]" strokeWidth="8" />
          <motion.circle
            cx="50" cy="50" r={radius}
            fill="none" stroke={ringStroke}
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference}
            initial={prefersReducedMotion ? {} : { strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 1.2, ease: 'easeOut', delay: 0.2 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Flame className={`w-6 h-6 ${streak > 0 ? 'text-amber-400' : 'text-muted-foreground'} mb-0.5`} aria-hidden={true} />
          <span className="text-3xl font-bold text-white">{streak}</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground mt-2 font-medium">Day streak</span>

      <div className="flex items-center gap-5 mt-5">
        <div className="text-center">
          <span className="text-sm font-bold text-white">{xp.toLocaleString()}</span>
          <p className="text-[10px] text-muted-foreground mt-0.5">Total XP</p>
        </div>
        <div className="w-px h-8 bg-border/30" />
        <div className="text-center">
          <span className="text-sm font-bold text-white">Level {level}</span>
          <p className="text-[10px] text-muted-foreground mt-0.5">Rank</p>
        </div>
      </div>

      <div className="w-44 h-1.5 rounded-full bg-[var(--border-subtle)] overflow-hidden mt-3">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500"
          initial={prefersReducedMotion ? {} : { width: 0 }}
          animate={{ width: `${xpProgress}%` }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8, ease: 'easeOut', delay: 0.4 }}
        />
      </div>
    </motion.div>
  );
});
