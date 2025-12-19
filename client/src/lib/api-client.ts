/**
 * API client for fetching questions from static JSON files (GitHub Pages)
 * Data is pre-generated at build time from Turso database
 */

// Base path for static data files
const DATA_BASE = import.meta.env.BASE_URL + 'data';

export interface Question {
  id: string;
  question: string;
  answer: string;
  explanation: string;
  diagram?: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  channel: string;
  subChannel: string;
  sourceUrl?: string;
  videos?: {
    shortVideo?: string;
    longVideo?: string;
  };
  companies?: string[];
  eli5?: string;
  lastUpdated?: string;
}

export interface QuestionListItem {
  id: string;
  difficulty: string;
  subChannel: string;
}

export interface ChannelStats {
  id: string;
  questionCount: number;
}

// Full channel metadata from DB
export interface ChannelMeta {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  roles: string[];
  questionCount: number;
}

export interface SubchannelMeta {
  id: string;
  name: string;
  tags: string[];
}

export interface ChannelDetailedStats {
  id: string;
  total: number;
  beginner: number;
  intermediate: number;
  advanced: number;
}

interface ChannelData {
  questions: Question[];
  subChannels: string[];
  companies: string[];
  stats: {
    total: number;
    beginner: number;
    intermediate: number;
    advanced: number;
  };
}

// Cache for channel metadata
const channelMetaCache: { data: ChannelMeta[] | null } = { data: null };
const subchannelMetaCache = new Map<string, SubchannelMeta[]>();

// Cache for loaded data
const channelCache = new Map<string, ChannelData>();
const statsCache: { data: ChannelDetailedStats[] | null } = { data: null };

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.json();
}

// Load channel data (questions, subchannels, companies)
async function loadChannelData(channelId: string): Promise<ChannelData> {
  if (channelCache.has(channelId)) {
    return channelCache.get(channelId)!;
  }

  const data = await fetchJson<ChannelData>(`${DATA_BASE}/${channelId}.json`);
  channelCache.set(channelId, data);
  return data;
}

// Get all channels with question counts (legacy)
export async function fetchChannels(): Promise<ChannelStats[]> {
  const data = await fetchJson<ChannelStats[]>(`${DATA_BASE}/channels.json`);
  return data;
}

// Get all channels with full metadata from DB
export async function fetchChannelsMeta(): Promise<ChannelMeta[]> {
  if (channelMetaCache.data) {
    return channelMetaCache.data;
  }
  
  try {
    // Try to load from static file first (for GitHub Pages)
    const data = await fetchJson<ChannelMeta[]>(`${DATA_BASE}/channels-meta.json`);
    channelMetaCache.data = data;
    return data;
  } catch {
    // Fallback to API (for dev server)
    const response = await fetch('/api/channels');
    if (!response.ok) throw new Error('Failed to fetch channels');
    const data = await response.json();
    channelMetaCache.data = data;
    return data;
  }
}

// Get channel metadata by ID
export async function fetchChannelMeta(channelId: string): Promise<ChannelMeta | null> {
  const channels = await fetchChannelsMeta();
  return channels.find(c => c.id === channelId) || null;
}

// Get subchannels with metadata for a channel
export async function fetchSubchannelsMeta(channelId: string): Promise<SubchannelMeta[]> {
  if (subchannelMetaCache.has(channelId)) {
    return subchannelMetaCache.get(channelId)!;
  }
  
  try {
    // Try static file first
    const data = await fetchJson<SubchannelMeta[]>(`${DATA_BASE}/${channelId}-subchannels.json`);
    subchannelMetaCache.set(channelId, data);
    return data;
  } catch {
    // Fallback to API
    const response = await fetch(`/api/channel/${channelId}/subchannels`);
    if (!response.ok) return [];
    const data = await response.json();
    subchannelMetaCache.set(channelId, data);
    return data;
  }
}

// Get question IDs for a channel with optional filters
export async function fetchQuestionIds(
  channelId: string,
  subChannel?: string,
  difficulty?: string
): Promise<QuestionListItem[]> {
  const data = await loadChannelData(channelId);
  
  let questions = data.questions;
  
  if (subChannel && subChannel !== 'all') {
    questions = questions.filter(q => q.subChannel === subChannel);
  }
  
  if (difficulty && difficulty !== 'all') {
    questions = questions.filter(q => q.difficulty === difficulty);
  }
  
  return questions.map(q => ({
    id: q.id,
    difficulty: q.difficulty,
    subChannel: q.subChannel
  }));
}

// Get a single question by ID
export async function fetchQuestion(questionId: string): Promise<Question> {
  // Find which channel has this question
  const channels = await fetchChannels();
  
  for (const channel of channels) {
    try {
      const data = await loadChannelData(channel.id);
      const question = data.questions.find(q => q.id === questionId);
      if (question) {
        return question;
      }
    } catch {
      // Channel file might not exist, continue
    }
  }
  
  throw new Error(`Question not found: ${questionId}`);
}

// Get a random question
export async function fetchRandomQuestion(
  channel?: string,
  difficulty?: string
): Promise<Question> {
  let questions: Question[] = [];
  
  if (channel && channel !== 'all') {
    const data = await loadChannelData(channel);
    questions = data.questions;
  } else {
    // Load all channels
    const channels = await fetchChannels();
    for (const ch of channels) {
      try {
        const data = await loadChannelData(ch.id);
        questions.push(...data.questions);
      } catch {
        // Continue if channel fails
      }
    }
  }
  
  if (difficulty && difficulty !== 'all') {
    questions = questions.filter(q => q.difficulty === difficulty);
  }
  
  if (questions.length === 0) {
    throw new Error('No questions found');
  }
  
  const randomIndex = Math.floor(Math.random() * questions.length);
  return questions[randomIndex];
}

// Get channel statistics
export async function fetchStats(): Promise<ChannelDetailedStats[]> {
  if (statsCache.data) {
    return statsCache.data;
  }
  
  const channels = await fetchChannels();
  const stats: ChannelDetailedStats[] = [];
  
  for (const channel of channels) {
    try {
      const data = await loadChannelData(channel.id);
      stats.push({
        id: channel.id,
        total: data.stats.total,
        beginner: data.stats.beginner,
        intermediate: data.stats.intermediate,
        advanced: data.stats.advanced
      });
    } catch {
      // Skip if channel fails
    }
  }
  
  statsCache.data = stats;
  return stats;
}

// Get subchannels for a channel
export async function fetchSubChannels(channelId: string): Promise<string[]> {
  const data = await loadChannelData(channelId);
  return data.subChannels;
}

// Get companies for a channel
export async function fetchCompanies(channelId: string): Promise<string[]> {
  const data = await loadChannelData(channelId);
  return data.companies;
}

// Clear cache (useful for forcing refresh)
export function clearCache(): void {
  channelCache.clear();
  statsCache.data = null;
  channelMetaCache.data = null;
  subchannelMetaCache.clear();
}

// Get all questions for a channel (full data)
export async function fetchChannelQuestions(channelId: string): Promise<Question[]> {
  const data = await loadChannelData(channelId);
  return data.questions;
}
