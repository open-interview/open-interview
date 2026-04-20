/**
 * User Level System
 * Defines all levels, XP requirements, and rewards
 */

import { UserLevel, Reward } from './types';

// XP calculation: exponential growth
// Level 1: 0 XP
// Level 2: 100 XP
// Level 3: 250 XP
// Level 5: 500 XP
// Level 10: 2000 XP
// Level 20: 5000 XP
// Level 50: 50000 XP

export const LEVELS: UserLevel[] = [
  {
    level: 1,
    title: 'Novice',
    xpRequired: 0,
    xpForNext: 100,
    rewards: [],
    perks: ['basic_questions', 'quick_quiz']
  },
  {
    level: 2,
    title: 'Learner',
    xpRequired: 100,
    xpForNext: 150,
    rewards: [{ type: 'credits', amount: 50 }],
    perks: ['basic_questions', 'quick_quiz']
  },
  {
    level: 3,
    title: 'Student',
    xpRequired: 250,
    xpForNext: 250,
    rewards: [{ type: 'credits', amount: 100 }],
    perks: ['basic_questions', 'quick_quiz', 'bookmarks', 'srs_review']
  },
  {
    level: 4,
    title: 'Apprentice',
    xpRequired: 500,
    xpForNext: 300,
    rewards: [{ type: 'credits', amount: 150 }],
    perks: ['basic_questions', 'quick_quiz', 'bookmarks', 'srs_review']
  },
  {
    level: 5,
    title: 'Practitioner',
    xpRequired: 800,
    xpForNext: 400,
    rewards: [{ type: 'credits', amount: 200 }, { type: 'unlock', amount: 1, item: 'voice_interview' }],
    perks: ['basic_questions', 'quick_quiz', 'bookmarks', 'srs_review', 'voice_interview']
  },
  {
    level: 6,
    title: 'Adept',
    xpRequired: 1200,
    xpForNext: 500,
    rewards: [{ type: 'credits', amount: 250 }],
    perks: ['basic_questions', 'quick_quiz', 'bookmarks', 'srs_review', 'voice_interview']
  },
  {
    level: 7,
    title: 'Professional',
    xpRequired: 1700,
    xpForNext: 600,
    rewards: [{ type: 'credits', amount: 300 }, { type: 'unlock', amount: 1, item: 'mock_tests' }],
    perks: ['basic_questions', 'quick_quiz', 'bookmarks', 'srs_review', 'voice_interview', 'mock_tests']
  },
  {
    level: 8,
    title: 'Specialist',
    xpRequired: 2300,
    xpForNext: 700,
    rewards: [{ type: 'credits', amount: 350 }],
    perks: ['basic_questions', 'quick_quiz', 'bookmarks', 'srs_review', 'voice_interview', 'mock_tests']
  },
  {
    level: 9,
    title: 'Veteran',
    xpRequired: 3000,
    xpForNext: 800,
    rewards: [{ type: 'credits', amount: 400 }],
    perks: ['basic_questions', 'quick_quiz', 'bookmarks', 'srs_review', 'voice_interview', 'mock_tests']
  },
  {
    level: 10,
    title: 'Expert',
    xpRequired: 3800,
    xpForNext: 1000,
    rewards: [{ type: 'credits', amount: 500 }, { type: 'unlock', amount: 1, item: 'coding_challenges' }],
    perks: ['basic_questions', 'quick_quiz', 'bookmarks', 'srs_review', 'voice_interview', 'mock_tests', 'coding_challenges']
  },
  {
    level: 11,
    title: 'Senior',
    xpRequired: 4800,
    xpForNext: 1200,
    rewards: [{ type: 'credits', amount: 600 }],
    perks: ['basic_questions', 'quick_quiz', 'bookmarks', 'srs_review', 'voice_interview', 'mock_tests', 'coding_challenges']
  },
  {
    level: 12,
    title: 'Mentor',
    xpRequired: 6000,
    xpForNext: 1400,
    rewards: [{ type: 'credits', amount: 700 }],
    perks: ['basic_questions', 'quick_quiz', 'bookmarks', 'srs_review', 'voice_interview', 'mock_tests', 'coding_challenges']
  },
  {
    level: 13,
    title: 'Authority',
    xpRequired: 7400,
    xpForNext: 1600,
    rewards: [{ type: 'credits', amount: 800 }],
    perks: ['basic_questions', 'quick_quiz', 'bookmarks', 'srs_review', 'voice_interview', 'mock_tests', 'coding_challenges']
  },
  {
    level: 14,
    title: 'Virtuoso',
    xpRequired: 9000,
    xpForNext: 1800,
    rewards: [{ type: 'credits', amount: 900 }],
    perks: ['basic_questions', 'quick_quiz', 'bookmarks', 'srs_review', 'voice_interview', 'mock_tests', 'coding_challenges']
  },
  {
    level: 15,
    title: 'Ace',
    xpRequired: 10800,
    xpForNext: 2000,
    rewards: [{ type: 'credits', amount: 1000 }, { type: 'unlock', amount: 1, item: 'certifications' }],
    perks: ['all_features']
  },
  {
    level: 16,
    title: 'Champion',
    xpRequired: 12800,
    xpForNext: 2500,
    rewards: [{ type: 'credits', amount: 1200 }],
    perks: ['all_features']
  },
  {
    level: 17,
    title: 'Elite',
    xpRequired: 15300,
    xpForNext: 3000,
    rewards: [{ type: 'credits', amount: 1400 }],
    perks: ['all_features']
  },
  {
    level: 18,
    title: 'Prodigy',
    xpRequired: 18300,
    xpForNext: 3500,
    rewards: [{ type: 'credits', amount: 1600 }],
    perks: ['all_features']
  },
  {
    level: 19,
    title: 'Genius',
    xpRequired: 21800,
    xpForNext: 4000,
    rewards: [{ type: 'credits', amount: 1800 }],
    perks: ['all_features']
  },
  {
    level: 20,
    title: 'Master',
    xpRequired: 25800,
    xpForNext: 5000,
    rewards: [{ type: 'credits', amount: 2000 }],
    perks: ['all_features']
  },
  {
    level: 25,
    title: 'Grandmaster',
    xpRequired: 45800,
    xpForNext: 8000,
    rewards: [{ type: 'credits', amount: 3000 }],
    perks: ['all_features']
  },
  {
    level: 30,
    title: 'Sage',
    xpRequired: 85800,
    xpForNext: 12000,
    rewards: [{ type: 'credits', amount: 4000 }],
    perks: ['all_features']
  },
  {
    level: 35,
    title: 'Oracle',
    xpRequired: 145800,
    xpForNext: 16000,
    rewards: [{ type: 'credits', amount: 5000 }],
    perks: ['all_features']
  },
  {
    level: 40,
    title: 'Titan',
    xpRequired: 225800,
    xpForNext: 20000,
    rewards: [{ type: 'credits', amount: 6000 }],
    perks: ['all_features']
  },
  {
    level: 45,
    title: 'Immortal',
    xpRequired: 325800,
    xpForNext: 25000,
    rewards: [{ type: 'credits', amount: 7000 }],
    perks: ['all_features']
  },
  {
    level: 50,
    title: 'Legend',
    xpRequired: 450800,
    xpForNext: 0,
    rewards: [{ type: 'credits', amount: 10000 }],
    perks: ['all_features']
  },
];

// XP rewards for different actions
export const XP_REWARDS = {
  // Question completion
  QUESTION_BEGINNER: 10,
  QUESTION_INTERMEDIATE: 20,
  QUESTION_ADVANCED: 30,
  
  // Quiz
  QUIZ_CORRECT: 5,
  QUIZ_STREAK_BONUS: 2,  // Per streak count
  
  // SRS Review
  SRS_GOOD: 10,
  SRS_EASY: 15,
  
  // Voice Interview
  VOICE_ATTEMPT: 50,
  VOICE_SUCCESS: 100,  // Bonus for hire/strong-hire
  
  // Challenges
  DAILY_CHALLENGE: 100,
  WEEKLY_CHALLENGE: 500,
  
  // Achievements
  BADGE_UNLOCK: 50,
  MILESTONE_UNLOCK: 100,
  
  // Streaks
  DAILY_STREAK: 20,
  WEEKLY_STREAK: 100,
  MONTHLY_STREAK: 500,
  
  // Channel completion
  CHANNEL_25_PERCENT: 50,
  CHANNEL_50_PERCENT: 100,
  CHANNEL_75_PERCENT: 150,
  CHANNEL_100_PERCENT: 300,
  
  // Daily login
  DAILY_LOGIN: 10,
};

// Streak multipliers
export const STREAK_MULTIPLIERS: Record<number, number> = {
  7: 1.1,    // 10% bonus after 7 days
  14: 1.2,   // 20% bonus after 14 days
  30: 1.5,   // 50% bonus after 30 days
  60: 1.75,  // 75% bonus after 60 days
  100: 2.0,  // 2x bonus after 100 days
  365: 3.0,  // 3x bonus after 1 year!
};

// Get level by XP
export function getLevelByXP(xp: number): UserLevel {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpRequired) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
}

// Get next level
export function getNextLevel(currentLevel: number): UserLevel | null {
  const nextLevelData = LEVELS.find(l => l.level === currentLevel + 1);
  if (nextLevelData) return nextLevelData;
  
  // Check for gaps (e.g., level 20 -> 25)
  const higherLevels = LEVELS.filter(l => l.level > currentLevel).sort((a, b) => a.level - b.level);
  return higherLevels[0] || null;
}

// Calculate XP for next level
export function getXPForNextLevel(currentXP: number, currentLevel: number): number {
  const nextLevel = getNextLevel(currentLevel);
  if (!nextLevel) return 0;
  return nextLevel.xpRequired - currentXP;
}

// Calculate level progress percentage
export function getLevelProgress(currentXP: number, currentLevel: number): number {
  const current = getLevelByXP(currentXP);
  const next = getNextLevel(currentLevel);
  
  if (!next) return 100;
  
  const xpIntoLevel = currentXP - current.xpRequired;
  const xpNeededForLevel = next.xpRequired - current.xpRequired;
  
  return Math.min(100, Math.round((xpIntoLevel / xpNeededForLevel) * 100));
}

// Get streak multiplier
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

// Calculate XP with streak multiplier
export function calculateXPWithStreak(baseXP: number, streak: number): number {
  const multiplier = getStreakMultiplier(streak);
  return Math.round(baseXP * multiplier);
}
