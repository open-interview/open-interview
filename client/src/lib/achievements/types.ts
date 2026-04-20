/**
 * Unified Achievement System - Type Definitions
 * Central types for the entire reward and achievement system
 */

// ============================================
// REWARD TYPES
// ============================================

export type RewardType = 
  | 'badge'           // Achievement badges
  | 'credits'         // Currency
  | 'xp'              // Experience points
  | 'title'           // Profile titles
  | 'streak-bonus'    // Streak multipliers
  | 'unlock';         // Feature unlocks

export interface Reward {
  type: RewardType;
  amount: number;
  item?: string;  // For unlocks/titles
  multiplier?: number;  // For streak bonuses
}

// ============================================
// ACHIEVEMENT TYPES
// ============================================

export type AchievementType = 
  | 'badge'           // One-time achievements
  | 'milestone'       // Major progress markers
  | 'challenge'       // Daily/weekly challenges
  | 'special';        // Hidden/secret achievements

export type AchievementCategory = 
  | 'streak'          // Consistency
  | 'completion'      // Progress
  | 'mastery'         // Difficulty-based
  | 'explorer'        // Channel exploration
  | 'special'         // Unique achievements
  | 'daily'           // Daily challenges
  | 'weekly'          // Weekly challenges
  | 'social';         // Social features (future)

export type AchievementTier = 
  | 'bronze' 
  | 'silver' 
  | 'gold' 
  | 'platinum' 
  | 'diamond';

export interface Achievement {
  id: string;
  type: AchievementType;
  name: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  
  // Requirements
  requirements: Requirement[];
  
  // Rewards
  rewards: Reward[];
  
  // Display
  icon: string;  // Lucide icon name
  color: string;
  gradient: string;
  
  // Metadata
  isHidden?: boolean;      // Secret achievements
  isRepeatable?: boolean;  // Can be earned multiple times
  cooldown?: number;       // Cooldown in hours for repeatable
  expiresAt?: string;      // For time-limited challenges
}

// ============================================
// REQUIREMENT TYPES
// ============================================

export type RequirementType = 
  | 'count'           // Simple count (e.g., 100 questions)
  | 'streak'          // Consecutive days
  | 'percentage'      // Percentage completion
  | 'time'            // Time-based (e.g., study at 3 AM)
  | 'combo'           // Multiple conditions
  | 'rate';           // Rate-based (e.g., 10 questions in 10 minutes)

export interface Requirement {
  type: RequirementType;
  metric: string;  // 'questions_completed', 'streak_days', etc.
  target: number;
  operator?: 'gte' | 'lte' | 'eq';  // Greater/less/equal
  timeWindow?: number;  // For rate-based requirements (in minutes)
}

// ============================================
// PROGRESS TRACKING
// ============================================

export interface AchievementProgress {
  achievement: Achievement;
  current: number;
  target: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  progress: number;  // 0-100
  canClaim?: boolean;  // For challenges that need claiming
  lastEarnedAt?: string;  // For repeatable achievements
}

// ============================================
// USER METRICS
// ============================================

export interface UserMetrics {
  // Completion metrics
  totalCompleted: number;
  beginnerCompleted: number;
  intermediateCompleted: number;
  advancedCompleted: number;
  
  // Streak metrics
  currentStreak: number;
  longestStreak: number;
  
  // Channel metrics
  channelsExplored: string[];
  channelCompletions: Record<string, number>;
  
  // Session metrics
  totalSessions: number;
  questionsThisSession: number;
  sessionStartTime?: number;
  
  // Time metrics
  lastStudyTime?: string;
  studyTimeToday: number;
  
  // Quiz metrics
  quizCorrectStreak: number;
  quizTotalCorrect: number;
  quizTotalWrong: number;
  
  // Voice metrics
  voiceInterviews: number;
  voiceSuccesses: number;
  
  // Special metrics
  weekendStreak: number;
  earlyBirdCount: number;
  nightOwlCount: number;
  
  // XP and Level
  totalXP: number;
  level: number;
  
  // New metrics for unified system
  srsReviews: number;
  trainingSessions: number;
  codingChallengesCompleted: number;
  codingChallengesPassed: number;
  certificationsPassed: number;
  questionsToday: number;
  questionsThisWeek: number;
  channelsThisWeek: string[];
  voiceInterviewsThisWeek: number;
  quizCorrectToday: number;
}

// ============================================
// USER LEVEL SYSTEM
// ============================================

export interface UserLevel {
  level: number;
  title: string;
  xpRequired: number;
  xpForNext: number;
  rewards: Reward[];
  perks: string[];
}

export interface LevelProgress {
  currentLevel: UserLevel;
  nextLevel: UserLevel | null;
  currentXP: number;
  xpForNext: number;
  progress: number;  // 0-100
}

// ============================================
// ACHIEVEMENT HISTORY
// ============================================

export interface AchievementUnlock {
  achievementId: string;
  unlockedAt: string;
  rewardsEarned: Reward[];
  context?: {
    trigger?: string;
    metrics?: Partial<UserMetrics>;
  };
}

// ============================================
// USER EVENT TYPES
// ============================================

export type UserEventType =
  | 'question_completed'
  | 'quiz_answered'
  | 'voice_interview_completed'
  | 'srs_review'
  | 'session_started'
  | 'session_ended'
  | 'channel_completed'
  | 'daily_login'
  | 'streak_updated';

export interface UserEvent {
  type: UserEventType;
  timestamp: string;
  data?: any;
}

// ============================================
// STORAGE TYPES
// ============================================

export interface AchievementStorage {
  metrics: UserMetrics;
  unlockedAchievements: Record<string, string>;  // achievementId -> unlockedAt
  history: AchievementUnlock[];
  lastSync?: string;
}

// ============================================
// HELPER TYPES
// ============================================

export interface TierConfig {
  color: string;
  gradient: string;
  label: string;
}

export interface CategoryConfig {
  label: string;
  icon: string;
  color: string;
}
