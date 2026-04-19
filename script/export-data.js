/**
 * Export questions from PostgreSQL to data/ directory for static builds.
 * Run after adding/updating questions: pnpm run data:export
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { dbClient as client, getPool } from './db/pg-client.js';

const OUTPUT_DIR = 'data/questions';

async function main() {
  console.log('=== Exporting data to data/ directory ===\n');
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync('data/meta', { recursive: true });

  const result = await client.execute('SELECT * FROM questions ORDER BY channel, sub_channel, id');
  const rows = result.rows;
  console.log(`Fetched ${rows.length} questions`);

  // Group by channel
  const byChannel = {};
  for (const row of rows) {
    const ch = row.channel;
    if (!byChannel[ch]) byChannel[ch] = [];
    byChannel[ch].push({
      id: row.id,
      question: row.question,
      answer: row.answer,
      explanation: row.explanation,
      diagram: row.diagram,
      difficulty: row.difficulty,
      tags: row.tags ? JSON.parse(row.tags) : [],
      channel: row.channel,
      subChannel: row.sub_channel,
      sourceUrl: row.source_url,
      videos: row.videos ? JSON.parse(row.videos) : null,
      companies: row.companies ? JSON.parse(row.companies) : null,
      eli5: row.eli5,
      voiceKeywords: row.voice_keywords ? JSON.parse(row.voice_keywords) : null,
      voiceSuitable: row.voice_suitable,
      isNew: row.is_new,
      lastUpdated: row.last_updated,
      createdAt: row.created_at,
    });
  }

  const channelStats = [];
  for (const [channel, questions] of Object.entries(byChannel)) {
    const file = path.join(OUTPUT_DIR, `${channel}.json`);
    fs.writeFileSync(file, JSON.stringify(questions, null, 2));
    console.log(`  ✓ ${channel}.json (${questions.length} questions)`);
    channelStats.push({ id: channel, questionCount: questions.length });
  }

  fs.writeFileSync('data/meta/channels.json', JSON.stringify(channelStats, null, 2));
  console.log(`\n✓ Exported ${rows.length} questions across ${channelStats.length} channels`);
  console.log('Commit the data/ directory to make changes available in CI.');

  // Export flashcards
  const fcResult = await client.execute('SELECT * FROM flashcards ORDER BY channel, created_at DESC');
  const flashcards = fcResult.rows.map(row => ({
    id: row.id, questionId: row.question_id, channel: row.channel,
    difficulty: row.difficulty, tags: row.tags ? JSON.parse(row.tags) : [],
    front: row.front, back: row.back, hint: row.hint, mnemonic: row.mnemonic,
    createdAt: row.created_at, updatedAt: row.updated_at,
  }));
  fs.mkdirSync('data/flashcards', { recursive: true });
  fs.writeFileSync('data/flashcards/all.json', JSON.stringify(flashcards, null, 2));
  console.log(`  ✓ flashcards/all.json (${flashcards.length} flashcards)`);

  await getPool().end();
}

main().catch(err => { console.error(err); process.exit(1); });
