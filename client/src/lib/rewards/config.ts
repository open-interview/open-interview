/**
 * Unified Reward Configuration
 * Central configuration for all XP, credits, and reward values
 */

import { ActivityRewardConfig, RewardConfigMap, ActivityType } from './types';

// ============================================
// XP CONFIGURATION
// ============================================

export const XP_CONFIG = {
  // Question completion by difficulty
  QUESTION_BEGINNER: 10,
  QUESTION_INTERMEDIATE: 20,
  QUESTION_ADVANCED: 30,
  
  // Quiz rewards
  QUIZ_CORRECT: 5,
  QUIZ_WRONG: 0,
  QUIZ_PERFECT: 50, // Bonus for perfect score
  QUIZ_STREAK_BONUS: 2, // Per correct streak
  
  // Voice interview
  VOICE_ATTEMPT: 50,
  VOICE_SUCCESS: 100, // Bonus for hire/strong-hire
  
  // SRS review
  SRS_AGAIN: 0,
  SRS_HARD: 5,
  SRS_GOOD: 10,
  SRS_EASY: 15,
  
  // Session rewards
  DAILY_LOGIN: 10,
  SESSION_COMPLETE: 25,
  
  // Challenge rewards
  DAILY_CHALLENGE: 100,
  WEEKLY_CHALLENGE: 500,
  
  // Certification
  CERTIFICATION_ATTEMPT: 100,
  CERTIFICATION_PASS: 500,
  
  // Coding challenge
  CODING_ATTEMPT: 50,
  CODING_PASS: 200,
  
  // Training
  TRAINING_COMPLETE: 75,
};

// ============================================
// CREDIT CONFIGURATION
// ============================================

export const CREDIT_CONFIG = {
  // Starting balance
  NEW_USER_BONUS: 500,
  
  // Earning credits
  VOICE_ATTEMPT: 10,
  VOICE_SUCCESS_BONUS: 25,
  QUIZ_CORRECT: 1,
  QUIZ_WRONG: -1,
  SRS_AGAIN: -2,
  SRS_HARD: 0,
  SRS_GOOD: 2,
  SRS_EASY: 3,
  
  // Spending credits
  QUESTION_VIEW_COST: 2,
  
  // Achievement rewards (base values, actual values in achievement definitions)
  ACHIEVEMENT_BRONZE: 50,
  ACHIEVEMENT_SILVER: 100,
  ACHIEVEMENT_GOLD: 200,
  ACHIEVEMENT_PLATINUM: 500,
  ACHIEVEMENT_DIAMOND: 1000,
  
  // Level up rewards
  LEVEL_UP_BASE: 50,
  LEVEL_UP_MULTIPLIER: 1.2, // Each level gives more
};

// ============================================
// STREAK MULTIPLIERS
// ============================================

export const STREAK_MULTIPLIERS: Record<number, number> = {
  3: 1.05,   // 5% bonus after 3 days
  7: 1.1,    // 10% bonus after 7 days
  14: 1.2,   // 20% bonus after 14 days
  30: 1.5,   // 50% bonus after 30 days
  60: 1.75,  // 75% bonus after 60 days
  100: 2.0,  // 2x bonus after 100 days
  365: 3.0,  // 3x bonus after 1 year
};

// ============================================
// DIFFICULTY MULTIPLIERS
// ============================================

export const DIFFICULTY_MULTIPLIERS: Record<string, number> = {
  beginner: 1.0,
  intermediate: 1.5,
  advanced: 2.0,
};

// ============================================
// ACTIVITY REWARD CONFIGURATION
// ============================================

export const ACTIVITY_REWARDS: RewardConfigMap = {
  // Question activities
  question_viewed: {
    baseXP: 0,
    baseCredits: 0,
    creditCost: CREDIT_CONFIG.QUESTION_VIEW_COST,
  },
  question_completed: {
    baseXP: XP_CONFIG.QUESTION_BEGINNER, // Will be adjusted by difficulty
    baseCredits: 0,
    streakMultiplier: true,
    difficultyMultiplier: true,
  },
  question_bookmarked: {
    baseXP: 2,
    baseCredits: 0,
  },
  question_shared: {
    baseXP: 5,
    baseCredits: 5,
  },
  
  // Quiz activities
  quiz_started: {
    baseXP: 0,
    baseCredits: 0,
  },
  quiz_answered: {
    baseXP: XP_CONFIG.QUIZ_CORRECT, // Adjusted based on correctness
    baseCredits: CREDIT_CONFIG.QUIZ_CORRECT, // Adjusted based on correctness
  },
  quiz_completed: {
    baseXP: 10,
    baseCredits: 5,
  },
  quiz_perfect_score: {
    baseXP: XP_CONFIG.QUIZ_PERFECT,
    baseCredits: 25,
  },
  
  // Voice activities
  voice_interview_started: {
    baseXP: 0,
    baseCredits: 0,
  },
  voice_interview_completed: {
    baseXP: XP_CONFIG.VOICE_ATTEMPT,
    baseCredits: CREDIT_CONFIG.VOICE_ATTEMPT,
    streakMultiplier: true,
  },
  voice_interview_success: {
    baseXP: XP_CONFIG.VOICE_SUCCESS,
    baseCredits: CREDIT_CONFIG.VOICE_SUCCESS_BONUS,
  },
  
  // SRS activities
  srs_review_started: {
    baseXP: 0,
    baseCredits: 0,
  },
  srs_review_completed: {
    baseXP: 5,
    baseCredits: 0,
  },
  srs_card_rated: {
    baseXP: XP_CONFIG.SRS_GOOD, // Adjusted based on rating
    baseCredits: CREDIT_CONFIG.SRS_GOOD, // Adjusted based on rating
    streakMultiplier: true,
  },
  
  // Session activities
  session_started: {
    baseXP: 0,
    baseCredits: 0,
  },
  session_ended: {
    baseXP: XP_CONFIG.SESSION_COMPLETE,
    baseCredits: 0,
  },
  daily_login: {
    baseXP: XP_CONFIG.DAILY_LOGIN,
    baseCredits: 0,
    streakMultiplier: true,
  },
  streak_updated: {
    baseXP: 0,
    baseCredits: 0,
  },
  
  // Challenge activities
  daily_challenge_completed: {
    baseXP: XP_CONFIG.DAILY_CHALLENGE,
    baseCredits: 50,
  },
  weekly_challenge_completed: {
    baseXP: XP_CONFIG.WEEKLY_CHALLENGE,
    baseCredits: 200,
  },
  
  // Certification activities
  certification_started: {
    baseXP: 0,
    baseCredits: 0,
  },
  certification_completed: {
    baseXP: XP_CONFIG.CERTIFICATION_ATTEMPT,
    baseCredits: 50,
  },
  certification_passed: {
    baseXP: XP_CONFIG.CERTIFICATION_PASS,
    baseCredits: 200,
  },
  
  // Coding activities
  coding_challenge_started: {
    baseXP: 0,
    baseCredits: 0,
  },
  coding_challenge_completed: {
    baseXP: XP_CONFIG.CODING_ATTEMPT,
    baseCredits: 25,
  },
  coding_challenge_passed: {
    baseXP: XP_CONFIG.CODING_PASS,
    baseCredits: 100,
  },
  
  // Training activities
  training_session_started: {
    baseXP: 0,
    baseCredits: 0,
  },
  training_session_completed: {
    baseXP: XP_CONFIG.TRAINING_COMPLETE,
    baseCredits: 25,
    streakMultiplier: true,
  },
  
  // Social activities
  profile_updated: {
    baseXP: 5,
    baseCredits: 0,
  },
  achievement_shared: {
    baseXP: 10,
    baseCredits: 10,
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getStreakMultiplier(streak: number): number {
  const thresholds = Object.keys(STREAK_MULTIPLIERS)
    .map(Number)
    .sort((a, b) => b - a);
  
  for (const threshold of thresholds) {
    if (streak >= threshold) {
      return STREAK_MULTIPLIERS[threshold];
    }
  }
  
  return 1.0;
}

export function getDifficultyMultiplier(difficulty?: string): number {
  if (!difficulty) return 1.0;
  return DIFFICULTY_MULTIPLIERS[difficulty] || 1.0;
}

export function getActivityConfig(type: ActivityType): ActivityRewardConfig {
  return ACTIVITY_REWARDS[type] || { baseXP: 0, baseCredits: 0 };
}

export function calculateLevelUpCredits(level: number): number {
  return Math.round(CREDIT_CONFIG.LEVEL_UP_BASE * Math.pow(CREDIT_CONFIG.LEVEL_UP_MULTIPLIER, level - 1));
}
