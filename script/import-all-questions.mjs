import 'dotenv/config';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  console.log('=== Creating questions table ===\n');

  // Drop and recreate table
  await pool.query('DROP TABLE IF EXISTS questions');
  
  await pool.query(`
    CREATE TABLE questions (
      id TEXT PRIMARY KEY,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      explanation TEXT NOT NULL,
      diagram TEXT,
      difficulty TEXT NOT NULL,
      tags TEXT,
      channel TEXT NOT NULL,
      sub_channel TEXT,
      source_url TEXT,
      videos TEXT,
      companies TEXT,
      eli5 TEXT,
      tldr TEXT,
      relevance_score INTEGER,
      relevance_details TEXT,
      job_title_relevance TEXT,
      experience_level_tags TEXT,
      voice_keywords TEXT,
      voice_suitable INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      is_new INTEGER DEFAULT 1,
      last_updated TEXT,
      created_at TEXT
    )
  `);
  console.log('Created questions table\n');

  console.log('=== Importing questions from data/questions/ ===\n');

  const files = fs.readdirSync('data/questions').filter(f => f.endsWith('.json'));
  let total = 0;

  for (const file of files) {
    const questions = JSON.parse(fs.readFileSync(path.join('data/questions', file), 'utf8'));
    let inserted = 0;

    for (const q of questions) {
      try {
        await pool.query(
          `INSERT INTO questions (id, question, answer, explanation, diagram, difficulty, tags, channel, sub_channel, source_url, videos, companies, eli5, tldr, relevance_score, relevance_details, job_title_relevance, experience_level_tags, voice_keywords, voice_suitable, status, is_new, last_updated, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
           ON CONFLICT (id) DO NOTHING`,
          [
            q.id,
            q.question,
            q.answer,
            q.explanation,
            q.diagram || null,
            q.difficulty,
            JSON.stringify(q.tags || []),
            q.channel,
            q.subChannel || null,
            q.sourceUrl || null,
            q.videos ? JSON.stringify(q.videos) : null,
            q.companies ? JSON.stringify(q.companies) : null,
            q.eli5 || null,
            q.tldr || null,
            q.relevanceScore || null,
            q.relevanceDetails || null,
            q.jobTitleRelevance || null,
            q.experienceLevelTags ? JSON.stringify(q.experienceLevelTags) : null,
            q.voiceKeywords ? JSON.stringify(q.voiceKeywords) : null,
            q.voiceSuitable ? 1 : 0,
            'active',
            q.isNew ? 1 : 0,
            q.lastUpdated || null,
            q.createdAt || null
          ]
        );
        inserted++;
      } catch (e) {
        // Skip errors
      }
    }

    console.log(`  ${file}: ${inserted} questions`);
    total += inserted;
  }

  console.log(`\n✓ Total imported: ${total} questions`);

  const result = await pool.query('SELECT COUNT(*) as count FROM questions');
  console.log(`✓ Database now has: ${result.rows[0].count} questions`);

  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});