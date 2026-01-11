/**
 * Questions loader - fetches questions from static JSON files
 * Data is pre-generated at build time from Turso database
 */

import { api, QuestionService, ChannelService, StatsService } from '../services/api.service';
import { COMPANY_ALIASES, POPULAR_COMPANIES } from './constants';
import type { Question, ChannelDetailedStats } from '../types';

// Re-export Question type for backward compatibility
export type { Question };

// Base path for static data files
const DATA_BASE = import.meta.env.BASE_URL + 'data';

// In-memory cache for questions
const questionsCache = new Map<string, Question>();
const channelQuestionsCache = new Map<string, Question[]>();
let statsCache: ChannelDetailedStats[] | null = null;
let initialized = false;

// Track prefetched channels to avoid duplicate prefetches
const prefetchedChannels = new Set<string>();

// Related channels mapping for smart prefetching
const RELATED_CHANNELS: Record<string, string[]> = {
  'system-design': ['backend', 'database', 'devops', 'data-structures'],
  'algorithms': ['frontend', 'backend', 'system-design', 'data-structures', 'dynamic-programming'],
  'frontend': ['react-native', 'algorithms', 'backend'],
  'backend': ['database', 'system-design', 'devops', 'concurrency'],
  'database': ['backend', 'system-design', 'data-engineering'],
  'devops': ['kubernetes', 'aws', 'sre', 'terraform'],
  'kubernetes': ['devops', 'aws', 'sre'],
  'aws': ['devops', 'kubernetes', 'terraform'],
  'sre': ['devops', 'kubernetes', 'backend'],
  'generative-ai': ['machine-learning', 'llm-ops', 'prompt-engineering'],
  'machine-learning': ['generative-ai', 'nlp', 'computer-vision', 'math-logic'],
  // New CS Fundamentals channels
  'data-structures': ['algorithms', 'complexity-analysis', 'dynamic-programming'],
  'complexity-analysis': ['algorithms', 'data-structures', 'dynamic-programming'],
  'dynamic-programming': ['algorithms', 'data-structures', 'complexity-analysis'],
  'bit-manipulation': ['algorithms', 'low-level', 'concurrency'],
  'design-patterns': ['backend', 'system-design', 'concurrency'],
  'concurrency': ['backend', 'operating-systems', 'low-level'],
  'math-logic': ['algorithms', 'machine-learning', 'complexity-analysis'],
  'low-level': ['operating-systems', 'concurrency', 'security'],
};

// Load questions for a channel from static JSON
export async function loadChannelQuestions(channelId: string): Promise<Question[]> {
  if (channelQuestionsCache.has(channelId)) {
    return channelQuestionsCache.get(channelId)!;
  }

  try {
    const data = await ChannelService.getData(channelId);
    const questions = data.questions;
    channelQuestionsCache.set(channelId, questions);
    
    // Also cache individual questions
    for (const q of questions) {
      questionsCache.set(q.id, q);
    }
    
    return questions;
  } catch (error) {
    console.error(`Failed to load questions for channel ${channelId}:`, error);
    return [];
  }
}

// Get all questions (sync - from cache)
export function getAllQuestions(): Question[] {
  return Array.from(questionsCache.values());
}

// Get questions for a channel with optional filters
export function getQuestions(
  channelId: string,
  subChannel?: string,
  difficulty?: string,
  company?: string
): Question[] {
  let questions = channelQuestionsCache.get(channelId) || [];

  if (subChannel && subChannel !== 'all') {
    questions = questions.filter(q => q.subChannel === subChannel);
  }

  if (difficulty && difficulty !== 'all') {
    questions = questions.filter(q => q.difficulty === difficulty);
  }

  if (company && company !== 'all') {
    questions = questions.filter(q => q.companies?.includes(company));
  }

  return questions;
}

// Get a single question by ID (sync - from cache)
export function getQuestionById(questionId: string): Question | undefined {
  return questionsCache.get(questionId);
}

// Get a single question by ID (async - will fetch if needed)
export async function getQuestionByIdAsync(questionId: string): Promise<Question | null> {
  if (questionsCache.has(questionId)) {
    return questionsCache.get(questionId)!;
  }
  
  try {
    const question = await QuestionService.getById(questionId);
    questionsCache.set(question.id, question);
    return question;
  } catch {
    return null;
  }
}

// Get question IDs for a channel with optional filters
export function getQuestionIds(
  channelId: string,
  subChannel?: string,
  difficulty?: string
): string[] {
  return getQuestions(channelId, subChannel, difficulty).map(q => q.id);
}

// Get subchannels for a channel
export function getSubChannels(channelId: string): string[] {
  const questions = channelQuestionsCache.get(channelId) || [];
  const subChannels = new Set<string>();
  questions.forEach(q => {
    if (q.subChannel) {
      subChannels.add(q.subChannel);
    }
  });
  return Array.from(subChannels).sort();
}

// Get channel statistics
export function getChannelStats(): { id: string; total: number; beginner: number; intermediate: number; advanced: number }[] {
  if (statsCache) {
    return statsCache;
  }
  
  return Array.from(channelQuestionsCache.entries()).map(([channelId, questions]) => ({
    id: channelId,
    total: questions.length,
    beginner: questions.filter(q => q.difficulty === 'beginner').length,
    intermediate: questions.filter(q => q.difficulty === 'intermediate').length,
    advanced: questions.filter(q => q.difficulty === 'advanced').length
  }));
}

// Get available channel IDs
export function getAvailableChannelIds(): string[] {
  return Array.from(channelQuestionsCache.keys());
}

// Check if a channel has questions
export function channelHasQuestions(channelId: string): boolean {
  return (channelQuestionsCache.get(channelId)?.length || 0) > 0;
}

// Normalize company name for consistency
function normalizeCompanyName(name: string): string {
  const normalized = name.trim();
  const lower = normalized.toLowerCase();
  return COMPANY_ALIASES[lower] || normalized;
}

// Get all unique companies across all questions
export function getAllCompanies(): string[] {
  const companies = new Set<string>();
  questionsCache.forEach(q => {
    if (q.companies) {
      q.companies.forEach(c => companies.add(normalizeCompanyName(c)));
    }
  });
  return Array.from(companies).sort();
}

// Get companies for a specific channel
export function getCompaniesForChannel(channelId: string): string[] {
  const questions = channelQuestionsCache.get(channelId) || [];
  const companies = new Set<string>();
  questions.forEach(q => {
    if (q.companies) {
      q.companies.forEach(c => companies.add(normalizeCompanyName(c)));
    }
  });
  return Array.from(companies).sort();
}

// Get companies with counts for a channel
export function getCompaniesWithCounts(
  channelId: string,
  subChannel?: string,
  difficulty?: string
): { name: string; count: number }[] {
  let questions = channelQuestionsCache.get(channelId) || [];
  
  if (subChannel && subChannel !== 'all') {
    questions = questions.filter(q => q.subChannel === subChannel);
  }
  if (difficulty && difficulty !== 'all') {
    questions = questions.filter(q => q.difficulty === difficulty);
  }
  
  const companyCounts = new Map<string, number>();
  questions.forEach(q => {
    if (q.companies) {
      q.companies.forEach(c => {
        const normalized = normalizeCompanyName(c);
        companyCounts.set(normalized, (companyCounts.get(normalized) || 0) + 1);
      });
    }
  });
  
  return Array.from(companyCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

// Popular tech companies for prioritization in UI
export { POPULAR_COMPANIES };

/**
 * Prefetch related channels for faster navigation
 * Uses link prefetch hints to load JSON files in the background
 */
export function prefetchRelatedChannels(currentChannel: string): void {
  if (typeof window === 'undefined') return;
  
  // Get related channels
  const related = RELATED_CHANNELS[currentChannel] || [];
  
  // Also get channels from stats if available
  const allChannels = statsCache?.map(s => s.id) || [];
  
  // Combine related + nearby channels (limit to 3)
  const uniqueChannels = new Set([...related, ...allChannels]);
  const toPrefetch = Array.from(uniqueChannels)
    .filter(ch => ch !== currentChannel && !prefetchedChannels.has(ch) && !channelQuestionsCache.has(ch))
    .slice(0, 3);
  
  toPrefetch.forEach(channelId => {
    prefetchedChannels.add(channelId);
    
    // Use link prefetch for browser-native prefetching
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = `${DATA_BASE}/${channelId}.json`;
    link.as = 'fetch';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

/**
 * Preload a specific channel's data (higher priority than prefetch)
 */
export function preloadChannel(channelId: string): void {
  if (typeof window === 'undefined') return;
  if (channelQuestionsCache.has(channelId)) return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = `${DATA_BASE}/${channelId}.json`;
  link.as = 'fetch';
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

// Preload all questions (call on app init for search functionality)
export async function preloadQuestions(): Promise<void> {
  if (initialized) return;
  
  try {
    const stats = await StatsService.getAll();
    statsCache = stats;
    
    // Load all channels in parallel
    await Promise.all(
      stats.map(stat => loadChannelQuestions(stat.id))
    );
    
    initialized = true;
  } catch (error) {
    console.error('Failed to preload questions:', error);
  }
}

// Get all questions async
export async function getAllQuestionsAsync(): Promise<Question[]> {
  if (!initialized) {
    await preloadQuestions();
  }
  return getAllQuestions();
}

// Export API service for direct use
export { api };
