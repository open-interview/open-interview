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
    // Bot runs summary
    const runsRows = (await db.execute(
      `SELECT bot_name, status, COUNT(*) as count, MAX(created_at) as last_run
       FROM bot_runs GROUP BY bot_name, status ORDER BY bot_name, status`
    )).rows;

    // Recent bot ledger entries
    const ledgerRows = (await db.execute(
      `SELECT * FROM bot_ledger ORDER BY created_at DESC LIMIT 100`
    )).rows;

    const data = {
      generatedAt: new Date().toISOString(),
      botRuns: runsRows.map(r => ({
        botName: r.bot_name, status: r.status,
        count: Number(r.count), lastRun: r.last_run,
      })),
      recentActivity: ledgerRows.map(r => ({
        id: r.id, botName: r.bot_name, action: r.action,
        itemId: r.item_id, status: r.status,
        details: r.details, createdAt: r.created_at,
      })),
    };

    const outPath = path.resolve(__dirname, '../client/public/data/bot-monitor.json');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
    console.log(`✓ bot-monitor.json (${data.botRuns.length} bots, ${data.recentActivity.length} recent)`);
  } catch (e) {
    console.log(`⚠️ bot-monitor: ${e.message}`);
    // Write empty fallback so the file always exists
    const outPath = path.resolve(__dirname, '../client/public/data/bot-monitor.json');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), botRuns: [], recentActivity: [] }, null, 2));
  }
}

main().catch(console.error);
