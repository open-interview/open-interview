/**
 * useRewards Hook
 * Unified hook for accessing the reward system in React components
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  rewardEngine,
  rewardStorage,
  ActivityEvent,
  RewardResult,
  UserProgressState,
  RewardNotification,
  trackQuestionCompleted,
  trackQuizAnswer,
  trackVoiceInterview,
  trackSRSReview,
  trackDailyLogin,
  trackSessionStart,
  trackSessionEnd,
  trackCertificationCompleted,
  trackCodingChallenge,
  trackTrainingSession,
  deductQuestionViewCredits,
  getStreakMultiplier,
} from '../lib/rewards';

interface UseRewardsReturn {
  // State
  progress: UserProgressState;
  notifications: RewardNotification[];
  lastReward: RewardResult | null;
  
  // Computed values
  level: number;
  totalXP: number;
  credits: number;
  streak: number;
  streakMultiplier: number;
  
  // Actions
  trackActivity: (event: ActivityEvent) => RewardResult;
  trackQuestion: (difficulty: 'beginner' | 'intermediate' | 'advanced', channel: string, questionId?: string) => RewardResult;
  trackQuiz: (isCorrect: boolean) => RewardResult;
  trackVoice: (verdict: 'strong-hire' | 'hire' | 'no-hire' | 'needs-improvement', score?: number) => RewardResult;
  trackSRS: (rating: 'again' | 'hard' | 'good' | 'easy') => RewardResult;
  trackLogin: () => RewardResult;
  trackSessionStart: () => RewardResult;
  trackSessionEnd: (questionsCompleted: number, duration: number) => RewardResult;
  trackCertification: (certificationId: string, passed: boolean) => RewardResult;
  trackCoding: (challengeId: string, passed: boolean, language?: string) => RewardResult;
  trackTraining: (questionsCompleted: number) => RewardResult;
  
  // Credit actions
  deductViewCredits: () => { success: boolean; cost: number; balance: number };
  canAfford: (amount: number) => boolean;
  
  // Notification actions
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Refresh
  refresh: () => void;
}

export function useRewards(): UseRewardsReturn {
  const [progress, setProgress] = useState<UserProgressState>(() => rewardStorage.getProgress());
  const [notifications, setNotifications] = useState<RewardNotification[]>(() => rewardStorage.getNotifications());
  const [lastReward, setLastReward] = useState<RewardResult | null>(null);
  
  // Subscribe to reward engine updates
  useEffect(() => {
    const unsubscribe = rewardEngine.addListener((result) => {
      setLastReward(result);
      setProgress(rewardStorage.getProgress());
      setNotifications(rewardStorage.getNotifications());
    });
    
    return unsubscribe;
  }, []);
  
  // Refresh state
  const refresh = useCallback(() => {
    setProgress(rewardStorage.getProgress());
    setNotifications(rewardStorage.getNotifications());
  }, []);
  
  // Track generic activity
  const trackActivity = useCallback((event: ActivityEvent): RewardResult => {
    const result = rewardEngine.processActivity(event);
    setLastReward(result);
    setProgress(rewardStorage.getProgress());
    setNotifications(rewardStorage.getNotifications());
    return result;
  }, []);
  
  // Convenience tracking methods
  const trackQuestion = useCallback((
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    channel: string,
    questionId?: string
  ): RewardResult => {
    const result = trackQuestionCompleted(difficulty, channel, questionId);
    setLastReward(result);
    refresh();
    return result;
  }, [refresh]);
  
  const trackQuiz = useCallback((isCorrect: boolean): RewardResult => {
    const result = trackQuizAnswer(isCorrect);
    setLastReward(result);
    refresh();
    return result;
  }, [refresh]);
  
  const trackVoice = useCallback((
    verdict: 'strong-hire' | 'hire' | 'no-hire' | 'needs-improvement',
    score?: number
  ): RewardResult => {
    const result = trackVoiceInterview(verdict, score);
    setLastReward(result);
    refresh();
    return result;
  }, [refresh]);
  
  const trackSRS = useCallback((rating: 'again' | 'hard' | 'good' | 'easy'): RewardResult => {
    const result = trackSRSReview(rating);
    setLastReward(result);
    refresh();
    return result;
  }, [refresh]);
  
  const trackLogin = useCallback((): RewardResult => {
    const result = trackDailyLogin();
    setLastReward(result);
    refresh();
    return result;
  }, [refresh]);
  
  const handleTrackSessionStart = useCallback((): RewardResult => {
    const result = trackSessionStart();
    setLastReward(result);
    refresh();
    return result;
  }, [refresh]);
  
  const handleTrackSessionEnd = useCallback((questionsCompleted: number, duration: number): RewardResult => {
    const result = trackSessionEnd(questionsCompleted, duration);
    setLastReward(result);
    refresh();
    return result;
  }, [refresh]);
  
  const trackCertification = useCallback((certificationId: string, passed: boolean): RewardResult => {
    const result = trackCertificationCompleted(certificationId, passed);
    setLastReward(result);
    refresh();
    return result;
  }, [refresh]);
  
  const trackCoding = useCallback((challengeId: string, passed: boolean, language?: string): RewardResult => {
    const result = trackCodingChallenge(challengeId, passed, language);
    setLastReward(result);
    refresh();
    return result;
  }, [refresh]);
  
  const trackTraining = useCallback((questionsCompleted: number): RewardResult => {
    const result = trackTrainingSession(questionsCompleted);
    setLastReward(result);
    refresh();
    return result;
  }, [refresh]);
  
  // Credit actions
  const deductViewCredits = useCallback(() => {
    const result = deductQuestionViewCredits();
    refresh();
    return result;
  }, [refresh]);
  
  const canAfford = useCallback((amount: number): boolean => {
    return rewardStorage.canAfford(amount);
  }, []);
  
  // Notification actions
  const dismissNotification = useCallback((id: string) => {
    rewardStorage.dismissNotification(id);
    setNotifications(rewardStorage.getNotifications());
  }, []);
  
  const clearNotifications = useCallback(() => {
    rewardStorage.clearNotifications();
    setNotifications([]);
  }, []);
  
  // Computed values
  const streakMultiplier = useMemo(() => getStreakMultiplier(progress.currentStreak), [progress.currentStreak]);
  
  return {
    // State
    progress,
    notifications,
    lastReward,
    
    // Computed values
    level: progress.level,
    totalXP: progress.totalXP,
    credits: progress.creditBalance,
    streak: progress.currentStreak,
    streakMultiplier,
    
    // Actions
    trackActivity,
    trackQuestion,
    trackQuiz,
    trackVoice,
    trackSRS,
    trackLogin,
    trackSessionStart: handleTrackSessionStart,
    trackSessionEnd: handleTrackSessionEnd,
    trackCertification,
    trackCoding,
    trackTraining,
    
    // Credit actions
    deductViewCredits,
    canAfford,
    
    // Notification actions
    dismissNotification,
    clearNotifications,
    
    // Refresh
    refresh,
  };
}

export default useRewards;
