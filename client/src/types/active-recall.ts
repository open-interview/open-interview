/**
 * Active Recall System
 * Parallel agent architecture for generating recall cards from question content
 * Each channel gets its own agent for distributed processing
 */

import type { Question } from '../types';

export interface RecallCard {
  id: string;
  channelId: string;
  type: RecallType;
  question: string;
  hint?: string;
  answer: string;
  explanation: string;
  codeExample?: string;
  diagram?: string;
  relatedConcept?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  sourceQuestionId: string;
  confidence: number;
  lastReviewed?: string;
  streak: number;
}

export type RecallType =
  | 'definition'
  | 'comparison'
  | 'process'
  | 'code'
  | 'concept'
  | 'troubleshooting'
  | 'best-practice'
  | 'formula';

export interface RecallSession {
  id: string;
  channelId: string;
  cards: RecallCard[];
  startedAt: string;
  completedAt?: string;
  score: number;
  totalCards: number;
}

export interface AgentResult {
  agentId: string;
  channelId: string;
  cards: RecallCard[];
  errors: string[];
  duration: number;
  success: boolean;
}

export interface ActiveRecallConfig {
  maxCardsPerChannel: number;
  parallelAgents: number;
  cardTypes: RecallType[];
  difficultyDistribution: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
}

/**
 * Core types for recall generation
 */
export interface RecallPrompt {
  channelId: string;
  channelName: string;
  questions: Question[];
  cardType: RecallType;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface GeneratedRecall {
  question: string;
  answer: string;
  explanation: string;
  hint?: string;
  codeExample?: string;
  type: RecallType;
  relatedConcept?: string;
  tags: string[];
}

/**
 * Agent task for parallel processing
 */
export interface AgentTask {
  taskId: string;
  agentId: string;
  channelId: string;
  questions: Question[];
  cardTypes: RecallType[];
  onProgress?: (progress: number) => void;
}

/**
 * Channel recall stats
 */
export interface ChannelRecallStats {
  channelId: string;
  totalCards: number;
  masteredCards: number;
  learningCards: number;
  dueToday: number;
  lastSession: string | null;
  streak: number;
}

/**
 * Review result for tracking progress
 */
export interface ReviewResult {
  cardId: string;
  correct: boolean;
  timeSpent: number;
  timestamp: string;
}

/**
 * Session configuration
 */
export interface SessionConfig {
  channelId: string;
  cardCount: number;
  cardTypes?: RecallType[];
  difficultyFilter?: ('beginner' | 'intermediate' | 'advanced')[];
  timeLimit?: number;
  shuffleCards: boolean;
}