/**
 * Unified Reward Context
 * Global state management for the unified reward system
 * Replaces separate achievement and credit contexts
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import {
  rewardEngine,
  rewardStorage,
  ActivityEvent,
  RewardResult,
  UserProgressState,
  RewardNotification,
  UnlockedAchievement,
  getStreakMultiplier,
} from '../lib/rewards';

// ============================================
// CONTEXT TYPE
// ============================================

interface RewardContextType {
  // State
  progress: UserProgressState;
  notifications: RewardNotification[];
  pendingRewards: RewardResult[];
  
  // Computed values
  level: number;
  totalXP: number;
  credits: number;
  streak: number;
  streakMultiplier: number;
  
  // Activity tracking
  trackActivity: (event: ActivityEvent) => RewardResult;
  
  // Quick tracking methods
  onQuestionCompleted: (difficulty: 'beginner' | 'intermediate' | 'advanced', channel: string, questionId?: string) => RewardResult;
  onQuizAnswered: (isCorrect: boolean) => RewardResult;
  onVoiceInterview: (verdict: 'strong-hire' | 'hire' | 'no-hire' | 'needs-improvement', score?: number) => RewardResult;
  onSRSReview: (rating: 'again' | 'hard' | 'good' | 'easy') => RewardResult;
  onDailyLogin: () => RewardResult;
  onSessionStart: () => RewardResult;
  onSessionEnd: (questionsCompleted: number, duration: number) => RewardResult;
  onCertificationCompleted: (certificationId: string, passed: boolean) => RewardResult;
  onCodingChallenge: (challengeId: string, passed: boolean, language?: string) => RewardResult;
  onTrainingCompleted: (questionsCompleted: number) => RewardResult;
  
  // Credit operations
  deductCredits: (amount: number, reason: string) => { success: boolean; balance: number };
  canAfford: (amount: number) => boolean;
  
  // Notification management
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
  consumePendingReward: () => RewardResult | undefined;
  
  // Refresh
  refresh: () => void;
}

// ============================================
// CONTEXT
// ============================================

const RewardContext = createContext<RewardContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

export function RewardProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<UserProgressState>(() => rewardStorage.getProgress());
  const [notifications, setNotifications] = useState<RewardNotification[]>(() => rewardStorage.getNotifications());
  const [pendingRewards, setPendingRewards] = useState<RewardResult[]>([]);
  
  // Subscribe to reward engine updates
  useEffect(() => {
    const unsubscribe = rewardEngine.addListener((result) => {
      // Queue reward for UI display
      if (result.summary.hasRewards) {
        setPendingRewards(prev => [...prev, result]);
      }
      
      // Update state
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
    return rewardEngine.processActivity(event);
  }, []);
  
  // Quick tracking methods
  const onQuestionCompleted = useCallback((
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    channel: string,
    questionId?: string
  ): RewardResult => {
    return rewardEngine.processActivity({
      type: 'question_completed',
      timestamp: new Date().toISOString(),
      data: { difficulty, channel, questionId },
    });
  }, []);
  
  const onQuizAnswered = useCallback((isCorrect: boolean): RewardResult => {
    return rewardEngine.processActivity({
      type: 'quiz_answered',
      timestamp: new Date().toISOString(),
      data: { isCorrect },
    });
  }, []);
  
  const onVoiceInterview = useCallback((
    verdict: 'strong-hire' | 'hire' | 'no-hire' | 'needs-improvement',
    score?: number
  ): RewardResult => {
    return rewardEngine.processActivity({
      type: 'voice_interview_completed',
      timestamp: new Date().toISOString(),
      data: { verdict, interviewScore: score },
    });
  }, []);
  
  const onSRSReview = useCallback((rating: 'again' | 'hard' | 'good' | 'easy'): RewardResult => {
    return rewardEngine.processActivity({
      type: 'srs_card_rated',
      timestamp: new Date().toISOString(),
      data: { rating },
    });
  }, []);
  
  const onDailyLogin = useCallback((): RewardResult => {
    return rewardEngine.processActivity({
      type: 'daily_login',
      timestamp: new Date().toISOString(),
    });
  }, []);
  
  const onSessionStart = useCallback((): RewardResult => {
    return rewardEngine.processActivity({
      type: 'session_started',
      timestamp: new Date().toISOString(),
    });
  }, []);
  
  const onSessionEnd = useCallback((questionsCompleted: number, duration: number): RewardResult => {
    return rewardEngine.processActivity({
      type: 'session_ended',
      timestamp: new Date().toISOString(),
      data: { questionsCompleted, duration },
    });
  }, []);
  
  const onCertificationCompleted = useCallback((certificationId: string, passed: boolean): RewardResult => {
    return rewardEngine.processActivity({
      type: passed ? 'certification_passed' : 'certification_completed',
      timestamp: new Date().toISOString(),
      data: { certificationId, passed },
    });
  }, []);
  
  const onCodingChallenge = useCallback((challengeId: string, passed: boolean, language?: string): RewardResult => {
    return rewardEngine.processActivity({
      type: passed ? 'coding_challenge_passed' : 'coding_challenge_completed',
      timestamp: new Date().toISOString(),
      data: { challengeId, passed, language },
    });
  }, []);
  
  const onTrainingCompleted = useCallback((questionsCompleted: number): RewardResult => {
    return rewardEngine.processActivity({
      type: 'training_session_completed',
      timestamp: new Date().toISOString(),
      data: { questionsCompleted },
    });
  }, []);
  
  // Credit operations
  const deductCredits = useCallback((amount: number, reason: string): { success: boolean; balance: number } => {
    const result = rewardStorage.spendCredits(amount);
    refresh();
    return result;
  }, [refresh]);
  
  const canAfford = useCallback((amount: number): boolean => {
    return rewardStorage.canAfford(amount);
  }, []);
  
  // Notification management
  const dismissNotification = useCallback((id: string) => {
    rewardStorage.dismissNotification(id);
    setNotifications(rewardStorage.getNotifications());
  }, []);
  
  const clearNotifications = useCallback(() => {
    rewardStorage.clearNotifications();
    setNotifications([]);
  }, []);
  
  const consumePendingReward = useCallback((): RewardResult | undefined => {
    if (pendingRewards.length === 0) return undefined;
    const [first, ...rest] = pendingRewards;
    setPendingRewards(rest);
    return first;
  }, [pendingRewards]);
  
  // Computed values
  const streakMultiplier = useMemo(() => getStreakMultiplier(progress.currentStreak), [progress.currentStreak]);
  
  const value: RewardContextType = {
    // State
    progress,
    notifications,
    pendingRewards,
    
    // Computed values
    level: progress.level,
    totalXP: progress.totalXP,
    credits: progress.creditBalance,
    streak: progress.currentStreak,
    streakMultiplier,
    
    // Activity tracking
    trackActivity,
    
    // Quick tracking methods
    onQuestionCompleted,
    onQuizAnswered,
    onVoiceInterview,
    onSRSReview,
    onDailyLogin,
    onSessionStart,
    onSessionEnd,
    onCertificationCompleted,
    onCodingChallenge,
    onTrainingCompleted,
    
    // Credit operations
    deductCredits,
    canAfford,
    
    // Notification management
    dismissNotification,
    clearNotifications,
    consumePendingReward,
    
    // Refresh
    refresh,
  };
  
  return (
    <RewardContext.Provider value={value}>
      {children}
    </RewardContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useRewardContext(): RewardContextType {
  const context = useContext(RewardContext);
  if (context === undefined) {
    throw new Error('useRewardContext must be used within a RewardProvider');
  }
  return context;
}

// ============================================
// BACKWARD COMPATIBILITY
// ============================================

/**
 * Backward compatible hook that maps to the old achievement context interface
 */
export function useAchievementContextCompat() {
  const reward = useRewardContext();
  
  return {
    progress: [], // Would need to map from achievements
    metrics: {
      totalCompleted: reward.progress.questionsCompleted,
      beginnerCompleted: reward.progress.beginnerCompleted,
      intermediateCompleted: reward.progress.intermediateCompleted,
      advancedCompleted: reward.progress.advancedCompleted,
      currentStreak: reward.progress.currentStreak,
      longestStreak: reward.progress.longestStreak,
      channelsExplored: reward.progress.channelsExplored,
      channelCompletions: reward.progress.channelProgress,
      totalSessions: 0,
      questionsThisSession: reward.progress.currentSessionQuestions,
      studyTimeToday: 0,
      quizCorrectStreak: 0,
      quizTotalCorrect: reward.progress.quizAnswersCorrect,
      quizTotalWrong: reward.progress.quizAnswersWrong,
      voiceInterviews: reward.progress.voiceInterviews,
      voiceSuccesses: reward.progress.voiceSuccesses,
      weekendStreak: 0,
      earlyBirdCount: 0,
      nightOwlCount: 0,
      totalXP: reward.progress.totalXP,
      level: reward.progress.level,
    },
    newlyUnlocked: [],
    trackEvent: (event: any) => {
      // Map old event types to new
      const typeMap: Record<string, string> = {
        'question_completed': 'question_completed',
        'quiz_answered': 'quiz_answered',
        'voice_interview_completed': 'voice_interview_completed',
        'srs_review': 'srs_card_rated',
        'session_started': 'session_started',
        'session_ended': 'session_ended',
        'daily_login': 'daily_login',
        'streak_updated': 'streak_updated',
      };
      
      reward.trackActivity({
        type: typeMap[event.type] as any || event.type,
        timestamp: event.timestamp,
        data: event.data,
      });
    },
    refreshProgress: reward.refresh,
    dismissNotification: () => {},
    pendingAchievements: [],
    consumePendingAchievement: () => undefined,
  };
}

/**
 * Backward compatible hook that maps to the old credits context interface
 */
export function useCreditsContextCompat() {
  const reward = useRewardContext();
  
  return {
    balance: reward.credits,
    state: {
      balance: reward.credits,
      totalEarned: reward.progress.totalCreditsEarned,
      totalSpent: reward.progress.totalCreditsSpent,
      usedCoupons: [],
      initialized: true,
    },
    history: [],
    creditChange: { amount: 0, show: false },
    clearCreditChange: () => {},
    refreshBalance: reward.refresh,
    onQuestionView: () => {
      const result = reward.deductCredits(2, 'Question view');
      return { success: result.success, cost: 2 };
    },
    onVoiceInterview: (verdict: string) => {
      const result = reward.onVoiceInterview(verdict as any);
      return { totalCredits: result.creditsEarned, bonusCredits: 0 };
    },
    onRedeemCoupon: () => ({ success: false, message: 'Not implemented' }),
    onQuestionSwipe: () => ({ shouldRemind: false }),
    dismissVoiceReminder: () => {},
    shouldShowVoiceReminder: false,
    onQuizAnswer: (isCorrect: boolean) => {
      const result = reward.onQuizAnswered(isCorrect);
      return { amount: result.creditsEarned };
    },
    onSRSReview: (rating: 'again' | 'hard' | 'good' | 'easy') => {
      const result = reward.onSRSReview(rating);
      return { amount: result.creditsEarned };
    },
    formatCredits: (amount: number) => String(amount),
    canAfford: reward.canAfford,
    config: {
      NEW_USER_BONUS: 500,
      VOICE_ATTEMPT: 10,
      VOICE_SUCCESS_BONUS: 25,
      QUESTION_VIEW_COST: 2,
      SWIPES_BEFORE_REMINDER: 5,
      QUIZ_CORRECT: 1,
      QUIZ_WRONG: -1,
      SRS_AGAIN: -2,
      SRS_HARD: 0,
      SRS_GOOD: 2,
      SRS_EASY: 3,
    },
  };
}
