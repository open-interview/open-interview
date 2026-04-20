/**
 * Unified Reward System - Type Definitions
 * Central types for XP, Credits, Badges, and all rewards
 */

// ============================================
// ACTIVITY TYPES - All trackable user activities
// ============================================

export type ActivityType =
  // Question activities
  | 'question_viewed'
  | 'question_completed'
  | 'question_bookmarked'
  | 'question_shared'
  // Quiz activities
  | 'quiz_started'
  | 'quiz_answered'
  | 'quiz_completed'
  | 'quiz_perfect_score'
  // Voice activities
  | 'voice_interview_started'
  | 'voice_interview_completed'
  | 'voice_interview_success'
  // SRS activities
  | 'srs_review_started'
  | 'srs_review_completed'
  | 'srs_card_rated'
  // Session activities
  | 'session_started'
  | 'session_ended'
  | 'daily_login'
  | 'streak_updated'
  // Challenge activities
  | 'daily_challenge_completed'
  | 'weekly_challenge_completed'
  // Certification activities
  | 'certification_started'
  | 'certification_completed'
  | 'certification_passed'
  // Coding activities
  | 'coding_challenge_started'
  | 'coding_challenge_completed'
  | 'coding_challenge_passed'
  // Training activities
  | 'training_session_started'
  | 'training_session_completed'
  // Social activities (future)
  | 'profile_updated'
  | 'achievement_shared';

// ============================================
// ACTIVITY EVENT
// ============================================

export interface ActivityEvent {
  type: ActivityType;
  timestamp: string;
  data?: ActivityData;
}

export interface ActivityData {
  // Question data
  questionId?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  channel?: string;
  subChannel?: string;
  
  // Quiz data
  isCorrect?: boolean;
  score?: number;
  totalQuestions?: number;
  
  // Voice data
  verdict?: 'strong-hire' | 'hire' | 'no-hire' | 'needs-improvement';
  interviewScore?: number;
  
  // SRS data
  rating?: 'again' | 'hard' | 'good' | 'easy';
  cardId?: string;
  
  // Session data
  duration?: number;
  questionsCompleted?: number;
  
  // Streak data
  streak?: number;
  
  // Certification data
  certificationId?: string;
  passed?: boolean;
  
  // Coding data
  challengeId?: string;
  language?: string;
  
  // Generic
  metadata?: Record<string, any>;
}

// ============================================
// REWARD RESULT
// ============================================

export interface RewardResult {
  // XP rewards
  xpEarned: number;
  xpMultiplier: number;
  totalXP: number;
  newTotalXP: number;
  
  // Credit rewards
  creditsEarned: number;
  creditsSpent: number;
  netCredits: number;
  newBalance: number;
  
  // Level changes
  leveledUp: boolean;
  oldLevel: number;
  newLevel: number;
  levelRewards?: LevelUpReward[];
  
  // Achievements unlocked
  achievementsUnlocked: UnlockedAchievement[];
  
  // Streak info
  streakBonus: number;
  currentStreak: number;
  
  // Summary for UI
  summary: RewardSummary;
}

export interface LevelUpReward {
  type: 'credits' | 'unlock' | 'title';
  amount: number;
  item?: string;
}

export interface UnlockedAchievement {
  id: string;
  name: string;
  description: string;
  tier: string;
  icon: string;
  rewards: {
    xp: number;
    credits: number;
    title?: string;
  };
}

export interface RewardSummary {
  hasRewards: boolean;
  message: string;
  details: string[];
}

// ============================================
// REWARD CONFIGURATION
// ============================================

export interface ActivityRewardConfig {
  baseXP: number;
  baseCredits: number;
  creditCost?: number; // For activities that cost credits
  streakMultiplier?: boolean;
  difficultyMultiplier?: boolean;
}

export type RewardConfigMap = Record<ActivityType, ActivityRewardConfig>;

// ============================================
// USER PROGRESS STATE
// ============================================

export interface UserProgressState {
  // XP & Level
  totalXP: number;
  level: number;
  
  // Credits
  creditBalance: number;
  totalCreditsEarned: number;
  totalCreditsSpent: number;
  
  // Streaks
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  
  // Activity counts
  questionsCompleted: number;
  quizAnswersCorrect: number;
  quizAnswersWrong: number;
  voiceInterviews: number;
  voiceSuccesses: number;
  srsReviews: number;
  
  // Difficulty breakdown
  beginnerCompleted: number;
  intermediateCompleted: number;
  advancedCompleted: number;
  
  // Channel exploration
  channelsExplored: string[];
  channelProgress: Record<string, number>;
  
  // Session tracking
  currentSessionQuestions: number;
  todayQuestions: number;
  thisWeekQuestions: number;
  
  // Timestamps
  lastUpdated: string;
  createdAt: string;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export interface RewardNotification {
  id: string;
  type: 'xp' | 'credits' | 'level_up' | 'achievement' | 'streak';
  title: string;
  message: string;
  icon?: string;
  color?: string;
  amount?: number;
  timestamp: string;
  dismissed: boolean;
}
