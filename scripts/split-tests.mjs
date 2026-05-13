#!/usr/bin/env node
// Splits data/tests.json into per-channel files under data/tests/{channelId}.json
import fs from 'fs';
import path from 'path';

const SRC = 'data/tests.json';
const OUT_DIR = 'data/tests';

if (!fs.existsSync(SRC)) { console.log('data/tests.json not found, skipping'); process.exit(0); }

const tests = JSON.parse(fs.readFileSync(SRC, 'utf8'));
fs.mkdirSync(OUT_DIR, { recursive: true });

const byChannel = {};
for (const t of tests) {
  const ch = t.channelId || t.channel_id || 'unknown';
  if (!byChannel[ch]) byChannel[ch] = [];
  byChannel[ch].push(t);
}

for (const [ch, items] of Object.entries(byChannel)) {
  fs.writeFileSync(path.join(OUT_DIR, `${ch}.json`), JSON.stringify(items, null, 2));
}

fs.unlinkSync(SRC);
console.log(`Split ${tests.length} tests into ${Object.keys(byChannel).length} channel files in ${OUT_DIR}/`);
