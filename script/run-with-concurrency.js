/**
 * Parallel Consumer Queue — runs N tasks across M concurrent workers
 *
 * Uses an atomic index counter (no Array.shift() race conditions).
 * Workers pull tasks from a shared index, not from a mutable array.
 *
 * Usage:
 *   import { runWithConcurrency } from './run-with-concurrency.js';
 *
 *   const results = await runWithConcurrency(tasks, 20, async (task, idx, workerId) => {
 *     return await process(task);
 *   });
 *
 * Features:
 *   - Configurable concurrency (default 20)
 *   - Per-worker error isolation (one failure doesn't stop others)
 *   - Optional progress callback
 *   - Returns results array matching input order
 */

const DEFAULT_CONCURRENCY = 20;

/**
 * @template T, R
 * @param {T[]} tasks - Array of tasks to process
 * @param {number} concurrency - Number of concurrent workers (default 20)
 * @param {(task: T, index: number, workerId: number) => Promise<R>} fn - Async worker function
 * @param {(progress: { workerId: number, index: number, total: number, completed: number, success: boolean, duration: number, error?: string }) => void} [onProgress] - Optional progress callback
 * @returns {Promise<(R | { error: string })[]>} Results in input order
 */
export async function runWithConcurrency(tasks, concurrency = DEFAULT_CONCURRENCY, fn, onProgress) {
  const total = tasks.length;
  const results = new Array(total);
  let nextIdx = 0;
  let completed = 0;

  if (total === 0) return results;

  const effectiveConcurrency = Math.min(concurrency, total);

  async function worker(workerId) {
    while (nextIdx < total) {
      const idx = nextIdx++;
      const task = tasks[idx];
      const startTime = Date.now();

      try {
        results[idx] = await fn(task, idx, workerId);
        if (onProgress) {
          completed++;
          onProgress({ workerId, index: idx, total, completed, success: true, duration: Date.now() - startTime });
        }
      } catch (error) {
        results[idx] = { error: error.message || String(error) };
        if (onProgress) {
          completed++;
          onProgress({ workerId, index: idx, total, completed, success: false, error: error.message, duration: Date.now() - startTime });
        }
      }
    }
  }

  const workers = Array.from({ length: effectiveConcurrency }, (_, i) => worker(i + 1));
  await Promise.all(workers);

  return results;
}

/**
 * Create a progress reporter that prints a status line.
 * Returns an onProgress callback suitable for runWithConcurrency.
 */
export function createProgressReporter(label = 'Progress') {
  const startTime = Date.now();
  let lastPct = -1;

  return ({ total, completed, success, error }) => {
    const pct = Math.floor((completed / total) * 100);
    if (pct !== lastPct || completed === total) {
      lastPct = pct;
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const rate = completed > 0 ? (completed / (parseFloat(elapsed) || 1)).toFixed(1) : '0';
      const symbol = error ? '✗' : '✓';
      process.stdout.write(`\r  ${label}: ${completed}/${total} (${pct}%) ${symbol} | ${elapsed}s | ${rate}/s`);
      if (completed === total) process.stdout.write('\n');
    }
  };
}

export default runWithConcurrency;
