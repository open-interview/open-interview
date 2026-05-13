/**
 * Audit Ledger for Bot Actions
 * Records all bot actions for transparency and debugging
 */

import { getDb } from './db.js';

export async function logAction({
  botName,
  action,
  itemType,
  itemId,
  beforeState = null,
  afterState = null,
  reason = null
}) {
  const db = getDb();
  const entries = db.readArray('ledger.json');
  const id = db.getNextId(entries);

  const entry = {
    id,
    bot_name: botName,
    action,
    item_type: itemType,
    item_id: itemId,
    before_state: beforeState ? JSON.stringify(beforeState) : null,
    after_state: afterState ? JSON.stringify(afterState) : null,
    reason,
    created_at: new Date().toISOString()
  };

  entries.push(entry);
  db.writeArray('ledger.json', entries);
  return entry;
}

export async function getLedgerEntries({ botName = null, action = null, itemType = null, limit = 100, offset = 0 } = {}) {
  const db = getDb();
  const entries = db.readArray('ledger.json');

  let filtered = entries;

  if (botName) {
    filtered = filtered.filter(e => e.bot_name === botName);
  }

  if (action) {
    filtered = filtered.filter(e => e.action === action);
  }

  if (itemType) {
    filtered = filtered.filter(e => e.item_type === itemType);
  }

  filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const sliced = filtered.slice(offset, offset + limit);

  return sliced.map(row => ({
    id: row.id,
    botName: row.bot_name,
    action: row.action,
    itemType: row.item_type,
    itemId: row.item_id,
    beforeState: row.before_state ? JSON.parse(row.before_state) : null,
    afterState: row.after_state ? JSON.parse(row.after_state) : null,
    reason: row.reason,
    createdAt: row.created_at
  }));
}

export async function getLedgerStats() {
  const db = getDb();
  const entries = db.readArray('ledger.json');

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recent = entries.filter(e => new Date(e.created_at) >= sevenDaysAgo);

  const stats = {};
  for (const row of recent) {
    if (!stats[row.bot_name]) {
      stats[row.bot_name] = {};
    }
    stats[row.bot_name][row.action] = (stats[row.bot_name][row.action] || 0) + 1;
  }

  return stats;
}

export default { logAction, getLedgerEntries, getLedgerStats };
