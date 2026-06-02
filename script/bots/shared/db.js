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
    execute: async (query) => {
      if (typeof query === 'string') {
        const upper = query.toUpperCase();
        if (upper.includes('CREATE TABLE') || upper.includes('CREATE INDEX')) {
          return {};
        }
      }
      if (typeof query === 'object' && query.sql) {
        const sql = query.sql;
        const upper = sql.toUpperCase();
        const tableMatch = sql.match(/INTO\s+(\w+)/i);
        if (tableMatch && upper.includes('INSERT')) {
          const file = `${tableMatch[1]}.json`;
          const colMatch = sql.match(/\(([^)]+)\)\s*VALUES/i);
          if (colMatch) {
            const cols = colMatch[1].split(',').map(c => c.trim().replace(/"/g, ''));
            const entry = {};
            cols.forEach((c, i) => { entry[c] = query.args[i] ?? null; });
            if (upper.includes('ON CONFLICT DO NOTHING')) {
              const existing = readArray(file);
              if (existing.some(e => e[cols[0]] === entry[cols[0]])) {
                return { rowsAffected: 0 };
              }
            }
            appendToArray(file, entry);
            return { rowsAffected: 1 };
          }
        }
        if (upper.includes('SELECT')) {
          const fromMatch = sql.match(/FROM\s+(\w+)/i);
          if (fromMatch) return readArray(`${fromMatch[1]}.json`);
        }
      }
      return {};
    },
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
