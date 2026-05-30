/**
 * Active Recall Hook
 * Provides access to parallel agent card generation system
 */

import { useState, useCallback } from 'react';
import { activeRecall, runParallelAgents, getDueRecallCards, getChannelRecallStats } from '../lib/active-recall';
import type { RecallCard, AgentResult, ChannelRecallStats, RecallType } from '../types/active-recall';
import type { Question } from '../types';

interface UseActiveRecallReturn {
  generateCardsForChannels: (
    channels: Array<{ id: string; name: string; questions: Question[] }>,
    onProgress?: (channelId: string, progress: number) => void
  ) => Promise<AgentResult[]>;
  generateCardsForChannel: (
    channelId: string,
    channelName: string,
    questions: Question[],
    onProgress?: (progress: number) => void
  ) => Promise<RecallCard[]>;
  getCards: (channelId?: string) => RecallCard[];
  getDueCards: (channelId?: string) => RecallCard[];
  getStats: (channelId: string) => ChannelRecallStats;
  isGenerating: boolean;
  generationProgress: number;
  error: string | null;
}

export function useActiveRecall(): UseActiveRecallReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const generateCardsForChannels = useCallback(async (
    channels: Array<{ id: string; name: string; questions: Question[] }>,
    onProgress?: (channelId: string, progress: number) => void
  ): Promise<AgentResult[]> => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setError(null);

    try {
      const results = await runParallelAgents(
        channels,
        { parallelAgents: 20 },
        (channelId: string, progress: number) => {
          setGenerationProgress(progress);
          onProgress?.(channelId, progress);
        }
      );

      // Add generated cards to storage
      for (const result of results) {
        if (result.cards.length > 0) {
          activeRecall.addRecallCards(result.cards);
        }
      }

      setGenerationProgress(100);
      return results;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate recall cards';
      setError(message);
      return [];
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const generateCardsForChannel = useCallback(async (
    channelId: string,
    channelName: string,
    questions: Question[],
    onProgress?: (progress: number) => void
  ): Promise<RecallCard[]> => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setError(null);

    try {
      const results = await runParallelAgents(
        [{ id: channelId, name: channelName, questions }],
        { parallelAgents: 1 },
        (_: string, progress: number) => {
          setGenerationProgress(progress);
          onProgress?.(progress);
        }
      );

      if (results.length > 0) {
        activeRecall.addRecallCards(results[0].cards);
        return results[0].cards;
      }

      return [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate recall cards';
      setError(message);
      return [];
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const getCards = useCallback((channelId?: string): RecallCard[] => {
    return channelId
      ? activeRecall.getRecallCardsByChannel(channelId)
      : activeRecall.getAllRecallCards();
  }, []);

  const getDueCards = useCallback((channelId?: string): RecallCard[] => {
    return activeRecall.getDueRecallCards(channelId);
  }, []);

  const getStats = useCallback((channelId: string): ChannelRecallStats => {
    return getChannelRecallStats(channelId);
  }, []);

  return {
    generateCardsForChannels,
    generateCardsForChannel,
    getCards,
    getDueCards,
    getStats,
    isGenerating,
    generationProgress,
    error,
  };
}

interface UseRecallSessionReturn {
  startSession: (channelId: string, cardCount?: number) => RecallCard[];
  cards: RecallCard[];
  dueCount: number;
  totalCount: number;
  stats: ChannelRecallStats | null;
}

export function useRecallSession(channelId?: string): UseRecallSessionReturn {
  const cards = channelId
    ? activeRecall.getRecallCardsByChannel(channelId)
    : activeRecall.getAllRecallCards();

  const dueCards = activeRecall.getDueRecallCards(channelId);
  const stats = channelId ? getChannelRecallStats(channelId) : null;

  const startSession = useCallback((chId: string, cardCount: number = 15): RecallCard[] => {
    const session = activeRecall.createRecallSession({
      channelId: chId,
      cardCount,
      shuffleCards: true,
    });
    return session.cards;
  }, []);

  return {
    startSession,
    cards,
    dueCount: dueCards.length,
    totalCount: cards.length,
    stats,
  };
}

interface UseRecallCardTypesReturn {
  cardTypes: RecallType[];
  selectCardType: (type: RecallType) => void;
  isSelected: (type: RecallType) => boolean;
  selectAll: () => void;
  selectNone: () => void;
}

const ALL_CARD_TYPES: RecallType[] = [
  'definition',
  'comparison',
  'process',
  'code',
  'concept',
  'troubleshooting',
  'best-practice',
  'formula',
];

export function useRecallCardTypes(defaultTypes?: RecallType[]): UseRecallCardTypesReturn {
  const [cardTypes, setCardTypes] = useState<RecallType[]>(
    defaultTypes || ALL_CARD_TYPES
  );

  const selectCardType = useCallback((type: RecallType) => {
    setCardTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  }, []);

  const isSelected = useCallback((type: RecallType): boolean => {
    return cardTypes.includes(type);
  }, [cardTypes]);

  const selectAll = useCallback(() => {
    setCardTypes([...ALL_CARD_TYPES]);
  }, []);

  const selectNone = useCallback(() => {
    setCardTypes([]);
  }, []);

  return {
    cardTypes,
    selectCardType,
    isSelected,
    selectAll,
    selectNone,
  };
}

export default useActiveRecall;