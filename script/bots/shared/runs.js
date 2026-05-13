/**
 * Bot Run Tracking
 * Records bot execution history
 */

import { getDb } from './db.js';

const _pendingStats = new Map();
const _pendingCounts = new Map();

export async function startRun(botName) {
  const db = getDb();
  const runs = db.readArray('runs.json');

  const id = db.getNextId(runs);
  const now = new Date().toISOString();

  const entry = {
    id,
    bot_name: botName,
    started_at: now,
    completed_at: null,
    status: 'running',
    items_processed: 0,
    items_created: 0,
    items_updated: 0,
    items_deleted: 0,
    summary: null
  };

  runs.push(entry);
  db.writeArray('runs.json', runs);

  return {
    id,
    botName,
    startedAt: now,
    stats: {
      processed: 0,
      created: 0,
      updated: 0,
      deleted: 0
    }
  };
}

export async function updateRunStats(runId, stats) {
  _pendingStats.set(runId, stats);
  _pendingCounts.set(runId, (_pendingCounts.get(runId) || 0) + 1);
  if (_pendingCounts.get(runId) >= 10) {
    await flushRunStats(runId);
  }
}

export async function flushRunStats(runId) {
  const stats = _pendingStats.get(runId);
  if (!stats) return;

  const db = getDb();
  const runs = db.readArray('runs.json');
  const run = runs.find(r => r.id === runId);
  if (!run) return;

  run.items_processed = stats.processed || 0;
  run.items_created = stats.created || 0;
  run.items_updated = stats.updated || 0;
  run.items_deleted = stats.deleted || 0;
  db.writeArray('runs.json', runs);

  _pendingStats.delete(runId);
  _pendingCounts.delete(runId);
}

export async function completeRun(runId, stats, summary = null) {
  if (stats) {
    _pendingStats.set(runId, stats);
  }
  await flushRunStats(runId);

  const db = getDb();
  const runs = db.readArray('runs.json');
  const run = runs.find(r => r.id === runId);
  if (!run) return;

  run.completed_at = new Date().toISOString();
  run.status = 'completed';
  run.summary = summary ? JSON.stringify(summary) : null;
  db.writeArray('runs.json', runs);
}

export async function failRun(runId, error) {
  const db = getDb();
  const runs = db.readArray('runs.json');
  const run = runs.find(r => r.id === runId);
  if (!run) return;

  run.completed_at = new Date().toISOString();
  run.status = 'failed';
  run.summary = JSON.stringify({ error: error.message || error });
  db.writeArray('runs.json', runs);
}

export async function getRecentRuns(limit = 20) {
  const db = getDb();
  const runs = db.readArray('runs.json');

  runs.sort((a, b) => new Date(b.started_at) - new Date(a.started_at));

  return runs.slice(0, limit).map(row => ({
    id: row.id,
    botName: row.bot_name,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    status: row.status,
    itemsProcessed: row.items_processed,
    itemsCreated: row.items_created,
    itemsUpdated: row.items_updated,
    itemsDeleted: row.items_deleted,
    summary: row.summary ? JSON.parse(row.summary) : null
  }));
}

export async function getBotStats() {
  const db = getDb();
  const runs = db.readArray('runs.json');

  const botMap = {};
  for (const row of runs) {
    if (!botMap[row.bot_name]) {
      botMap[row.bot_name] = {
        botName: row.bot_name,
        totalRuns: 0,
        successfulRuns: 0,
        totalCreated: 0,
        totalUpdated: 0,
        totalDeleted: 0,
        lastRun: null
      };
    }
    const s = botMap[row.bot_name];
    s.totalRuns++;
    if (row.status === 'completed') s.successfulRuns++;
    s.totalCreated += row.items_created || 0;
    s.totalUpdated += row.items_updated || 0;
    s.totalDeleted += row.items_deleted || 0;
    if (!s.lastRun || row.started_at > s.lastRun) {
      s.lastRun = row.started_at;
    }
  }

  return Object.values(botMap);
}

export default { startRun, updateRunStats, flushRunStats, completeRun, failRun, getRecentRuns, getBotStats };
