/**
 * Import questions from data/ directory into local PostgreSQL.
 * Use this to seed a fresh local database: pnpm run data:import
 * Safe to run multiple times (ON CONFLICT DO NOTHING).
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { getPool } from './db/pg-client.js';

const QUESTIONS_DIR = 'data/questions';
const BATCH_SIZE = 500;

async function main() {
  console.log('=== Importing data from data/ into PostgreSQL ===\n');

  if (!fs.existsSync(QUESTIONS_DIR)) {
    console.error(`data/questions/ not found. Run 'pnpm run data:export' first.`);
    process.exit(1);
  }

  const pool = getPool();
  const files = fs.readdirSync(QUESTIONS_DIR).filter(f => f.endsWith('.json'));
  let total = 0;

  for (const file of files) {
    const questions = JSON.parse(fs.readFileSync(path.join(QUESTIONS_DIR, file), 'utf8'));
    let inserted = 0;

    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
      const batch = questions.slice(i, i + BATCH_SIZE);
      for (const q of batch) {
        await pool.query(
          `INSERT INTO questions (
            id, question, answer, explanation, diagram, difficulty,
            tags, channel, sub_channel, source_url, videos, companies,
            eli5, voice_keywords, voice_suitable, is_new, last_updated, created_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
          ON CONFLICT (id) DO NOTHING`,
          [
            q.id, q.question, q.answer, q.explanation, q.diagram, q.difficulty,
            JSON.stringify(q.tags ?? []),
            q.channel, q.subChannel, q.sourceUrl,
            q.videos ? JSON.stringify(q.videos) : null,
            q.companies ? JSON.stringify(q.companies) : null,
            q.eli5,
            q.voiceKeywords ? JSON.stringify(q.voiceKeywords) : null,
            (q.voiceSuitable ?? false) ? 1 : 0,
            (q.isNew ?? false) ? 1 : 0,
            q.lastUpdated, q.createdAt,
          ]
        );
        inserted++;
      }
    }

    console.log(`  ✓ ${file}: ${inserted} questions`);
    total += inserted;
  }

  console.log(`\n✓ Imported ${total} questions from ${files.length} files`);
  await pool.end();
}

main().catch(err => { console.error(err); process.exit(1); });
