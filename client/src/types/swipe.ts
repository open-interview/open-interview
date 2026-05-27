export type SwipeCardType = 'question' | 'flashcard' | 'custom';
export type CardMode = 'recall' | 'feynman' | 'palace' | 'standard';
export type SwipeDirection = 'left' | 'right' | 'up' | 'down';
export type FeynmanRating = 'again' | 'hard' | 'easy';

export interface SwipeCard {
  id: string;
  type: SwipeCardType;
  mode: CardMode;
  front: string;
  back: string;
  hint?: string;
  mnemonic?: string;
  palaceImage?: string;
  codeExample?: string;
  diagram?: string;
  channel: string;
  subChannel?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  sourceQuestionId?: string;
  interval: number;
  easeFactor: number;
  repetitions: number;
  nextReview: string;
  masteryLevel: number;
}

export interface StudySession {
  filter: FilterState;
  queue: SwipeCard[];
  currentIndex: number;
  reviewedIds: string[];
  startedAt: string;
}

export interface FilterState {
  scope: 'all' | 'topic' | 'cert' | 'custom';
  channelId?: string;
  certId?: string;
  mode: 'due' | 'browse' | 'new';
  cardType: 'all' | 'questions' | 'flashcards' | 'custom';
  pendingEnrollment?: boolean;
}

export interface FeynmanAttempt {
  cardId: string;
  attempt: string;
  timestamp: string;
  rating: FeynmanRating;
  sourceQuestionId?: string;
  channel?: string;
  subChannel?: string;
}

export interface CustomCardData {
  id: string;
  front: string;
  back: string;
  hint: string;
  palaceScene: string;
  channel: string;
  tags: string[];
  createdAt: string;
}
