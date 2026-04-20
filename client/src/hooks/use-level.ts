/**
 * useLevel Hook
 * React hook for user level and XP tracking
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  UserLevel,
  LevelProgress,
  getMetrics,
  getLevelByXP,
  getNextLevel,
  getXPForNextLevel,
  getLevelProgress,
  getStreakMultiplier,
  awardXP,
} from '../lib/achievements';

export function useLevel() {
  const [metrics, setMetrics] = useState(() => getMetrics());
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [previousLevel, setPreviousLevel] = useState<number | null>(null);

  // Refresh metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const newMetrics = getMetrics();
      
      // Check for level up
      if (newMetrics.level > metrics.level) {
        setPreviousLevel(metrics.level);
        setShowLevelUp(true);
        setTimeout(() => setShowLevelUp(false), 5000);
      }
      
      setMetrics(newMetrics);
    }, 1000);

    return () => clearInterval(interval);
  }, [metrics.level]);

  // Current level data
  const currentLevel = useMemo(() => {
    return getLevelByXP(metrics.totalXP);
  }, [metrics.totalXP]);

  // Next level data
  const nextLevel = useMemo(() => {
    return getNextLevel(currentLevel.level);
  }, [currentLevel.level]);

  // Progress to next level
  const levelProgress = useMemo((): LevelProgress => {
    const xpForNext = nextLevel ? getXPForNextLevel(metrics.totalXP, currentLevel.level) : 0;
    const progress = nextLevel ? getLevelProgress(metrics.totalXP, currentLevel.level) : 100;

    return {
      currentLevel,
      nextLevel,
      currentXP: metrics.totalXP,
      xpForNext,
      progress,
    };
  }, [metrics.totalXP, currentLevel, nextLevel]);

  // Streak multiplier
  const streakMultiplier = useMemo(() => {
    return getStreakMultiplier(metrics.currentStreak);
  }, [metrics.currentStreak]);

  // Award XP (with refresh)
  const addXP = useCallback((amount: number) => {
    awardXP(amount);
    setMetrics(getMetrics());
  }, []);

  // Dismiss level up notification
  const dismissLevelUp = useCallback(() => {
    setShowLevelUp(false);
    setPreviousLevel(null);
  }, []);

  return {
    // Level data
    currentLevel,
    nextLevel,
    levelProgress,
    
    // XP data
    totalXP: metrics.totalXP,
    xpForNext: levelProgress.xpForNext,
    progress: levelProgress.progress,
    
    // Streak data
    currentStreak: metrics.currentStreak,
    longestStreak: metrics.longestStreak,
    streakMultiplier,
    
    // Level up notification
    showLevelUp,
    previousLevel,
    dismissLevelUp,
    
    // Actions
    addXP,
    
    // All metrics
    metrics,
  };
}

// Hook for checking feature unlocks
export function useFeatureUnlock(feature: string): boolean {
  const { currentLevel } = useLevel();
  
  return useMemo(() => {
    return currentLevel.perks.includes(feature) || currentLevel.perks.includes('all_features');
  }, [currentLevel, feature]);
}

// Hook for level requirements
export function useLevelRequirement(requiredLevel: number) {
  const { currentLevel } = useLevel();
  
  const isUnlocked = currentLevel.level >= requiredLevel;
  const levelsNeeded = Math.max(0, requiredLevel - currentLevel.level);
  
  return {
    isUnlocked,
    levelsNeeded,
    currentLevel: currentLevel.level,
    requiredLevel,
  };
}
