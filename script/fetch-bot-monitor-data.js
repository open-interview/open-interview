#!/usr/bin/env node
/**
 * Fetch Bot Monitor Data
 * Generates bot-monitor.json for the frontend
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbClient as db } from './db/pg-client.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log('=== Fetching bot monitor data ===');

  try {
    // Bot runs stats - aggregate by bot for stats cards
    const statsRows = (await db.execute(
      `SELECT 
         bot_name,
         COUNT(*) as total_runs,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful_runs,
         SUM(items_created) as total_created,
         SUM(items_updated) as total_updated,
         SUM(items_deleted) as total_deleted,
         MAX(started_at) as last_run
       FROM bot_runs 
       GROUP BY bot_name`
    )).rows;

    // Recent bot runs for run history
    const runsRows = (await db.execute(
      `SELECT 
         id, bot_name, started_at, completed_at, status,
         items_processed, items_created, items_updated, items_deleted, summary
       FROM bot_runs 
       ORDER BY started_at DESC LIMIT 50`
    )).rows;

    // Work queue items
    const queueRows = (await db.execute(
      `SELECT 
         id, item_type, item_id, action, priority, status, reason, created_by, created_at
       FROM work_queue 
       ORDER BY created_at DESC LIMIT 100`
    )).rows;

    // Recent bot ledger entries
    const ledgerRows = (await db.execute(
      `SELECT 
         id, bot_name, action, item_type, item_id, reason, created_at
       FROM bot_ledger 
       ORDER BY created_at DESC LIMIT 100`
    )).rows;

    const data = {
      generatedAt: new Date().toISOString(),
      stats: statsRows.map(r => ({
        botName: r.bot_name,
        totalRuns: Number(r.total_runs) || 0,
        successfulRuns: Number(r.successful_runs) || 0,
        totalCreated: Number(r.total_created) || 0,
        totalUpdated: Number(r.total_updated) || 0,
        totalDeleted: Number(r.total_deleted) || 0,
        lastRun: r.last_run,
      })),
      runs: runsRows.map(r => ({
        id: Number(r.id),
        botName: r.bot_name,
        startedAt: r.started_at,
        completedAt: r.completed_at,
        status: r.status,
        itemsProcessed: Number(r.items_processed) || 0,
        itemsCreated: Number(r.items_created) || 0,
        itemsUpdated: Number(r.items_updated) || 0,
        itemsDeleted: Number(r.items_deleted) || 0,
        summary: r.summary,
      })),
      queue: queueRows.map(r => ({
        id: Number(r.id),
        itemType: r.item_type,
        itemId: r.item_id,
        action: r.action,
        priority: Number(r.priority) || 0,
        status: r.status,
        reason: r.reason,
        createdBy: r.created_by,
        createdAt: r.created_at,
      })),
      ledger: ledgerRows.map(r => ({
        id: Number(r.id),
        botName: r.bot_name,
        action: r.action,
        itemType: r.item_type,
        itemId: r.item_id,
        reason: r.reason,
        createdAt: r.created_at,
      })),
    };

    const outPath = path.resolve(__dirname, '../client/public/data/bot-monitor.json');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
    console.log(`✓ bot-monitor.json (stats: ${data.stats.length}, runs: ${data.runs.length}, queue: ${data.queue.length}, ledger: ${data.ledger.length})`);
  } catch (e) {
    console.log(`⚠️ bot-monitor: ${e.message}`);
    // Write empty fallback so the file always exists
    const outPath = path.resolve(__dirname, '../client/public/data/bot-monitor.json');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify({ 
      generatedAt: new Date().toISOString(), 
      stats: [], 
      runs: [], 
      queue: [], 
      ledger: [] 
    }, null, 2));
  }
}

main().catch(console.error);
