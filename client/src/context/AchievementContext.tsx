/**
 * @deprecated Use RewardContext instead.
 * Achievement Context — kept for backward compatibility.
 * Routes all events through the unified reward engine.
 * Credits/XP/awards handled once by rewardEngine internally.
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  Achievement,
  AchievementProgress,
  UserEvent,
  calculateAchievementProgress,
  getMetrics,
  UserMetrics,
} from '../lib/achievements';
import { rewardEngine } from '../lib/rewards';
import { useRewardContext } from './RewardContext';

interface AchievementContextType {
  progress: AchievementProgress[];
  metrics: UserMetrics;
  trackEvent: (event: UserEvent) => void;
  refreshProgress: () => void;
  pendingAchievements: Achievement[];
  consumePendingAchievement: () => Achievement | undefined;
  level: number;
  totalXP: number;
  credits: number;
  streak: number;
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

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

export function AchievementProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<AchievementProgress[]>([]);
  const [metrics, setMetrics] = useState<UserMetrics>(() => getMetrics());
  const [pendingAchievements, setPendingAchievements] = useState<Achievement[]>([]);

  const rewardCtx = useRewardContext();

  useEffect(() => {
    refreshProgress();
  }, []);

  const refreshProgress = useCallback(() => {
    setProgress(calculateAchievementProgress());
    setMetrics(getMetrics());
  }, []);

  const trackEvent = useCallback((event: UserEvent) => {
    const mappedType = activityTypeMap[event.type];
    if (mappedType) {
      rewardEngine.processActivity({
        type: mappedType as any,
        timestamp: event.timestamp,
        data: event.data,
      });
    }
    refreshProgress();
  }, [refreshProgress]);

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
        trackEvent,
        refreshProgress,
        pendingAchievements,
        consumePendingAchievement,
        level: rewardCtx.level,
        totalXP: rewardCtx.totalXP,
        credits: rewardCtx.credits,
        streak: rewardCtx.streak,
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
