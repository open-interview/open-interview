/**
 * Recommendation Service
 * 
 * Analyzes user activity and question history to provide personalized recommendations:
 * - Suggests next questions based on user's interests
 * - Notifies about new questions in channels/certifications user has engaged with
 * - Tracks channel visit frequency and engagement patterns
 */

import { STORAGE_KEYS } from '../lib/constants';
import { ProgressStorage, ActivityStorage } from './storage.service';
import type { HistoryIndex, HistorySummary } from '../components/unified/QuestionHistory';

// ============================================
// TYPES
// ============================================

export interface ChannelEngagement {
  channelId: string;
  visitCount: number;
  lastVisited: string;
  completedCount: number;
  markedCount: number;
}

export interface NewQuestionAlert {
  questionId: string;
  channelId: string;
  createdAt: string;
  questionType: 'question' | 'coding';
}

export interface Recommendation {
  type: 'continue' | 'new_content' | 'explore' | 'review';
  channelId: string;
  channelName?: string;
  reason: string;
  priority: number;
  questionIds?: string[];
  newCount?: number;
}

export interface UserEngagementData {
  channels: Record<string, ChannelEngagement>;
  lastGlobalVisit: string;
  totalVisits: number;
}

// Storage key for engagement tracking
const ENGAGEMENT_KEY = 'user-engagement-data';
const LAST_CHECK_KEY = 'last-new-content-check';

// ============================================
// ENGAGEMENT TRACKING
// ============================================

function getEngagementData(): UserEngagementData {
  if (typeof window === 'undefined') {
    return { channels: {}, lastGlobalVisit: new Date().toISOString(), totalVisits: 0 };
  }
  
  try {
    const stored = localStorage.getItem(ENGAGEMENT_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load engagement data:', e);
  }
  
  return { channels: {}, lastGlobalVisit: new Date().toISOString(), totalVisits: 0 };
}

function saveEngagementData(data: UserEngagementData): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(ENGAGEMENT_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save engagement data:', e);
  }
}

// ============================================
// PUBLIC API
// ============================================

export const RecommendationService = {
  /**
   * Track a channel visit - call this when user views a channel
   */
  trackChannelVisit(channelId: string): void {
    const data = getEngagementData();
    const now = new Date().toISOString();
    
    if (!data.channels[channelId]) {
      data.channels[channelId] = {
        channelId,
        visitCount: 0,
        lastVisited: now,
        completedCount: 0,
        markedCount: 0,
      };
    }
    
    data.channels[channelId].visitCount++;
    data.channels[channelId].lastVisited = now;
    data.lastGlobalVisit = now;
    data.totalVisits++;
    
    // Sync completed/marked counts from progress storage
    data.channels[channelId].completedCount = ProgressStorage.getCompleted(channelId).length;
    data.channels[channelId].markedCount = ProgressStorage.getMarked(channelId).length;
    
    saveEngagementData(data);
  },

  /**
   * Get user's most engaged channels (sorted by engagement score)
   */
  getTopChannels(limit: number = 5): ChannelEngagement[] {
    const data = getEngagementData();
    
    return Object.values(data.channels)
      .map(ch => ({
        ...ch,
        // Calculate engagement score
        score: ch.visitCount * 2 + ch.completedCount * 3 + ch.markedCount * 1
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  },

  /**
   * Find new questions added since user's last visit to each channel
   */
  async findNewQuestions(historyIndex: HistoryIndex | null): Promise<NewQuestionAlert[]> {
    if (!historyIndex) return [];
    
    const data = getEngagementData();
    const newQuestions: NewQuestionAlert[] = [];
    
    // Get all engaged channels
    const engagedChannels = Object.keys(data.channels);
    if (engagedChannels.length === 0) return [];
    
    // Check each question in the history index
    for (const [questionId, summary] of Object.entries(historyIndex.questions)) {
      const createdAt = summary.latestEvent?.createdAt;
      if (!createdAt) continue;
      
      // Extract channel from question ID pattern (e.g., "q-123" doesn't have channel, need to check data)
      // For now, we'll track all new questions and filter by channel when displaying
      const questionDate = new Date(createdAt);
      
      // Check if this question was created after user's last global visit
      const lastVisit = new Date(data.lastGlobalVisit);
      if (questionDate > lastVisit) {
        newQuestions.push({
          questionId,
          channelId: '', // Will be populated when we have channel data
          createdAt,
          questionType: summary.questionType === 'coding' ? 'coding' : 'question',
        });
      }
    }
    
    return newQuestions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  /**
   * Generate personalized recommendations based on user activity
   */
  async generateRecommendations(
    historyIndex: HistoryIndex | null,
    channelQuestionCounts: Record<string, number>
  ): Promise<Recommendation[]> {
    const data = getEngagementData();
    const recommendations: Recommendation[] = [];
    const topChannels = this.getTopChannels(10);
    
    // 1. Continue where you left off
    for (const channel of topChannels.slice(0, 3)) {
      const completed = ProgressStorage.getCompleted(channel.channelId);
      const totalQuestions = channelQuestionCounts[channel.channelId] || 0;
      
      if (totalQuestions > 0 && completed.length < totalQuestions) {
        const progress = Math.round((completed.length / totalQuestions) * 100);
        recommendations.push({
          type: 'continue',
          channelId: channel.channelId,
          reason: `Continue your progress (${progress}% complete)`,
          priority: 100 - progress, // Higher priority for less complete channels
        });
      }
    }
    
    // 2. New content in your channels
    if (historyIndex) {
      const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
      const lastCheckDate = lastCheck ? new Date(lastCheck) : new Date(0);
      
      for (const channel of topChannels) {
        let newCount = 0;
        
        // Count questions created after last check
        for (const [, summary] of Object.entries(historyIndex.questions)) {
          const createdAt = summary.latestEvent?.createdAt;
          if (createdAt && new Date(createdAt) > lastCheckDate) {
            newCount++;
          }
        }
        
        if (newCount > 0) {
          recommendations.push({
            type: 'new_content',
            channelId: channel.channelId,
            reason: `${newCount} new question${newCount > 1 ? 's' : ''} added`,
            priority: 90,
            newCount,
          });
        }
      }
      
      // Update last check time
      localStorage.setItem(LAST_CHECK_KEY, new Date().toISOString());
    }
    
    // 3. Review marked questions
    for (const channel of topChannels) {
      const marked = ProgressStorage.getMarked(channel.channelId);
      if (marked.length > 0) {
        recommendations.push({
          type: 'review',
          channelId: channel.channelId,
          reason: `${marked.length} question${marked.length > 1 ? 's' : ''} marked for review`,
          priority: 70,
          questionIds: marked,
        });
      }
    }
    
    // 4. Explore related channels
    const relatedChannels: Record<string, string[]> = {
      'system-design': ['backend', 'database', 'devops'],
      'algorithms': ['data-structures', 'dynamic-programming'],
      'frontend': ['react-native', 'testing'],
      'backend': ['database', 'system-design', 'devops'],
      'aws': ['aws-saa', 'aws-dva', 'terraform'],
      'kubernetes': ['cka', 'ckad', 'devops'],
      'machine-learning': ['generative-ai', 'nlp', 'computer-vision'],
    };
    
    const visitedChannelIds = new Set(topChannels.map(c => c.channelId));
    const suggestedExplore = new Set<string>();
    
    for (const channel of topChannels.slice(0, 3)) {
      const related = relatedChannels[channel.channelId] || [];
      for (const relatedId of related) {
        if (!visitedChannelIds.has(relatedId) && !suggestedExplore.has(relatedId)) {
          suggestedExplore.add(relatedId);
          recommendations.push({
            type: 'explore',
            channelId: relatedId,
            reason: `Related to ${channel.channelId}`,
            priority: 50,
          });
        }
      }
    }
    
    // Sort by priority and limit
    return recommendations
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 8);
  },

  /**
   * Get engagement summary for display
   */
  getEngagementSummary(): {
    totalChannelsVisited: number;
    totalQuestionsCompleted: number;
    currentStreak: number;
    topChannel: string | null;
  } {
    const data = getEngagementData();
    const channels = Object.values(data.channels);
    
    return {
      totalChannelsVisited: channels.length,
      totalQuestionsCompleted: channels.reduce((sum, ch) => sum + ch.completedCount, 0),
      currentStreak: ActivityStorage.getStreak(),
      topChannel: channels.length > 0 
        ? channels.sort((a, b) => b.visitCount - a.visitCount)[0].channelId 
        : null,
    };
  },

  /**
   * Clear all engagement data (for testing/reset)
   */
  clearEngagementData(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ENGAGEMENT_KEY);
    localStorage.removeItem(LAST_CHECK_KEY);
  },
};

export default RecommendationService;
