/**
 * useAchievements Hook
 * React hook for achievement system integration
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Achievement,
  AchievementProgress,
  UserEvent,
  calculateAchievementProgress,
  processUserEvent,
  getUnlockedAchievements,
  getNextAchievements,
  getAchievementsByCategory,
  addAchievementListener,
  getMetrics,
} from '../lib/achievements';

export function useAchievements() {
  const [progress, setProgress] = useState<AchievementProgress[]>([]);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial progress
  useEffect(() => {
    const loadProgress = () => {
      try {
        const allProgress = calculateAchievementProgress();
        setProgress(allProgress);
      } catch (error) {
        console.error('Failed to load achievement progress:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, []);

  // Listen for new achievements
  useEffect(() => {
    const unsubscribe = addAchievementListener((achievements) => {
      setNewlyUnlocked(achievements);
      // Refresh progress
      setProgress(calculateAchievementProgress());
      
      // Clear notification after 5 seconds
      setTimeout(() => setNewlyUnlocked([]), 5000);
    });

    return unsubscribe;
  }, []);

  // Process user event
  const trackEvent = useCallback((event: UserEvent) => {
    const unlocked = processUserEvent(event);
    if (unlocked.length > 0) {
      setNewlyUnlocked(unlocked);
    }
    // Refresh progress
    setProgress(calculateAchievementProgress());
  }, []);

  // Get unlocked achievements
  const unlocked = useMemo(() => {
    return progress.filter(p => p.isUnlocked);
  }, [progress]);

  // Get locked achievements
  const locked = useMemo(() => {
    return progress.filter(p => !p.isUnlocked);
  }, [progress]);

  // Get achievements by category
  const byCategory = useCallback((category: string) => {
    return progress.filter(p => p.achievement.category === category);
  }, [progress]);

  // Get next achievements to unlock
  const nextUp = useMemo(() => {
    return getNextAchievements(5);
  }, [progress]);

  // Statistics
  const stats = useMemo(() => {
    const total = progress.length;
    const unlockedCount = unlocked.length;
    const percentage = Math.round((unlockedCount / total) * 100);

    return {
      total,
      unlocked: unlockedCount,
      locked: locked.length,
      percentage,
    };
  }, [progress, unlocked, locked]);

  return {
    // Data
    progress,
    unlocked,
    locked,
    nextUp,
    stats,
    newlyUnlocked,
    
    // Actions
    trackEvent,
    byCategory,
    
    // State
    isLoading,
  };
}

// Hook for specific achievement
export function useAchievement(achievementId: string) {
  const { progress } = useAchievements();
  
  return useMemo(() => {
    return progress.find(p => p.achievement.id === achievementId);
  }, [progress, achievementId]);
}

// Hook for achievement categories
export function useAchievementCategories() {
  const { progress } = useAchievements();

  return useMemo(() => {
    const categories = new Map<string, AchievementProgress[]>();
    
    progress.forEach(p => {
      const category = p.achievement.category;
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category)!.push(p);
    });

    return Array.from(categories.entries()).map(([category, items]) => ({
      category,
      items,
      unlocked: items.filter(i => i.isUnlocked).length,
      total: items.length,
      percentage: Math.round((items.filter(i => i.isUnlocked).length / items.length) * 100),
    }));
  }, [progress]);
}

// Hook for daily/weekly challenges
export function useChallenges() {
  const { progress } = useAchievements();

  const daily = useMemo(() => {
    return progress.filter(p => p.achievement.category === 'daily');
  }, [progress]);

  const weekly = useMemo(() => {
    return progress.filter(p => p.achievement.category === 'weekly');
  }, [progress]);

  const activeChallenges = useMemo(() => {
    return [...daily, ...weekly].filter(p => !p.isUnlocked && p.progress > 0);
  }, [daily, weekly]);

  return {
    daily,
    weekly,
    active: activeChallenges,
  };
}
