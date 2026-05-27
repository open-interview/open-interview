import { useState, useCallback, useMemo } from 'react';
import type { SwipeCard } from '@/types/swipe';

interface UseStudySessionReturn {
  currentCard: SwipeCard | null;
  currentIndex: number;
  cards: SwipeCard[];
  reviewedIds: string[];
  isLoading: boolean;
  goToIndex: (index: number) => void;
  advance: () => void;
  undo: () => void;
  reset: () => void;
  loadCards: (cards: SwipeCard[]) => void;
  setCurrentIndex: (index: number) => void;
}

export function useStudySession(): UseStudySessionReturn {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [queue, setQueue] = useState<SwipeCard[]>([]);
  const [reviewedIds, setReviewedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const currentCard = useMemo(
    () => (currentIndex < queue.length ? queue[currentIndex] : null),
    [currentIndex, queue]
  );

  const advance = useCallback(() => {
    const card = queue[currentIndex];
    if (!card) return;

    setReviewedIds(prev => [...prev, card.id]);
    setCurrentIndex(prev => prev + 1);
  }, [queue, currentIndex]);

  const undo = useCallback(() => {
    if (currentIndex === 0) return;
    setCurrentIndex(prev => prev - 1);
    setReviewedIds(prev => prev.slice(0, -1));
  }, [currentIndex]);

  const goToIndex = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, queue.length - 1));
    setCurrentIndex(clamped);
  }, [queue.length]);

  const loadCards = useCallback((newCards: SwipeCard[]) => {
    setQueue(newCards);
    setCurrentIndex(0);
    setReviewedIds([]);
    setIsLoading(false);
  }, []);

  const reset = useCallback(() => {
    setQueue([]);
    setCurrentIndex(0);
    setReviewedIds([]);
  }, []);

  return {
    currentCard,
    currentIndex,
    cards: queue,
    reviewedIds,
    isLoading,
    goToIndex,
    advance,
    undo,
    reset,
    loadCards,
    setCurrentIndex,
  };
}
