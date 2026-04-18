import type { UserProgress } from '@/lib/challenge-progress';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  condition: string;
}

export const ALL_BADGES: Badge[] = [
  // Milestone badges
  { id: 'first-solve', name: 'First Blood', description: 'Solve your first challenge', icon: '🎉', rarity: 'common', condition: 'Solve 1 challenge' },
  { id: 'five-solves', name: 'Getting Started', description: 'Solve 5 challenges', icon: '⭐', rarity: 'common', condition: 'Solve 5 challenges' },
  { id: 'ten-solves', name: 'On a Roll', description: 'Solve 10 challenges', icon: '🔥', rarity: 'rare', condition: 'Solve 10 challenges' },
  { id: 'twenty-five-solves', name: 'Dedicated', description: 'Solve 25 challenges', icon: '💪', rarity: 'rare', condition: 'Solve 25 challenges' },
  // Difficulty badges
  { id: 'easy-master', name: 'Easy Rider', description: 'Solve all easy challenges', icon: '🟢', rarity: 'common', condition: 'Solve all easy challenges' },
  { id: 'medium-master', name: 'Middle Ground', description: 'Solve 5 medium challenges', icon: '🟡', rarity: 'rare', condition: 'Solve 5 medium challenges' },
  { id: 'hard-master', name: 'Hard Boiled', description: 'Solve a hard challenge', icon: '🔴', rarity: 'epic', condition: 'Solve 1 hard challenge' },
  // Streak badges
  { id: 'streak-3', name: 'Consistent', description: '3-day streak', icon: '🔥', rarity: 'common', condition: '3 day streak' },
  { id: 'streak-7', name: 'Week Warrior', description: '7-day streak', icon: '⚡', rarity: 'rare', condition: '7 day streak' },
  { id: 'streak-30', name: 'Monthly Master', description: '30-day streak', icon: '🏆', rarity: 'legendary', condition: '30 day streak' },
  // Language badges
  { id: 'bilingual', name: 'Bilingual', description: 'Solve same challenge in JS and Python', icon: '🌍', rarity: 'epic', condition: 'Solve same challenge in 2 languages' },
  // Speed badges
  { id: 'speed-demon', name: 'Speed Demon', description: 'Solve a challenge in under 5 minutes', icon: '⚡', rarity: 'rare', condition: 'Solve in under 5 minutes' },
  // Level badges
  { id: 'level-5', name: 'Senior Dev', description: 'Reach level 5', icon: '👨‍💻', rarity: 'epic', condition: 'Reach level 5' },
  { id: 'level-7', name: 'Master Coder', description: 'Reach level 7', icon: '🧙', rarity: 'legendary', condition: 'Reach level 7' },
];

export interface ChallengeMetadata {
  challengeId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  /** Language used for this solve (e.g. 'javascript', 'python') */
  language: string;
  /** Time taken to solve in milliseconds */
  timeMs: number;
  /** Previously solved languages for this same challenge (for bilingual check) */
  previousLanguages?: string[];
}

/**
 * Checks which badges should be newly awarded given the current progress state
 * and optional metadata about the challenge just solved.
 *
 * Returns badge IDs that are newly earned (not already in progress.badges).
 * Callers are responsible for persisting the awarded badges via awardBadge().
 */
export function checkAndAwardBadges(
  progress: UserProgress,
  challengeMetadata?: ChallengeMetadata
): string[] {
  const already = new Set(progress.badges);
  const newBadges: string[] = [];

  const award = (id: string) => {
    if (!already.has(id) && !newBadges.includes(id)) newBadges.push(id);
  };

  // --- Milestone ---
  if (progress.totalSolved >= 1) award('first-solve');
  if (progress.totalSolved >= 5) award('five-solves');
  if (progress.totalSolved >= 10) award('ten-solves');
  if (progress.totalSolved >= 25) award('twenty-five-solves');

  // --- Streak ---
  if (progress.streak >= 3) award('streak-3');
  if (progress.streak >= 7) award('streak-7');
  if (progress.streak >= 30) award('streak-30');

  // --- Level ---
  if (progress.level >= 5) award('level-5');
  if (progress.level >= 7) award('level-7');

  // --- Challenge-specific checks ---
  if (challengeMetadata) {
    const { difficulty, timeMs, previousLanguages = [], language } = challengeMetadata;

    // Difficulty
    if (difficulty === 'hard') award('hard-master');

    // Speed: solved in under 5 minutes
    if (timeMs < 5 * 60 * 1000) award('speed-demon');

    // Bilingual: same challenge solved in both JS and Python
    const JS_LANGS = ['javascript', 'js', 'typescript', 'ts'];
    const PY_LANGS = ['python', 'py'];
    const isCurrentJS = JS_LANGS.includes(language.toLowerCase());
    const isCurrentPY = PY_LANGS.includes(language.toLowerCase());
    const hadJS = previousLanguages.some(l => JS_LANGS.includes(l.toLowerCase()));
    const hadPY = previousLanguages.some(l => PY_LANGS.includes(l.toLowerCase()));

    if ((isCurrentJS && hadPY) || (isCurrentPY && hadJS)) award('bilingual');
  }

  return newBadges;
}

/**
 * Awards difficulty-based badges that require knowing the full difficulty breakdown.
 * Call this separately when you have access to difficulty counts.
 */
export function checkDifficultyBadges(
  progress: UserProgress,
  counts: { medium: number; totalEasy: number; solvedEasy: number }
): string[] {
  const already = new Set(progress.badges);
  const newBadges: string[] = [];
  const award = (id: string) => { if (!already.has(id)) newBadges.push(id); };

  if (counts.totalEasy > 0 && counts.solvedEasy >= counts.totalEasy) award('easy-master');
  if (counts.medium >= 5) award('medium-master');

  return newBadges;
}

export function getBadgeById(id: string): Badge | undefined {
  return ALL_BADGES.find(b => b.id === id);
}

export const RARITY_COLORS: Record<Badge['rarity'], string> = {
  common: 'text-gray-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-yellow-400',
};
