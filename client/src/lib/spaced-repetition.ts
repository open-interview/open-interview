/**
 * Spaced Repetition System (SRS) for Code Reels
 * 
 * Uses a modified SM-2 algorithm optimized for interview prep:
 * - Shorter initial intervals (interviews are time-sensitive)
 * - Difficulty-aware scheduling
 * - Confidence-based adjustments
 */

export type ConfidenceRating = 'again' | 'hard' | 'good' | 'easy';

export interface ReviewCard {
  questionId: string;
  channel: string;
  difficulty: string;
  // SRS state
  interval: number;        // Days until next review
  easeFactor: number;      // Multiplier for interval (2.5 default)
  repetitions: number;     // Successful reviews in a row
  nextReview: string;      // ISO date string
  lastReview: string;      // ISO date string
  // Stats
  totalReviews: number;
  correctStreak: number;
  masteryLevel: number;    // 0-5 (0=new, 5=mastered)
}

export interface SRSStats {
  totalCards: number;
  dueToday: number;
  dueTomorrow: number;
  dueThisWeek: number;
  mastered: number;
  learning: number;
  newToday: number;
  reviewStreak: number;
  lastReviewDate: string | null;
}

const STORAGE_KEY = 'code-reels-srs';
const STATS_KEY = 'code-reels-srs-stats';

// SM-2 algorithm constants (tuned for interview prep)
const MIN_EASE_FACTOR = 1.3;
const DEFAULT_EASE_FACTOR = 2.5;
const INITIAL_INTERVALS = [1, 3, 7]; // Days for first 3 reviews
const MAX_INTERVAL = 180; // 6 months max

/**
 * Calculate the next review interval based on confidence rating
 */
function calculateNextInterval(
  card: ReviewCard,
  rating: ConfidenceRating
): { interval: number; easeFactor: number; repetitions: number } {
  let { interval, easeFactor, repetitions } = card;

  switch (rating) {
    case 'again':
      // Reset - user forgot
      return {
        interval: 1,
        easeFactor: Math.max(MIN_EASE_FACTOR, easeFactor - 0.2),
        repetitions: 0
      };

    case 'hard':
      // Slight penalty, shorter interval
      const hardInterval = Math.max(1, Math.round(interval * 1.2));
      return {
        interval: hardInterval,
        easeFactor: Math.max(MIN_EASE_FACTOR, easeFactor - 0.15),
        repetitions: repetitions + 1
      };

    case 'good':
      // Standard progression
      let goodInterval: number;
      if (repetitions < INITIAL_INTERVALS.length) {
        goodInterval = INITIAL_INTERVALS[repetitions];
      } else {
        goodInterval = Math.round(interval * easeFactor);
      }
      return {
        interval: Math.min(MAX_INTERVAL, goodInterval),
        easeFactor,
        repetitions: repetitions + 1
      };

    case 'easy':
      // Bonus - user found it easy
      let easyInterval: number;
      if (repetitions < INITIAL_INTERVALS.length) {
        easyInterval = INITIAL_INTERVALS[Math.min(repetitions + 1, INITIAL_INTERVALS.length - 1)] * 1.5;
      } else {
        easyInterval = Math.round(interval * easeFactor * 1.3);
      }
      return {
        interval: Math.min(MAX_INTERVAL, Math.round(easyInterval)),
        easeFactor: Math.min(3.0, easeFactor + 0.1),
        repetitions: repetitions + 1
      };
  }
}

/**
 * Calculate mastery level (0-5) based on review history
 */
function calculateMasteryLevel(card: ReviewCard): number {
  const { repetitions, interval, correctStreak } = card;
  
  if (repetitions === 0) return 0;
  if (interval >= 90 && correctStreak >= 5) return 5; // Mastered
  if (interval >= 30 && correctStreak >= 4) return 4; // Expert
  if (interval >= 14 && correctStreak >= 3) return 3; // Proficient
  if (interval >= 7 && correctStreak >= 2) return 2;  // Familiar
  if (repetitions >= 1) return 1;                      // Learning
  return 0;
}

/**
 * Get all SRS cards from storage
 */
export function getAllCards(): Map<string, ReviewCard> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return new Map();
    const parsed = JSON.parse(stored);
    return new Map(Object.entries(parsed));
  } catch {
    return new Map();
  }
}

/**
 * Save all cards to storage
 */
function saveAllCards(cards: Map<string, ReviewCard>): void {
  const obj = Object.fromEntries(cards);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
}

/**
 * Get or create a card for a question
 */
export function getCard(questionId: string, channel: string, difficulty: string): ReviewCard {
  const cards = getAllCards();
  const existing = cards.get(questionId);
  
  if (existing) return existing;
  
  // Create new card
  const newCard: ReviewCard = {
    questionId,
    channel,
    difficulty,
    interval: 0,
    easeFactor: DEFAULT_EASE_FACTOR,
    repetitions: 0,
    nextReview: new Date().toISOString().split('T')[0],
    lastReview: '',
    totalReviews: 0,
    correctStreak: 0,
    masteryLevel: 0
  };
  
  return newCard;
}

/**
 * Record a review and update the card
 */
export function recordReview(
  questionId: string,
  channel: string,
  difficulty: string,
  rating: ConfidenceRating
): ReviewCard {
  const cards = getAllCards();
  const card = getCard(questionId, channel, difficulty);
  
  // Calculate new interval
  const { interval, easeFactor, repetitions } = calculateNextInterval(card, rating);
  
  // Update card
  const today = new Date().toISOString().split('T')[0];
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);
  
  const updatedCard: ReviewCard = {
    ...card,
    interval,
    easeFactor,
    repetitions,
    nextReview: nextReviewDate.toISOString().split('T')[0],
    lastReview: today,
    totalReviews: card.totalReviews + 1,
    correctStreak: rating === 'again' ? 0 : card.correctStreak + 1,
    masteryLevel: 0 // Will be calculated
  };
  
  updatedCard.masteryLevel = calculateMasteryLevel(updatedCard);
  
  // Save
  cards.set(questionId, updatedCard);
  saveAllCards(cards);
  
  // Update stats
  updateReviewStreak();
  
  return updatedCard;
}

/**
 * Get cards due for review today
 */
export function getDueCards(): ReviewCard[] {
  const cards = getAllCards();
  const today = new Date().toISOString().split('T')[0];
  
  return Array.from(cards.values())
    .filter(card => card.nextReview <= today)
    .sort((a, b) => {
      // Priority: overdue first, then by mastery (lower first)
      if (a.nextReview !== b.nextReview) {
        return a.nextReview.localeCompare(b.nextReview);
      }
      return a.masteryLevel - b.masteryLevel;
    });
}

/**
 * Get cards due for review grouped by channel
 */
export function getDueCardsByChannel(): Map<string, ReviewCard[]> {
  const cards = getDueCards();
  const byChannel = new Map<string, ReviewCard[]>();
  
  for (const card of cards) {
    const channel = card.channel || 'other';
    if (!byChannel.has(channel)) {
      byChannel.set(channel, []);
    }
    byChannel.get(channel)!.push(card);
  }
  
  return byChannel;
}

/**
 * Get list of channels that have cards due for review
 */
export function getChannelsWithDueCards(): { channel: string; count: number }[] {
  const byChannel = getDueCardsByChannel();
  return Array.from(byChannel.entries())
    .map(([channel, cards]) => ({ channel, count: cards.length }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get cards due within a date range
 */
export function getCardsDueInRange(days: number): ReviewCard[] {
  const cards = getAllCards();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);
  const endStr = endDate.toISOString().split('T')[0];
  
  return Array.from(cards.values())
    .filter(card => card.nextReview <= endStr);
}

/**
 * Get SRS statistics
 */
export function getSRSStats(): SRSStats {
  const cards = getAllCards();
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const weekEnd = new Date();
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndStr = weekEnd.toISOString().split('T')[0];
  
  const allCards = Array.from(cards.values());
  
  // Get review streak from stats
  const statsStr = localStorage.getItem(STATS_KEY);
  const stats = statsStr ? JSON.parse(statsStr) : { reviewStreak: 0, lastReviewDate: null };
  
  return {
    totalCards: allCards.length,
    dueToday: allCards.filter(c => c.nextReview <= today).length,
    dueTomorrow: allCards.filter(c => c.nextReview === tomorrowStr).length,
    dueThisWeek: allCards.filter(c => c.nextReview <= weekEndStr).length,
    mastered: allCards.filter(c => c.masteryLevel >= 4).length,
    learning: allCards.filter(c => c.masteryLevel > 0 && c.masteryLevel < 4).length,
    newToday: allCards.filter(c => c.lastReview === today && c.totalReviews === 1).length,
    reviewStreak: stats.reviewStreak,
    lastReviewDate: stats.lastReviewDate
  };
}

/**
 * Update the review streak
 */
function updateReviewStreak(): void {
  const today = new Date().toISOString().split('T')[0];
  const statsStr = localStorage.getItem(STATS_KEY);
  const stats = statsStr ? JSON.parse(statsStr) : { reviewStreak: 0, lastReviewDate: null };
  
  if (stats.lastReviewDate === today) {
    // Already reviewed today, no change
    return;
  }
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  if (stats.lastReviewDate === yesterdayStr) {
    // Continuing streak
    stats.reviewStreak += 1;
  } else if (stats.lastReviewDate !== today) {
    // Streak broken, start new
    stats.reviewStreak = 1;
  }
  
  stats.lastReviewDate = today;
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

/**
 * Add a question to the SRS system (when user completes it)
 */
export function addToSRS(questionId: string, channel: string, difficulty: string): ReviewCard {
  const cards = getAllCards();
  
  if (cards.has(questionId)) {
    return cards.get(questionId)!;
  }
  
  const newCard: ReviewCard = {
    questionId,
    channel,
    difficulty,
    interval: 1,
    easeFactor: DEFAULT_EASE_FACTOR,
    repetitions: 0,
    nextReview: new Date().toISOString().split('T')[0],
    lastReview: '',
    totalReviews: 0,
    correctStreak: 0,
    masteryLevel: 0
  };
  
  cards.set(questionId, newCard);
  saveAllCards(cards);
  
  return newCard;
}

/**
 * Check if a question is in the SRS system
 */
export function isInSRS(questionId: string): boolean {
  return getAllCards().has(questionId);
}

export function removeFromSRS(questionId: string): void {
  const cards = getAllCards();
  cards.delete(questionId);
  saveAllCards(cards);
}

/**
 * Get mastery level label
 */
export function getMasteryLabel(level: number): string {
  const labels = ['New', 'Learning', 'Familiar', 'Proficient', 'Expert', 'Mastered'];
  return labels[Math.min(level, 5)];
}

/**
 * Get mastery level color
 */
export function getMasteryColor(level: number): string {
  const colors = [
    'text-muted-foreground', // New
    'text-blue-500',         // Learning
    'text-cyan-500',         // Familiar
    'text-green-500',        // Proficient
    'text-purple-500',       // Expert
    'text-yellow-500'        // Mastered
  ];
  return colors[Math.min(level, 5)];
}

/**
 * Get mastery level emoji/icon
 */
export function getMasteryEmoji(level: number): string {
  const emojis = ['🌱', '📚', '🌿', '🌳', '⭐', '👑'];
  return emojis[Math.min(level, 5)];
}

/**
 * XP System - Calculate XP earned from a review
 */
export function calculateXP(rating: ConfidenceRating, masteryLevel: number): number {
  const baseXP: Record<ConfidenceRating, number> = {
    again: 5,
    hard: 10,
    good: 15,
    easy: 20
  };
  // Bonus XP for higher mastery cards
  const masteryBonus = masteryLevel * 2;
  return baseXP[rating] + masteryBonus;
}

/**
 * Get user's total XP and level
 */
export function getUserXP(): { totalXP: number; level: number; xpToNext: number; progress: number } {
  const statsStr = localStorage.getItem(STATS_KEY);
  const stats = statsStr ? JSON.parse(statsStr) : { totalXP: 0 };
  const totalXP = stats.totalXP || 0;
  
  // Level formula: level = floor(sqrt(totalXP / 100))
  const level = Math.floor(Math.sqrt(totalXP / 100)) + 1;
  const xpForCurrentLevel = Math.pow(level - 1, 2) * 100;
  const xpForNextLevel = Math.pow(level, 2) * 100;
  const xpToNext = xpForNextLevel - totalXP;
  const progress = ((totalXP - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;
  
  return { totalXP, level, xpToNext, progress: Math.max(0, Math.min(100, progress)) };
}

/**
 * Add XP to user's total
 */
export function addXP(amount: number): { totalXP: number; level: number; leveledUp: boolean } {
  const statsStr = localStorage.getItem(STATS_KEY);
  const stats = statsStr ? JSON.parse(statsStr) : { totalXP: 0, reviewStreak: 0, lastReviewDate: null };
  
  const oldLevel = Math.floor(Math.sqrt((stats.totalXP || 0) / 100)) + 1;
  stats.totalXP = (stats.totalXP || 0) + amount;
  const newLevel = Math.floor(Math.sqrt(stats.totalXP / 100)) + 1;
  
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  
  return { 
    totalXP: stats.totalXP, 
    level: newLevel, 
    leveledUp: newLevel > oldLevel 
  };
}

/**
 * Get confidence rating label
 */
export function getRatingLabel(rating: ConfidenceRating): string {
  const labels: Record<ConfidenceRating, string> = {
    again: 'Again',
    hard: 'Hard',
    good: 'Good',
    easy: 'Easy'
  };
  return labels[rating];
}

/**
 * Get next review preview for each rating
 */
export function getNextReviewPreview(card: ReviewCard): Record<ConfidenceRating, string> {
  const ratings: ConfidenceRating[] = ['again', 'hard', 'good', 'easy'];
  const previews: Record<ConfidenceRating, string> = {} as any;
  
  for (const rating of ratings) {
    const { interval } = calculateNextInterval(card, rating);
    if (interval === 1) {
      previews[rating] = '1d';
    } else if (interval < 7) {
      previews[rating] = `${interval}d`;
    } else if (interval < 30) {
      previews[rating] = `${Math.round(interval / 7)}w`;
    } else {
      previews[rating] = `${Math.round(interval / 30)}mo`;
    }
  }
  
  return previews;
}

export default {
  getAllCards,
  getCard,
  recordReview,
  getDueCards,
  getCardsDueInRange,
  getSRSStats,
  addToSRS,
  isInSRS,
  getMasteryLabel,
  getMasteryColor,
  getMasteryEmoji,
  getRatingLabel,
  getNextReviewPreview,
  calculateXP,
  getUserXP,
  addXP
};

// ============================================
// FLASHCARD SRS — uses namespaced keys so
// flashcard progress is separate from question SRS
// ============================================
const FC_SRS_KEY = 'code-reels-fc-srs';

function getAllFcCards(): Map<string, ReviewCard> {
  try {
    const stored = localStorage.getItem(FC_SRS_KEY);
    if (!stored) return new Map();
    return new Map(Object.entries(JSON.parse(stored)));
  } catch {
    return new Map();
  }
}

function saveFcCards(cards: Map<string, ReviewCard>): void {
  localStorage.setItem(FC_SRS_KEY, JSON.stringify(Object.fromEntries(cards)));
}

export function getFcCard(flashcardId: string, channel: string, difficulty: string): ReviewCard {
  const cards = getAllFcCards();
  return cards.get(flashcardId) ?? {
    questionId: flashcardId,
    channel,
    difficulty,
    interval: 0,
    easeFactor: DEFAULT_EASE_FACTOR,
    repetitions: 0,
    nextReview: new Date().toISOString().split('T')[0],
    lastReview: '',
    totalReviews: 0,
    correctStreak: 0,
    masteryLevel: 0,
  };
}

export function recordFcReview(
  flashcardId: string,
  channel: string,
  difficulty: string,
  rating: ConfidenceRating
): ReviewCard {
  const cards = getAllFcCards();
  const card = getFcCard(flashcardId, channel, difficulty);
  const { interval, easeFactor, repetitions } = calculateNextInterval(card, rating);
  const today = new Date().toISOString().split('T')[0];
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval);
  const updated: ReviewCard = {
    ...card,
    interval,
    easeFactor,
    repetitions,
    nextReview: nextDate.toISOString().split('T')[0],
    lastReview: today,
    totalReviews: card.totalReviews + 1,
    correctStreak: rating === 'again' ? 0 : card.correctStreak + 1,
    masteryLevel: 0,
  };
  updated.masteryLevel = calculateMasteryLevel(updated);
  cards.set(flashcardId, updated);
  saveFcCards(cards);
  updateReviewStreak();
  return updated;
}

export function getDueFcCards(): ReviewCard[] {
  const today = new Date().toISOString().split('T')[0];
  return Array.from(getAllFcCards().values())
    .filter(c => c.nextReview <= today)
    .sort((a, b) => a.nextReview.localeCompare(b.nextReview) || a.masteryLevel - b.masteryLevel);
}
