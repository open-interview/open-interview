import { nanoid } from 'nanoid';
import type {
  RecallCard,
  AgentResult,
  ChannelRecallStats,
  SessionConfig,
  RecallSession,
  RecallType,
} from '../types/active-recall';
import type { Question } from '../types';

const STORAGE_KEY = 'active_recall_cards';

function loadCards(): RecallCard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RecallCard[]) : [];
  } catch {
    return [];
  }
}

function saveCards(cards: RecallCard[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  } catch {
    // storage quota or private mode — silently ignore
  }
}

class ActiveRecallService {
  getAllRecallCards(): RecallCard[] {
    return loadCards();
  }

  getRecallCardsByChannel(channelId: string): RecallCard[] {
    return loadCards().filter((c) => c.channelId === channelId);
  }

  getDueRecallCards(channelId?: string): RecallCard[] {
    const now = new Date().toISOString();
    return loadCards().filter(
      (c) =>
        (!channelId || c.channelId === channelId) &&
        (!c.lastReviewed || c.lastReviewed <= now)
    );
  }

  addRecallCards(cards: RecallCard[]) {
    const existing = loadCards();
    const existingIds = new Set(existing.map((c) => c.id));
    const newCards = cards.filter((c) => !existingIds.has(c.id));
    saveCards([...existing, ...newCards]);
  }

  createRecallSession(config: SessionConfig): RecallSession {
    let cards = config.channelId
      ? this.getRecallCardsByChannel(config.channelId)
      : this.getAllRecallCards();

    if (config.shuffleCards) {
      cards = [...cards].sort(() => Math.random() - 0.5);
    }

    cards = cards.slice(0, config.cardCount);

    return {
      id: nanoid(),
      channelId: config.channelId,
      cards,
      startedAt: new Date().toISOString(),
      score: 0,
      totalCards: cards.length,
    };
  }

  recordReview(cardId: string, correct: boolean) {
    const cards = loadCards().map((c) => {
      if (c.id !== cardId) return c;
      return {
        ...c,
        lastReviewed: new Date().toISOString(),
        streak: correct ? c.streak + 1 : 0,
        confidence: correct
          ? Math.min(1, c.confidence + 0.1)
          : Math.max(0, c.confidence - 0.2),
      };
    });
    saveCards(cards);
  }
}

export const activeRecall = new ActiveRecallService();

export function getDueRecallCards(channelId?: string): RecallCard[] {
  return activeRecall.getDueRecallCards(channelId);
}

export function getChannelRecallStats(channelId: string): ChannelRecallStats {
  const cards = activeRecall.getRecallCardsByChannel(channelId);
  const dueCards = activeRecall.getDueRecallCards(channelId);
  const mastered = cards.filter((c) => c.confidence >= 0.8);
  const lastReviewed = cards
    .map((c) => c.lastReviewed)
    .filter(Boolean)
    .sort()
    .pop() ?? null;
  const streak = cards.length > 0 ? Math.min(...cards.map((c) => c.streak)) : 0;

  return {
    channelId,
    totalCards: cards.length,
    masteredCards: mastered.length,
    learningCards: cards.length - mastered.length,
    dueToday: dueCards.length,
    lastSession: lastReviewed ?? null,
    streak,
  };
}

export function recordRecallReview(cardId: string, correct: boolean, _timeSpent?: number) {
  activeRecall.recordReview(cardId, correct);
}

export async function runParallelAgents(
  channels: Array<{ id: string; name: string; questions: Question[] }>,
  config: { parallelAgents?: number },
  onProgress?: (channelId: string, progress: number) => void
): Promise<AgentResult[]> {
  const results: AgentResult[] = [];

  for (const channel of channels) {
    const start = Date.now();
    try {
      const cards: RecallCard[] = channel.questions.slice(0, 10).map((q, i) => ({
        id: nanoid(),
        channelId: channel.id,
        type: 'concept' as RecallType,
        question: q.question ?? `Question ${i + 1}`,
        answer: q.answer ?? '',
        explanation: q.answer ?? '',
        difficulty: 'intermediate' as const,
        tags: q.tags ?? [],
        sourceQuestionId: q.id ?? nanoid(),
        confidence: 0.5,
        streak: 0,
      }));

      onProgress?.(channel.id, 100);
      results.push({
        agentId: nanoid(),
        channelId: channel.id,
        cards,
        errors: [],
        duration: Date.now() - start,
        success: true,
      });
    } catch (err) {
      results.push({
        agentId: nanoid(),
        channelId: channel.id,
        cards: [],
        errors: [err instanceof Error ? err.message : String(err)],
        duration: Date.now() - start,
        success: false,
      });
    }
  }

  return results;
}
