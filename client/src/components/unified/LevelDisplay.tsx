/**
 * Level Display Component
 * Shows user level, XP, and progress to next level
 * Part of the unified design system
 */

import { motion } from 'framer-motion';
import { Trophy, Zap, TrendingUp, Flame } from 'lucide-react';
import { UserLevel } from '../../lib/achievements';
import { ProgressBar } from './ProgressBar';

interface LevelDisplayProps {
  currentLevel: UserLevel;
  nextLevel: UserLevel | null;
  currentXP: number;
  xpForNext: number;
  progress: number;
  currentStreak?: number;
  streakMultiplier?: number;
  variant?: 'compact' | 'full' | 'card';
}

export function LevelDisplay({
  currentLevel,
  nextLevel,
  currentXP,
  xpForNext,
  progress,
  currentStreak = 0,
  streakMultiplier = 1.0,
  variant = 'full'
}: LevelDisplayProps) {
  
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3">
        {/* Level badge */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md">
            <span className="text-lg font-bold text-primary-foreground">
              {currentLevel.level}
            </span>
          </div>
          {currentStreak > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
              <Flame className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
        
        {/* Level info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-bold">{currentLevel.title}</span>
            <span className="text-xs text-muted-foreground">
              {currentXP.toLocaleString()} XP
            </span>
          </div>
          <ProgressBar
            current={currentXP - currentLevel.xpRequired}
            max={nextLevel ? nextLevel.xpRequired - currentLevel.xpRequired : 1}
            size="xs"
            variant="default"
            animated
          />
          {nextLevel && (
            <div className="text-[9px] text-muted-foreground mt-0.5">
              {xpForNext.toLocaleString()} XP to Level {nextLevel.level}
            </div>
          )}
        </div>
      </div>
    );
  }
  
  if (variant === 'card') {
    return (
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Level {currentLevel.level}
              </span>
            </div>
            <h3 className="text-xl font-bold">{currentLevel.title}</h3>
          </div>
          
          {/* Level badge */}
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
            <span className="text-2xl font-bold text-primary-foreground">
              {currentLevel.level}
            </span>
          </div>
        </div>
        
        {/* XP Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Experience</span>
            <span className="font-bold">{currentXP.toLocaleString()} XP</span>
          </div>
          
          <ProgressBar
            current={currentXP - currentLevel.xpRequired}
            max={nextLevel ? nextLevel.xpRequired - currentLevel.xpRequired : 1}
            size="md"
            variant="default"
            animated
            showPercentage
          />
          
          {nextLevel && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{xpForNext.toLocaleString()} XP to next level</span>
              <span>Level {nextLevel.level}: {nextLevel.title}</span>
            </div>
          )}
        </div>
        
        {/* Streak bonus */}
        {currentStreak > 0 && (
          <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium">{currentStreak} Day Streak</span>
            </div>
            {streakMultiplier > 1 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/10 rounded-full">
                <Zap className="w-3 h-3 text-orange-500" />
                <span className="text-xs font-bold text-orange-500">
                  {streakMultiplier}x XP
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
  
  // Full variant
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Level badge */}
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-primary-foreground">
                {currentLevel.level}
              </span>
            </div>
            {currentStreak > 0 && (
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center shadow-md">
                <Flame className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          
          {/* Level info */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Level {currentLevel.level}
              </span>
            </div>
            <h2 className="text-2xl font-bold">{currentLevel.title}</h2>
          </div>
        </div>
        
        {/* XP display */}
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">
            {currentXP.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground">Total XP</div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress to next level</span>
          <span className="font-bold">{progress}%</span>
        </div>
        
        <ProgressBar
          current={currentXP - currentLevel.xpRequired}
          max={nextLevel ? nextLevel.xpRequired - currentLevel.xpRequired : 1}
          size="lg"
          variant="default"
          animated
        />
        
        {nextLevel && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{xpForNext.toLocaleString()} XP needed</span>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Next: Level {nextLevel.level} - {nextLevel.title}
            </span>
          </div>
        )}
      </div>
      
      {/* Streak bonus */}
      {currentStreak > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-3 bg-orange-500/10 rounded-lg border border-orange-500/20"
        >
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <div>
              <div className="text-sm font-bold">{currentStreak} Day Streak</div>
              <div className="text-xs text-muted-foreground">Keep it going!</div>
            </div>
          </div>
          {streakMultiplier > 1 && (
            <div className="flex items-center gap-1 px-3 py-1.5 bg-orange-500/20 rounded-full">
              <Zap className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-bold text-orange-500">
                {streakMultiplier}x XP Bonus
              </span>
            </div>
          )}
        </motion.div>
      )}
      
      {/* Perks */}
      {currentLevel.perks.length > 0 && (
        <div className="pt-3 border-t border-border">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Unlocked Features
          </div>
          <div className="flex flex-wrap gap-2">
            {currentLevel.perks.map((perk) => (
              <div
                key={perk}
                className="px-2 py-1 bg-muted/50 rounded text-xs font-medium"
              >
                {perk.replace(/_/g, ' ')}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Compact level badge for navigation/header
export function LevelBadge({ level, size = 'md' }: { level: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  };
  
  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md`}>
      <span className="font-bold text-primary-foreground">{level}</span>
    </div>
  );
}
