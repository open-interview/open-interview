/**
 * Unit tests for script/bots/shared/runs.js
 * Uses a mock DB.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRunRows: any[] = [];
const mockDb = {
  execute: vi.fn(async (query: any) => {
    const sql = typeof query === 'string' ? query : query.sql;
    const args = typeof query === 'string' ? [] : (query.args ?? []);
    if (sql.includes('INSERT INTO bot_runs')) {
      const id = mockRunRows.length + 1;
      mockRunRows.push({ id, bot_name: args![0], started_at: args![1], status: 'running', items_processed: 0, items_created: 0, items_updated: 0, items_deleted: 0, summary: null, completed_at: null });
      return { lastInsertRowid: id };
    }
    if (sql.includes('UPDATE bot_runs') && sql.includes("status = 'completed'")) {
      const id = args![args!.length - 1];
      const row = mockRunRows.find(r => r.id === id);
      if (row) { row.completed_at = args![0]; row.status = 'completed'; row.items_processed = args![1]; row.items_created = args![2]; row.items_updated = args![3]; row.items_deleted = args![4]; row.summary = args![5]; }
      return { rows: [] };
    }
    if (sql.includes('UPDATE bot_runs') && sql.includes("status = 'failed'")) {
      const id = args![args!.length - 1];
      const row = mockRunRows.find(r => r.id === id);
      if (row) { row.completed_at = args![0]; row.status = 'failed'; row.summary = args![1]; }
      return { rows: [] };
    }
    if (sql.includes('SELECT * FROM bot_runs')) {
      return { rows: mockRunRows.slice().reverse() };
    }
    if (sql.includes('SELECT') && sql.includes('bot_runs') && sql.includes('GROUP BY')) {
      const grouped: Record<string, any> = {};
      for (const r of mockRunRows) {
        if (!grouped[r.bot_name]) grouped[r.bot_name] = { bot_name: r.bot_name, total_runs: 0, successful_runs: 0, total_created: 0, total_updated: 0, total_deleted: 0, last_run: r.started_at };
        grouped[r.bot_name].total_runs++;
        if (r.status === 'completed') grouped[r.bot_name].successful_runs++;
        grouped[r.bot_name].total_created += r.items_created || 0;
        grouped[r.bot_name].total_updated += r.items_updated || 0;
        grouped[r.bot_name].total_deleted += r.items_deleted || 0;
        grouped[r.bot_name].last_run = r.started_at;
      }
      return { rows: Object.values(grouped) };
    }
    // updateRunStats flush
    if (sql.includes('UPDATE bot_runs') && sql.includes('items_processed')) {
      const id = args![args!.length - 1];
      const row = mockRunRows.find(r => r.id === id);
      if (row) { row.items_processed = args![0]; row.items_created = args![1]; row.items_updated = args![2]; row.items_deleted = args![3]; }
      return { rows: [] };
    }
    return { rows: [], lastInsertRowid: 0 };
  }),
};

vi.mock('../shared/db.js', () => ({ getDb: () => mockDb }));

const { startRun, completeRun, failRun, getBotStats } = await import('../shared/runs.js');

beforeEach(() => {
  mockRunRows.length = 0;
  vi.clearAllMocks();
});

describe('startRun', () => {
  it('creates a row with status running', async () => {
    const run = await startRun('test-bot');
    expect(run.id).toBeDefined();
    expect(mockRunRows[0].status).toBe('running');
  });
});

describe('completeRun', () => {
  it('sets status to completed and records stats', async () => {
    const run = await startRun('test-bot');
    await completeRun(run.id, { processed: 10, created: 5, updated: 3, deleted: 0 });
    const row = mockRunRows.find(r => r.id === run.id);
    expect(row.status).toBe('completed');
    expect(row.items_processed).toBe(10);
  });
});

describe('failRun', () => {
  it('sets status to failed and stores error message', async () => {
    const run = await startRun('test-bot');
    await failRun(run.id, new Error('Something went wrong'));
    const row = mockRunRows.find(r => r.id === run.id);
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
