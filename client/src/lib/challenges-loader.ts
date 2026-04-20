import type { Challenge, ChallengeListItem } from '../types/challenges';

const cache = new Map<string, unknown>();

async function fetchCached<T>(url: string): Promise<T> {
  if (cache.has(url)) return cache.get(url) as T;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const data = await res.json();
  cache.set(url, data);
  return data;
}

export function loadChallenge(id: string): Promise<Challenge> {
  return fetchCached<Challenge>(`/challenges/${id}.json`);
}

export async function loadChallengeIndex(): Promise<string[]> {
  const data = await fetchCached<{ challenges: string[] } | string[]>('/challenges/index.json');
  return Array.isArray(data) ? data : data.challenges;
}

export async function loadAllChallenges(): Promise<ChallengeListItem[]> {
  const ids = await loadChallengeIndex();
  const challenges = await Promise.all(ids.map(loadChallenge));
  return challenges.map(({ id, title, difficulty, tags, estimatedMinutes }) => ({
    id, title, difficulty, tags, estimatedMinutes,
  }));
}
