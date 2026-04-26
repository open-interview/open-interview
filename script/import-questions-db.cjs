const path = require('path');
const fs = require('fs');
const { getPool } = require('../script/db/pg-client.js');

const pool = getPool();

async function main() {
  console.log('=== Importing questions to PostgreSQL ===\n');

  const files = fs.readdirSync('data/questions').filter(f => f.endsWith('.json'));
  let total = 0;

  for (const file of files) {
    const questions = JSON.parse(fs.readFileSync(path.join('data/questions', file), 'utf8'));
    let inserted = 0;

    for (const q of questions) {
      try {
        await pool.query(
          `INSERT INTO questions (id, question, answer, explanation, diagram, difficulty, tags, channel, sub_channel, source_url, videos, companies, eli5, voice_keywords, voice_suitable, is_new, last_updated, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
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
            q.voiceKeywords ? JSON.stringify(q.voiceKeywords) : null,
            q.voiceSuitable ? 1 : 0,
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

  console.log(`\nTotal imported: ${total} questions`);

  const result = await pool.query('SELECT COUNT(*) as count FROM questions');
  console.log(`Database now has: ${result.rows[0].count} questions`);

  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});