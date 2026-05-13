/**
 * Work Queue Management
 * Coordinates work between bots
 */

import { getDb } from './db.js';

export async function addToQueue({
  itemType,
  itemId,
  action,
  priority = 5,
  reason = null,
  createdBy = null,
  assignedTo = null
}) {
  const db = getDb();
  const items = db.readArray('queue.json');

  const existing = items.find(
    i => i.item_type === itemType && i.item_id === itemId && i.action === action && i.status === 'pending'
  );

  if (existing) {
    return { id: existing.id, isNew: false };
  }

  const id = db.getNextId(items);
  const entry = {
    id,
    item_type: itemType,
    item_id: itemId,
    action,
    priority,
    status: 'pending',
    reason,
    created_by: createdBy,
    assigned_to: assignedTo,
    created_at: new Date().toISOString(),
    processed_at: null,
    result: null
  };

  items.push(entry);
  db.writeArray('queue.json', items);

  return { id, isNew: true };
}

export async function getNextWorkItem(assignedTo = null) {
  const db = getDb();
  const items = db.readArray('queue.json');

  let pending = items.filter(i => i.status === 'pending');

  if (assignedTo) {
    pending = pending.filter(i => i.assigned_to === assignedTo || !i.assigned_to);
  }

  if (pending.length === 0) return null;

  pending.sort((a, b) => a.priority - b.priority || new Date(a.created_at) - new Date(b.created_at));

  const item = pending[0];
  item.status = 'processing';
  db.writeArray('queue.json', items);

  return {
    id: item.id,
    itemType: item.item_type,
    itemId: item.item_id,
    action: item.action,
    priority: item.priority,
    reason: item.reason,
    createdBy: item.created_by,
    createdAt: item.created_at
  };
}

export async function completeWorkItem(id, result = null) {
  const db = getDb();
  const items = db.readArray('queue.json');

  const item = items.find(i => i.id === id);
  if (!item) return;

  item.status = 'completed';
  item.processed_at = new Date().toISOString();
  item.result = result ? JSON.stringify(result) : null;
  db.writeArray('queue.json', items);
}

export async function failWorkItem(id, error) {
  const db = getDb();
  const items = db.readArray('queue.json');

  const item = items.find(i => i.id === id);
  if (!item) return;

  item.status = 'failed';
  item.processed_at = new Date().toISOString();
  item.result = JSON.stringify({ error: error.message || error });
  db.writeArray('queue.json', items);
}

export async function getQueueStats() {
  const db = getDb();
  const items = db.readArray('queue.json');

  const stats = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    byAction: {},
    byType: {}
  };

  for (const row of items) {
    stats[row.status] = (stats[row.status] || 0) + 1;
    stats.byAction[row.action] = (stats.byAction[row.action] || 0) + 1;
    stats.byType[row.item_type] = (stats.byType[row.item_type] || 0) + 1;
  }

  return stats;
}

export async function getPendingItems(limit = 50) {
  const db = getDb();
  const items = db.readArray('queue.json');

  const pending = items
    .filter(i => i.status === 'pending')
    .sort((a, b) => a.priority - b.priority || new Date(a.created_at) - new Date(b.created_at))
    .slice(0, limit);

  return pending.map(row => ({
    id: row.id,
    itemType: row.item_type,
    itemId: row.item_id,
    action: row.action,
    priority: row.priority,
    reason: row.reason,
    createdBy: row.created_by,
    createdAt: row.created_at
  }));
}

export async function getBatchWorkItems(n = 10, assignedTo = null) {
  const db = getDb();
  const items = db.readArray('queue.json');

  let pending = items.filter(i => i.status === 'pending');

  if (assignedTo) {
    pending = pending.filter(i => i.assigned_to === assignedTo || !i.assigned_to);
  }

  pending.sort((a, b) => a.priority - b.priority || new Date(a.created_at) - new Date(b.created_at));

  const batch = pending.slice(0, n);

  for (const item of batch) {
    item.status = 'processing';
  }
  db.writeArray('queue.json', items);

  return batch.map(row => ({
    id: row.id,
    itemType: row.item_type,
    itemId: row.item_id,
    action: row.action,
    priority: row.priority,
    reason: row.reason,
    createdBy: row.created_by,
    createdAt: row.created_at
  }));
}

export async function addBatchToQueue(items) {
  const db = getDb();
  const queue = db.readArray('queue.json');

  const existingSet = new Map();
  for (const q of queue) {
    if (q.status === 'pending') {
      existingSet.set(`${q.item_type}|${q.item_id}|${q.action}`, q.id);
    }
  }

  const now = new Date().toISOString();
  const results = [];

  for (const item of items) {
    const key = `${item.itemType}|${item.itemId}|${item.action}`;
    if (existingSet.has(key)) {
      results.push({ id: existingSet.get(key), isNew: false });
    } else {
      const id = db.getNextId(queue);
      const entry = {
        id,
        item_type: item.itemType,
        item_id: item.itemId,
        action: item.action,
        priority: item.priority ?? 5,
        status: 'pending',
        reason: item.reason ?? null,
        created_by: item.createdBy ?? null,
        assigned_to: item.assignedTo ?? null,
        created_at: now,
        processed_at: null,
        result: null
      };
      queue.push(entry);
      existingSet.set(key, id);
      results.push({ id, isNew: true });
    }
  }

  db.writeArray('queue.json', queue);
  return results;
}

export default { addToQueue, getNextWorkItem, completeWorkItem, failWorkItem, getQueueStats, getPendingItems, getBatchWorkItems, addBatchToQueue };
