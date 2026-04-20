/**
 * Unified Reward System
 * Central export for all reward-related functionality
 */

// Types
export * from './types';

// Configuration
export * from './config';

// Storage
export {
  rewardStorage,
  getProgress,
  updateProgress,
  getCreditBalance,
  addCredits,
  spendCredits,
  canAfford,
  getTotalXP,
  getLevel,
  addXP,
  getCurrentStreak,
  updateStreak,
} from './storage';

// Engine
export {
  rewardEngine,
  processActivity,
  getProgressSummary,
  canAffordActivity,
  addRewardListener,
} from './engine';

// ============================================
// QUICK ACCESS HELPERS
// ============================================

import { ActivityEvent, ActivityType, RewardResult } from './types';
import { rewardEngine } from './engine';
import { rewardStorage } from './storage';

/**
 * Quick helper to track a question completion
 */
export function trackQuestionCompleted(
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  channel: string,
  questionId?: string
): RewardResult {
  return rewardEngine.processActivity({
    type: 'question_completed',
    timestamp: new Date().toISOString(),
    data: { difficulty, channel, questionId },
  });
}

/**
 * Quick helper to track a quiz answer
 */
export function trackQuizAnswer(isCorrect: boolean): RewardResult {
  return rewardEngine.processActivity({
    type: 'quiz_answered',
    timestamp: new Date().toISOString(),
    data: { isCorrect },
  });
}

/**
 * Quick helper to track a voice interview
 */
export function trackVoiceInterview(
  verdict: 'strong-hire' | 'hire' | 'no-hire' | 'needs-improvement',
  score?: number
): RewardResult {
  return rewardEngine.processActivity({
    type: 'voice_interview_completed',
    timestamp: new Date().toISOString(),
    data: { verdict, interviewScore: score },
  });
}

/**
 * Quick helper to track an SRS review
 */
export function trackSRSReview(rating: 'again' | 'hard' | 'good' | 'easy'): RewardResult {
  return rewardEngine.processActivity({
    type: 'srs_card_rated',
    timestamp: new Date().toISOString(),
    data: { rating },
  });
}

/**
 * Quick helper to track daily login
 */
export function trackDailyLogin(): RewardResult {
  return rewardEngine.processActivity({
    type: 'daily_login',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Quick helper to track session start
 */
export function trackSessionStart(): RewardResult {
  return rewardEngine.processActivity({
    type: 'session_started',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Quick helper to track session end
 */
export function trackSessionEnd(questionsCompleted: number, duration: number): RewardResult {
  return rewardEngine.processActivity({
    type: 'session_ended',
    timestamp: new Date().toISOString(),
    data: { questionsCompleted, duration },
  });
}

/**
 * Quick helper to track certification completion
 */
export function trackCertificationCompleted(certificationId: string, passed: boolean): RewardResult {
  const type: ActivityType = passed ? 'certification_passed' : 'certification_completed';
  return rewardEngine.processActivity({
    type,
    timestamp: new Date().toISOString(),
    data: { certificationId, passed },
  });
}

/**
 * Quick helper to track coding challenge
 */
export function trackCodingChallenge(challengeId: string, passed: boolean, language?: string): RewardResult {
  const type: ActivityType = passed ? 'coding_challenge_passed' : 'coding_challenge_completed';
  return rewardEngine.processActivity({
    type,
    timestamp: new Date().toISOString(),
    data: { challengeId, passed, language },
  });
}

/**
 * Quick helper to track training session
 */
export function trackTrainingSession(questionsCompleted: number): RewardResult {
  return rewardEngine.processActivity({
    type: 'training_session_completed',
    timestamp: new Date().toISOString(),
    data: { questionsCompleted },
  });
}

/**
 * Quick helper to deduct credits for viewing a question
 */
export function deductQuestionViewCredits(): { success: boolean; cost: number; balance: number } {
  const cost = 2; // CREDIT_CONFIG.QUESTION_VIEW_COST
  const result = rewardStorage.spendCredits(cost);
  return { success: result.success, cost, balance: result.balance };
}

/**
 * Get user's current reward state
 */
export function getUserRewardState() {
  const progress = rewardStorage.getProgress();
  return {
    level: progress.level,
    totalXP: progress.totalXP,
    credits: progress.creditBalance,
    streak: progress.currentStreak,
    longestStreak: progress.longestStreak,
    questionsCompleted: progress.questionsCompleted,
    channelsExplored: progress.channelsExplored.length,
  };
}
