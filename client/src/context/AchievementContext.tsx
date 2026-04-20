/**
 * Achievement Context
 * Global state management for achievements with credit system integration
 * Now integrated with the unified reward system
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  Achievement,
  AchievementProgress,
  UserEvent,
  processUserEvent,
  calculateAchievementProgress,
  getMetrics,
  UserMetrics,
} from '../lib/achievements';
import { earnCredits as earnCreditsLib } from '../lib/credits';
import { rewardEngine, rewardStorage } from '../lib/rewards';

interface AchievementContextType {
  progress: AchievementProgress[];
  metrics: UserMetrics;
  newlyUnlocked: Achievement[];
  trackEvent: (event: UserEvent) => void;
  refreshProgress: () => void;
  dismissNotification: (achievementId: string) => void;
  // New: queue achievements for unified notification system
  pendingAchievements: Achievement[];
  consumePendingAchievement: () => Achievement | undefined;
  // Unified reward system access
  level: number;
  totalXP: number;
  credits: number;
  streak: number;
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

export function AchievementProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<AchievementProgress[]>([]);
  const [metrics, setMetrics] = useState<UserMetrics>(() => getMetrics());
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);
  const [pendingAchievements, setPendingAchievements] = useState<Achievement[]>([]);
  
  // Unified reward state
  const [rewardState, setRewardState] = useState(() => rewardStorage.getProgress());

  // Load initial progress
  useEffect(() => {
    refreshProgress();
  }, []);
  
  // Subscribe to reward engine updates
  useEffect(() => {
    const unsubscribe = rewardEngine.addListener(() => {
      setRewardState(rewardStorage.getProgress());
    });
    return unsubscribe;
  }, []);

  // Refresh progress
  const refreshProgress = useCallback(() => {
    const allProgress = calculateAchievementProgress();
    setProgress(allProgress);
    setMetrics(getMetrics());
    setRewardState(rewardStorage.getProgress());
  }, []);

  // Track user event - now also triggers unified reward system
  const trackEvent = useCallback((event: UserEvent) => {
    // Process through legacy achievement system
    const unlocked = processUserEvent(event);
    
    // Also process through unified reward system
    const activityTypeMap: Record<string, string> = {
      'question_completed': 'question_completed',
      'quiz_answered': 'quiz_answered',
      'voice_interview_completed': 'voice_interview_completed',
      'srs_review': 'srs_card_rated',
      'session_started': 'session_started',
      'session_ended': 'session_ended',
      'daily_login': 'daily_login',
      'streak_updated': 'streak_updated',
    };
    
    const mappedType = activityTypeMap[event.type];
    if (mappedType) {
      rewardEngine.processActivity({
        type: mappedType as any,
        timestamp: event.timestamp,
        data: event.data,
      });
    }
    
    if (unlocked.length > 0) {
      // Queue achievements for unified notification system
      setPendingAchievements(prev => [...prev, ...unlocked]);
      
      // Also keep legacy newlyUnlocked for backward compatibility
      setNewlyUnlocked(prev => [...prev, ...unlocked]);
      
      // Award credits for achievements (through unified system)
      unlocked.forEach(achievement => {
        const creditRewards = achievement.rewards.filter(r => r.type === 'credits');
        creditRewards.forEach(reward => {
          // Use both systems for now during transition
          earnCreditsLib(reward.amount, `Achievement: ${achievement.name}`);
          rewardStorage.addCredits(reward.amount);
        });
        
        // Award XP for achievements
        const xpRewards = achievement.rewards.filter(r => r.type === 'xp');
        xpRewards.forEach(reward => {
          rewardStorage.addXP(reward.amount);
        });
      });
      
      // Auto-dismiss legacy notifications after 5 seconds
      setTimeout(() => {
        setNewlyUnlocked(prev => prev.filter(a => !unlocked.includes(a)));
      }, 5000);
    }
    
    // Refresh progress
    refreshProgress();
  }, [refreshProgress]);

  // Dismiss notification (legacy)
  const dismissNotification = useCallback((achievementId: string) => {
    setNewlyUnlocked(prev => prev.filter(a => a.id !== achievementId));
  }, []);

  // Consume pending achievement for unified system
  const consumePendingAchievement = useCallback(() => {
    if (pendingAchievements.length === 0) return undefined;
    const [first, ...rest] = pendingAchievements;
    setPendingAchievements(rest);
    return first;
  }, [pendingAchievements]);

  return (
    <AchievementContext.Provider
      value={{
        progress,
        metrics,
        newlyUnlocked,
        trackEvent,
        refreshProgress,
        dismissNotification,
        pendingAchievements,
        consumePendingAchievement,
        // Unified reward system values
        level: rewardState.level,
        totalXP: rewardState.totalXP,
        credits: rewardState.creditBalance,
        streak: rewardState.currentStreak,
      }}
    >
      {children}
    </AchievementContext.Provider>
  );
}

export function useAchievementContext() {
  const context = useContext(AchievementContext);
  if (context === undefined) {
    throw new Error('useAchievementContext must be used within AchievementProvider');
  }
  return context;
}
