/**
 * Unit tests for script/bots/shared/queue.js
 * Uses an in-memory mock DB to avoid real DB dependency.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the DB module before importing queue
const mockRows: any[] = [];
const mockDb = {
  execute: vi.fn(async ({ sql, args }: { sql: string; args?: any[] }) => {
    // Minimal in-memory simulation
    if (sql.includes('SELECT id FROM work_queue') && sql.includes('status = \'pending\'')) {
      const [type, id, action] = args || [];
      const found = mockRows.find(r => r.item_type === type && r.item_id === id && r.action === action && r.status === 'pending');
      return { rows: found ? [{ id: found.id }] : [] };
    }
    if (sql.includes('INSERT INTO work_queue')) {
      const newId = mockRows.length + 1;
      mockRows.push({ id: newId, item_type: args![0], item_id: args![1], action: args![2], priority: args![3], reason: args![4], created_by: args![5], assigned_to: args![6], created_at: args![7], status: 'pending' });
      return { lastInsertRowid: newId, rowsAffected: 1 };
    }
    if (sql.includes('SELECT * FROM work_queue WHERE status = \'pending\'')) {
      const limit = args?.[0] ?? 1;
      const pending = mockRows.filter(r => r.status === 'pending').sort((a, b) => a.priority - b.priority || a.created_at.localeCompare(b.created_at)).slice(0, limit);
      return { rows: pending };
    }
    if (sql.includes('UPDATE work_queue SET status = \'processing\'')) {
      const id = args![0];
      const row = mockRows.find(r => r.id === id);
      if (row) row.status = 'processing';
      return { rows: [] };
    }
    return { rows: [], lastInsertRowid: 0, rowsAffected: 0 };
  }),
};

vi.mock('../shared/db.js', () => ({ getDb: () => mockDb }));

const { addToQueue, getNextWorkItem, getBatchWorkItems } = await import('../shared/queue.js');

beforeEach(() => {
  mockRows.length = 0;
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
