import { useState } from 'react';
import type { ConfidenceRating } from '../lib/spaced-repetition';

export type RecallSurface = 'question-viewer' | 'answer-panel' | 'flashcard';

export interface RecallEvent {
  questionId: string;
  surface: RecallSurface;
  confidence: ConfidenceRating;
  timestamp: number;
}

const SESSION_KEY = 'open-interview-recall-session';

function loadEvents(): RecallEvent[] {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function useRecallSession() {
  const [events, setEvents] = useState<RecallEvent[]>(loadEvents);

  const addEvent = (event: Omit<RecallEvent, 'timestamp'>) => {
    const newEvent: RecallEvent = { ...event, timestamp: Date.now() };
    setEvents(prev => {
      const updated = [...prev, newEvent];
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
      } catch {
        // ignore storage errors
      }
      return updated;
    });
  };

  const stats = {
    total: events.length,
    byConfidence: {
      again: events.filter(e => e.confidence === 'again').length,
      hard:  events.filter(e => e.confidence === 'hard').length,
      good:  events.filter(e => e.confidence === 'good').length,
      easy:  events.filter(e => e.confidence === 'easy').length,
    },
  };

  return { events, addEvent, stats };
}
