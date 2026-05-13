#!/usr/bin/env node

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BOT_DATA_DIR = path.join(__dirname, '..', 'data', 'bot-data');

function readJsonFile(filepath) {
  if (!fs.existsSync(filepath)) return null;
  try { return JSON.parse(fs.readFileSync(filepath, 'utf8')); } catch { return null; }
}

async function main() {
  console.log('=== Fetching bot monitor data ===');

  try {
    const botActivity = readJsonFile(path.join(BOT_DATA_DIR, 'bot-activity.json')) || [];
    const workQueue = readJsonFile(path.join(BOT_DATA_DIR, 'work-queue.json')) || [];

    const botNames = [...new Set(botActivity.map(a => a.bot_type).filter(Boolean))];

    const stats = botNames.map(botName => {
      const runs = botActivity.filter(a => a.bot_type === botName);
      return {
        botName,
        totalRuns: runs.length,
        successfulRuns: runs.filter(a => a.status === 'completed').length,
        totalCreated: 0,
        totalUpdated: 0,
        totalDeleted: 0,
        lastRun: runs.length > 0 ? runs[runs.length - 1].completed_at : null,
      };
    });

    const runs = botActivity
      .sort((a, b) => (b.completed_at || '').localeCompare(a.completed_at || ''))
      .slice(0, 50)
      .map(r => ({
        id: r.id,
        botName: r.bot_type,
        startedAt: r.created_at,
        completedAt: r.completed_at,
        status: r.status,
        itemsProcessed: 0,
        itemsCreated: 0,
        itemsUpdated: 0,
        itemsDeleted: 0,
        summary: r.result ? JSON.stringify(r.result) : null,
      }));

    const queue = workQueue
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
      .slice(0, 100)
      .map(r => ({
        id: r.id,
        itemType: r.bot_type || r.item_type,
        itemId: r.question_id || r.item_id,
        action: r.action || r.bot_type,
        priority: r.priority || 0,
        status: r.status,
        reason: r.reason,
        createdBy: r.created_by,
        createdAt: r.created_at,
      }));

    const ledger = botActivity
      .sort((a, b) => (b.completed_at || '').localeCompare(a.completed_at || ''))
      .slice(0, 100)
      .map(r => ({
        id: r.id,
        botName: r.bot_type,
        action: r.action || r.bot_type,
        itemType: 'question',
        itemId: r.question_id,
        reason: r.reason,
        createdAt: r.created_at,
      }));

    const data = {
      generatedAt: new Date().toISOString(),
      stats,
      runs,
      queue,
      ledger,
    };

    const outPath = path.resolve(__dirname, '../client/public/data/bot-monitor.json');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
    console.log(`✓ bot-monitor.json (stats: ${data.stats.length}, runs: ${data.runs.length}, queue: ${data.queue.length}, ledger: ${data.ledger.length})`);
  } catch (e) {
    console.log(`⚠️ bot-monitor: ${e.message}`);
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
