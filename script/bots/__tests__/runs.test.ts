/**
 * Unit tests for script/bots/shared/runs.js
 * Uses a mock DB.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// In-memory store shared between mock and test assertions
const store: Record<string, any[]> = { 'runs.json': [] };
const mockDb = {
  readArray: vi.fn((filename: string) => {
    return store[filename] || [];
  }),
  writeArray: vi.fn((filename: string, data: any[]) => {
    store[filename] = [...data];
  }),
  getNextId: vi.fn((arr: any[]) => {
    if (arr.length === 0) return 1;
    return Math.max(...arr.map((item: any) => item.id || 0)) + 1;
  }),
  execute: vi.fn(async () => ({ rows: [], lastInsertRowid: 0 })),
};

vi.mock('../shared/db.js', () => ({ getDb: () => mockDb }));

const { startRun, completeRun, failRun, getBotStats } = await import('../shared/runs.js');

beforeEach(() => {
  store['runs.json'] = [];
  vi.clearAllMocks();
});

describe('startRun', () => {
  it('creates a row with status running', async () => {
    const run = await startRun('test-bot');
    expect(run.id).toBeDefined();
    expect(store['runs.json'][0].status).toBe('running');
  });
});

describe('completeRun', () => {
  it('sets status to completed and records stats', async () => {
    const run = await startRun('test-bot');
    await completeRun(run.id, { processed: 10, created: 5, updated: 3, deleted: 0 });
    const row = store['runs.json'].find((r: any) => r.id === run.id);
    expect(row.status).toBe('completed');
    expect(row.items_processed).toBe(10);
  });
});

describe('failRun', () => {
  it('sets status to failed and stores error message', async () => {
    const run = await startRun('test-bot');
    await failRun(run.id, new Error('Something went wrong'));
    const row = store['runs.json'].find((r: any) => r.id === run.id);
    expect(row.status).toBe('failed');
    expect(row.summary).toContain('Something went wrong');
  });
});

describe('getBotStats', () => {
  it('aggregates correctly across multiple runs', async () => {
    const r1 = await startRun('creator');
    await completeRun(r1.id, { processed: 5, created: 5, updated: 0, deleted: 0 });
    const r2 = await startRun('creator');
    await completeRun(r2.id, { processed: 3, created: 3, updated: 0, deleted: 0 });
    const stats = await getBotStats();
    const creatorStats = stats.find(s => s.botName === 'creator');
    expect(creatorStats?.totalRuns).toBe(2);
    expect(creatorStats?.successfulRuns).toBe(2);
    expect(creatorStats?.totalCreated).toBe(8);
  });
});
