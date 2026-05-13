/**
 * Database utilities for bots — file-based edition
 * Provides file I/O helpers for bot data storage.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BOT_DATA_DIR = path.join(process.cwd(), 'data', 'bot-data');

function ensureDir() {
  fs.mkdirSync(BOT_DATA_DIR, { recursive: true });
}

function readArray(filename) {
  ensureDir();
  const filepath = path.join(BOT_DATA_DIR, filename);
  if (!fs.existsSync(filepath)) return [];
  try { return JSON.parse(fs.readFileSync(filepath, 'utf8')); } catch { return []; }
}

function writeArray(filename, data) {
  ensureDir();
  fs.writeFileSync(path.join(BOT_DATA_DIR, filename), JSON.stringify(data, null, 2));
}

function appendToArray(filename, entry) {
  const arr = readArray(filename);
  arr.push(entry);
  writeArray(filename, arr);
  return entry;
}

function getNextId(arr) {
  if (arr.length === 0) return 1;
  return Math.max(...arr.map(item => item.id || 0)) + 1;
}

export function getDb() {
  return {
    readArray: (f) => readArray(f),
    writeArray: (f, d) => writeArray(f, d),
    appendToArray: (f, e) => appendToArray(f, e),
    getNextId: (arr) => getNextId(arr),
  };
}

export async function initBotTables() {
  ensureDir();
  ['ledger.json', 'queue.json', 'runs.json', 'relationships.json', 'voice_sessions.json'].forEach(f => {
    const fp = path.join(BOT_DATA_DIR, f);
    if (!fs.existsSync(fp)) fs.writeFileSync(fp, '[]');
  });
  console.log('✓ Bot data files initialized');
}

export async function resetBotTables() {
  const dir = BOT_DATA_DIR;
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });
  await initBotTables();
  console.log('✓ Bot data files reset');
}

export default { getDb, initBotTables, resetBotTables };
