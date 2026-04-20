import type { Challenge, RunResult } from '@/types/challenges';

export type Verdict = 'accepted' | 'partial' | 'wrong_answer' | 'runtime_error' | 'time_limit_exceeded';

export interface ScoreResult {
  verdict: Verdict;
  passed: number;
  total: number;
  percentage: number;
  xpEarned: number;
  timeBonusXP: number;
  totalXP: number;
  message: string;
}

const BASE_XP: Record<string, number> = { easy: 50, medium: 100, hard: 200 };

const VERDICT_MESSAGES: Record<Verdict, string> = {
  accepted: 'All test cases passed!',
  partial: 'Some test cases passed.',
  wrong_answer: 'Wrong answer.',
  runtime_error: 'Runtime error occurred.',
  time_limit_exceeded: 'Time limit exceeded.',
};

function getVerdict(runResult: RunResult): Verdict {
  if (runResult.error?.toLowerCase().includes('time limit')) return 'time_limit_exceeded';
  if (runResult.error) return 'runtime_error';
  if (runResult.allPassed) return 'accepted';
  if (runResult.passCount === 0) return 'wrong_answer';
  return 'partial';
}

function getTimeBonus(timeSpentMs: number): number {
  const min = timeSpentMs / 60000;
  if (min < 5) return 25;
  if (min < 10) return 10;
  if (min < 20) return 5;
  return 0;
}

export function calculateScore(
  challenge: Challenge,
  runResult: RunResult,
  timeSpentMs: number
): ScoreResult {
  const verdict = getVerdict(runResult);
  const passed = runResult.passCount;
  const total = runResult.totalCount;
  const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;
  const base = BASE_XP[challenge.difficulty] ?? 100;
  const xpEarned = Math.round(base * (total > 0 ? passed / total : 0));
  const timeBonusXP = verdict === 'accepted' ? getTimeBonus(timeSpentMs) : 0;
  return {
    verdict,
    passed,
    total,
    percentage,
    xpEarned,
    timeBonusXP,
    totalXP: xpEarned + timeBonusXP,
    message: VERDICT_MESSAGES[verdict],
  };
}

export function getVerdictColor(verdict: Verdict): string {
  switch (verdict) {
    case 'accepted': return 'text-green-400';
    case 'partial': return 'text-yellow-400';
    case 'wrong_answer': return 'text-red-400';
    case 'runtime_error': return 'text-orange-400';
    case 'time_limit_exceeded': return 'text-purple-400';
  }
}

export function getVerdictIcon(verdict: Verdict): string {
  switch (verdict) {
    case 'accepted': return '✅';
    case 'partial': return '⚠️';
    case 'wrong_answer': return '❌';
    case 'runtime_error': return '💥';
    case 'time_limit_exceeded': return '⏱️';
  }
}
