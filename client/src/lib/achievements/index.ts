/**
 * Unified Achievement System
 * Export all achievement-related functionality
 */

// Types
export * from './types';

// Levels
export * from './levels';

// Definitions
export * from './definitions';

// Storage
export * from './storage';

// Engine
export * from './engine';

// Re-export commonly used functions
export {
  // Engine
  processUserEvent,
  calculateAchievementProgress,
  getAchievementProgress,
  getUnlockedAchievements,
  getAchievementsByCategory,
  getNextAchievements,
  addAchievementListener,
  awardXP,
} from './engine';

export {
  // Storage
  getMetrics,
  updateMetrics,
  incrementMetric,
  getUnlockedAchievements as getUnlockedAchievementIds,
  unlockAchievement,
  isAchievementUnlocked,
  exportAchievementData,
  importAchievementData,
} from './storage';

export {
  // Levels
  getLevelByXP,
  getNextLevel,
  getXPForNextLevel,
  getLevelProgress,
  getStreakMultiplier,
  calculateXPWithStreak,
  XP_REWARDS,
  STREAK_MULTIPLIERS,
} from './levels';

export {
  // Definitions
  ALL_ACHIEVEMENTS,
  getAchievementById,
  getAchievementsByCategory as getAchievementDefinitionsByCategory,
  getAchievementsByType,
  getAchievementsByTier,
  getDailyChallenges,
  getWeeklyChallenges,
} from './definitions';
