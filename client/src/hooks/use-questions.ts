import { useState, useEffect, useMemo } from 'react';
import {
  getQuestions,
  getQuestionById,
  getSubChannels,
  getCompaniesForChannel,
  getCompaniesWithCounts,
  loadChannelQuestions,
  api,
} from '../lib/questions-loader';
import type { Question } from '../types';

// Seeded random for consistent shuffle per session
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

// Shuffle array with seed for consistency
function shuffleArray<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Get or create a stable session seed for a channel
function getSessionSeed(channelId: string): number {
  const key = `shuffle-seed-${channelId}`;
  const stored = sessionStorage.getItem(key);
  if (stored) {
    return parseInt(stored, 10);
  }
  const seed = Date.now();
  sessionStorage.setItem(key, seed.toString());
  return seed;
}

// Get completed question IDs for a channel
function getCompletedIds(channelId: string): Set<string> {
  try {
    const stored = localStorage.getItem(`progress-${channelId}`);
    return new Set(stored ? JSON.parse(stored) : []);
  } catch {
    return new Set();
  }
}

// Hook to get questions for a channel with filters
export function useQuestions(
  channelId: string,
  subChannel: string = 'all',
  difficulty: string = 'all',
  company: string = 'all',
  shuffle: boolean = true,
  prioritizeUnvisited: boolean = true
) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Get stable session seed for this channel
  const sessionSeed = useMemo(() => channelId ? getSessionSeed(channelId) : 0, [channelId]);

  useEffect(() => {
    if (!channelId) {
      setQuestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Try to get from cache first
    let cached = getQuestions(channelId, subChannel, difficulty, company);
    if (cached.length > 0) {
      const processed = processQuestions(cached, channelId, shuffle, prioritizeUnvisited, sessionSeed);
      setQuestions(processed);
      setLoading(false);
      return;
    }

    // Load from API
    loadChannelQuestions(channelId)
      .then(() => {
        const filtered = getQuestions(channelId, subChannel, difficulty, company);
        const processed = processQuestions(filtered, channelId, shuffle, prioritizeUnvisited, sessionSeed);
        setQuestions(processed);
      })
      .catch((err: Error) => {
        setError(err);
        setQuestions([]);
      })
      .finally(() => setLoading(false));
  }, [channelId, subChannel, difficulty, company, shuffle, prioritizeUnvisited, sessionSeed]);

  const questionIds = useMemo(() => questions.map(q => q.id), [questions]);

  return {
    questions,
    questionIds,
    totalQuestions: questions.length,
    loading,
    error,
  };
}

// Process questions: shuffle and prioritize unvisited
function processQuestions(
  questions: Question[],
  channelId: string,
  shuffle: boolean,
  prioritizeUnvisited: boolean,
  seed: number
): Question[] {
  let result = [...questions];
  
  if (shuffle) {
    result = shuffleArray(result, seed);
  }
  
  if (prioritizeUnvisited) {
    const completedIds = getCompletedIds(channelId);
    const unvisited = result.filter(q => !completedIds.has(q.id));
    const visited = result.filter(q => completedIds.has(q.id));
    result = [...unvisited, ...visited];
  }
  
  return result;
}

// Hook to get companies for a channel (simple list)
export function useCompanies(channelId: string) {
  const [companies, setCompanies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!channelId) {
      setCompanies([]);
      setLoading(false);
      return;
    }

    // Try cache first
    const cached = getCompaniesForChannel(channelId);
    if (cached.length > 0) {
      setCompanies(cached);
      setLoading(false);
      return;
    }

    // Load from API
    api.channels.getCompanies(channelId)
      .then(setCompanies)
      .catch((err: Error) => {
        setError(err);
        setCompanies([]);
      })
      .finally(() => setLoading(false));
  }, [channelId]);

  return {
    companies,
    loading,
    error,
  };
}

// Hook to get companies with counts (respects current filters)
export function useCompaniesWithCounts(
  channelId: string,
  subChannel: string = 'all',
  difficulty: string = 'all'
) {
  const companiesWithCounts = useMemo(() => {
    if (!channelId) return [];
    return getCompaniesWithCounts(channelId, subChannel, difficulty);
  }, [channelId, subChannel, difficulty]);

  return {
    companiesWithCounts,
    loading: false,
    error: null,
  };
}

// Hook to get a single question by ID
export function useQuestion(questionId: string | undefined) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!questionId) {
      setQuestion(null);
      setLoading(false);
      return;
    }

    // Try cache first
    const cached = getQuestionById(questionId);
    if (cached) {
      setQuestion(cached);
      setLoading(false);
      return;
    }

    // Load from API
    setLoading(true);
    api.questions.getById(questionId)
      .then(setQuestion)
      .catch((err: Error) => {
        setError(err);
        setQuestion(null);
      })
      .finally(() => setLoading(false));
  }, [questionId]);

  return { 
    question, 
    loading, 
    error 
  };
}

// Combined hook for question navigation with current question
export function useQuestionsWithPrefetch(
  channelId: string,
  currentIndex: number,
  subChannel: string = 'all',
  difficulty: string = 'all',
  company: string = 'all',
  shuffle: boolean = true,
  prioritizeUnvisited: boolean = true
) {
  const { questions, questionIds, totalQuestions, loading, error } = useQuestions(
    channelId,
    subChannel,
    difficulty,
    company,
    shuffle,
    prioritizeUnvisited
  );

  const currentQuestion = useMemo(() => {
    if (currentIndex >= 0 && currentIndex < questions.length) {
      return questions[currentIndex];
    }
    return null;
  }, [questions, currentIndex]);

  return {
    question: currentQuestion,
    questions,
    questionIds,
    totalQuestions,
    loading,
    error
  };
}

// Hook to get subchannels for a channel
export function useSubChannels(channelId: string) {
  const [subChannels, setSubChannels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!channelId) {
      setSubChannels([]);
      setLoading(false);
      return;
    }

    // Try cache first
    const cached = getSubChannels(channelId);
    if (cached.length > 0) {
      setSubChannels(cached);
      setLoading(false);
      return;
    }

    // Load from API
    api.channels.getSubChannels(channelId)
      .then(setSubChannels)
      .catch((err: Error) => {
        setError(err);
        setSubChannels([]);
      })
      .finally(() => setLoading(false));
  }, [channelId]);

  return { 
    subChannels, 
    loading, 
    error 
  };
}
