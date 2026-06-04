/**
 * Unit tests for script/bots/shared/queue.js
 * Uses an in-memory mock DB to avoid real DB dependency.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the DB module before importing queue
const store: Record<string, any[]> = { 'queue.json': [] };
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
  execute: vi.fn(async () => ({ rows: [], lastInsertRowid: 0, rowsAffected: 0 })),
};

vi.mock('../shared/db.js', () => ({ getDb: () => mockDb }));

const { addToQueue, getNextWorkItem, getBatchWorkItems } = await import('../shared/queue.js');

beforeEach(() => {
  store['queue.json'] = [];
  vi.clearAllMocks();
});

describe('addToQueue', () => {
  it('inserts a new item correctly', async () => {
    const result = await addToQueue({ itemType: 'question', itemId: 'q1', action: 'improve_content' });
    expect(result.isNew).toBe(true);
    expect(result.id).toBeDefined();
  });

  it('is idempotent — calling twice returns existing item', async () => {
    const first = await addToQueue({ itemType: 'question', itemId: 'q1', action: 'improve_content' });
    const second = await addToQueue({ itemType: 'question', itemId: 'q1', action: 'improve_content' });
    expect(first.id).toBe(second.id);
    expect(second.isNew).toBe(false);
  });
});

describe('getNextWorkItem', () => {
  it('returns the highest-priority (lowest number) item first', async () => {
    await addToQueue({ itemType: 'question', itemId: 'q1', action: 'fix', priority: 5 });
    await addToQueue({ itemType: 'question', itemId: 'q2', action: 'fix', priority: 1 });
    const item = await getNextWorkItem();
    expect(item?.itemId).toBe('q2');
  });
});

describe('getBatchWorkItems', () => {
  it('returns at most N items', async () => {
    for (let i = 0; i < 10; i++) {
      await addToQueue({ itemType: 'question', itemId: `q${i}`, action: 'fix', priority: 3 });
    }
    const items = await getBatchWorkItems(5);
    expect(items.length).toBeLessThanOrEqual(5);
  });
});
