#!/usr/bin/env node
/**
 * Export Voice Sessions from Database to JSON
 * 
 * Exports voice_sessions table to client/public/data/voice-sessions.json
 * Run after session-builder-bot to make sessions available to the client.
 * 
 * Usage:
 *   node script/export-voice-sessions.js
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbClient as db } from './db/pg-client.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log('=== Export Voice Sessions ===\n');
  
    try {
    // Fetch all voice sessions
    const result = await db.execute({
      sql: `SELECT id, topic, description, channel, difficulty, question_ids, total_questions, estimated_minutes
            FROM voice_sessions
            ORDER BY channel, topic`,
      args: []
    });
    
    const sessions = result.rows.map(row => ({
      id: row.id,
      topic: row.topic,
      description: row.description,
      channel: row.channel,
      difficulty: row.difficulty,
      questionIds: JSON.parse(row.question_ids),
      totalQuestions: row.total_questions,
      estimatedMinutes: row.estimated_minutes
    }));
    
    console.log(`Found ${sessions.length} sessions`);
    
    // Group by channel for summary
    const byChannel = {};
    for (const s of sessions) {
      if (!byChannel[s.channel]) byChannel[s.channel] = 0;
      byChannel[s.channel]++;
    }
    
    console.log('\nBy channel:');
    for (const [channel, count] of Object.entries(byChannel)) {
      console.log(`  ${channel}: ${count} sessions`);
    }
    
    // Write to JSON file
    const outputPath = path.join(__dirname, '..', 'client', 'public', 'data', 'voice-sessions.json');
    
    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify({ sessions }, null, 2));
    console.log(`\n✓ Exported to: ${outputPath}`);
    
  } catch (error) {
    console.error('Error:', error.message);
    
    // Write empty file for any DB error (no connection, no table, etc.)
    const outputPath = path.join(__dirname, '..', 'client', 'public', 'data', 'voice-sessions.json');
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify({ sessions: [] }, null, 2));
    console.log(`⚠️  DB unavailable, writing empty voice-sessions.json`);
  }
}

main().catch(console.error);
