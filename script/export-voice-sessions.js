#!/usr/bin/env node

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const VOICE_SESSIONS_FILE = path.join(__dirname, '..', 'data', 'voice-sessions.json');

async function main() {
  console.log('=== Export Voice Sessions ===\n');

  try {
    const data = fs.existsSync(VOICE_SESSIONS_FILE)
      ? JSON.parse(fs.readFileSync(VOICE_SESSIONS_FILE, 'utf8'))
      : { sessions: [] };

    const sessions = data.sessions || [];

    console.log(`Found ${sessions.length} sessions`);

    const byChannel = {};
    for (const s of sessions) {
      if (!byChannel[s.channel]) byChannel[s.channel] = 0;
      byChannel[s.channel]++;
    }

    console.log('\nBy channel:');
    for (const [channel, count] of Object.entries(byChannel)) {
      console.log(`  ${channel}: ${count} sessions`);
    }

    const outputPath = path.join(__dirname, '..', 'client', 'public', 'data', 'voice-sessions.json');

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify({ sessions }, null, 2));
    console.log(`\n✓ Exported to: ${outputPath}`);

  } catch (error) {
    console.error('Error:', error.message);

    const outputPath = path.join(__dirname, '..', 'client', 'public', 'data', 'voice-sessions.json');
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify({ sessions: [] }, null, 2));
    console.log(`⚠️  File unavailable, writing empty voice-sessions.json`);
  }
}

main().catch(console.error);
