export interface ChallengeProgress {
  challengeId: string;
  status: 'unsolved' | 'attempted' | 'solved';
  attempts: number;
  lastAttemptAt: string;
  solvedAt?: string;
  language: string;
  timeSpentMs: number;
}

export interface UserProgress {
  challenges: Record<string, ChallengeProgress>;
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string;
  badges: string[];
  totalSolved: number;
  totalAttempted: number;
}

const STORAGE_KEY = 'challenge_progress';

const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 3000];

function xpToLevel(xp: number): number {
  let level = 0;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) { level = i; break; }
  }
  return level;
}

const DEFAULT_PROGRESS: UserProgress = {
  challenges: {},
  xp: 0,
  level: 0,
  streak: 0,
  lastActiveDate: '',
  badges: [],
  totalSolved: 0,
  totalAttempted: 0,
};

export function getProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_PROGRESS, ...JSON.parse(raw) } : { ...DEFAULT_PROGRESS };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export function saveProgress(progress: UserProgress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function getChallengeProgress(id: string): ChallengeProgress | null {
  return getProgress().challenges[id] ?? null;
}

export function markAttempted(id: string, language: string): void {
  const p = getProgress();
  const existing = p.challenges[id];
  const isNew = !existing || existing.status === 'unsolved';
  p.challenges[id] = {
    challengeId: id,
    status: existing?.status === 'solved' ? 'solved' : 'attempted',
    attempts: (existing?.attempts ?? 0) + 1,
    lastAttemptAt: new Date().toISOString(),
    solvedAt: existing?.solvedAt,
    language,
    timeSpentMs: existing?.timeSpentMs ?? 0,
  };
  if (isNew) p.totalAttempted++;
  saveProgress(p);
}

export function markSolved(id: string, language: string, timeMs: number, xpEarned: number): void {
  const p = getProgress();
  const existing = p.challenges[id];
  const wasAlreadySolved = existing?.status === 'solved';
  const wasAttempted = existing?.status === 'attempted';
  const now = new Date().toISOString();
  p.challenges[id] = {
    challengeId: id,
    status: 'solved',
    attempts: (existing?.attempts ?? 0) + 1,
    lastAttemptAt: now,
    solvedAt: existing?.solvedAt ?? now,
    language,
    timeSpentMs: (existing?.timeSpentMs ?? 0) + timeMs,
  };
  if (!wasAlreadySolved) {
    p.totalSolved++;
    if (!wasAttempted) p.totalAttempted++;
  }
  saveProgress(p);
  if (!wasAlreadySolved) addXP(xpEarned);
}

export function addXP(amount: number): { newXP: number; newLevel: number; leveledUp: boolean } {
  const p = getProgress();
  const oldLevel = p.level;
  p.xp += amount;
  p.level = xpToLevel(p.xp);
  saveProgress(p);
  return { newXP: p.xp, newLevel: p.level, leveledUp: p.level > oldLevel };
}

export function updateStreak(): void {
  const p = getProgress();
  const today = new Date().toISOString().slice(0, 10);
  if (p.lastActiveDate === today) return;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  p.streak = p.lastActiveDate === yesterday ? p.streak + 1 : 1;
  p.lastActiveDate = today;
  saveProgress(p);
}

export function awardBadge(badgeId: string): boolean {
  const p = getProgress();
  if (p.badges.includes(badgeId)) return false;
  p.badges.push(badgeId);
  saveProgress(p);
  return true;
}

export function exportProgress(): string {
  return JSON.stringify(getProgress());
}

export function importProgress(json: string): boolean {
  try {
    const parsed = JSON.parse(json) as UserProgress;
    if (typeof parsed.xp !== 'number' || typeof parsed.challenges !== 'object') return false;
    saveProgress({ ...DEFAULT_PROGRESS, ...parsed });
    return true;
  } catch {
    return false;
  }
}

export function getStats(): {
  solvedByDifficulty: Record<string, number>;
  solvedByTag: Record<string, number>;
  recentActivity: ChallengeProgress[];
} {
  const p = getProgress();
  const solved = Object.values(p.challenges).filter(c => c.status === 'solved');
  const recentActivity = [...Object.values(p.challenges)]
    .sort((a, b) => b.lastAttemptAt.localeCompare(a.lastAttemptAt))
    .slice(0, 10);
  // difficulty/tag info not stored on ChallengeProgress — return empty maps as placeholders
  return {
    solvedByDifficulty: {},
    solvedByTag: {},
    recentActivity,
  };
}
