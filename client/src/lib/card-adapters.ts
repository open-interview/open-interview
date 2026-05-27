import type { Question } from '../types';
import type { DbFlashcard } from '../services/api.service';
import type { SwipeCard } from '../types/swipe';
import type { ReviewCard } from './spaced-repetition';

export function questionToSwipeCard(q: Question, srsState: ReviewCard): SwipeCard {
  return {
    id: q.id,
    type: 'question',
    mode: srsState.masteryLevel >= 3 ? 'feynman' : 'recall',
    front: q.question,
    back: q.answer,
    hint: q.tldr ?? undefined,
    diagram: q.diagram ?? undefined,
    codeExample: undefined,
    channel: q.channel,
    subChannel: q.subChannel,
    difficulty: q.difficulty,
    tags: q.tags,
    sourceQuestionId: q.id,
    interval: srsState.interval,
    easeFactor: srsState.easeFactor,
    repetitions: srsState.repetitions,
    nextReview: srsState.nextReview,
    masteryLevel: srsState.masteryLevel,
  };
}

export function flashcardToSwipeCard(fc: DbFlashcard, srsState: ReviewCard): SwipeCard {
  return {
    id: fc.id,
    type: 'flashcard',
    mode: 'recall',
    front: fc.front,
    back: fc.back,
    hint: fc.hint ?? undefined,
    mnemonic: fc.mnemonic ?? undefined,
    channel: fc.channel ?? 'general',
    difficulty: 'intermediate',
    tags: fc.tags ?? [],
    interval: srsState.interval,
    easeFactor: srsState.easeFactor,
    repetitions: srsState.repetitions,
    nextReview: srsState.nextReview,
    masteryLevel: srsState.masteryLevel,
  };
}
