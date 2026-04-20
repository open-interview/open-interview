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

  // Import flashcards
  const FC_FILE = 'data/flashcards/all.json';
  if (fs.existsSync(FC_FILE)) {
    const flashcards = JSON.parse(fs.readFileSync(FC_FILE, 'utf8'));
    let fcInserted = 0;
    for (const f of flashcards) {
      await pool.query(
        `INSERT INTO flashcards (id, question_id, channel, difficulty, tags, front, back, hint, mnemonic, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (id) DO NOTHING`,
        [f.id, f.questionId, f.channel, f.difficulty,
         JSON.stringify(f.tags ?? []), f.front, f.back, f.hint ?? null, f.mnemonic ?? null,
         f.createdAt, f.updatedAt ?? null]
      );
      fcInserted++;
    }
    console.log(`✓ Imported ${fcInserted} flashcards`);
  }

  // Import blog posts
  const BP_FILE = 'data/blog-posts.json';
  if (fs.existsSync(BP_FILE)) {
    const posts = JSON.parse(fs.readFileSync(BP_FILE, 'utf8'));
    let bpInserted = 0;
    for (const p of posts) {
      await pool.query(
        `INSERT INTO blog_posts (
          id, question_id, title, slug, introduction, sections, conclusion,
          meta_description, channel, difficulty, tags, diagram, quick_reference,
          glossary, real_world_example, fun_fact, sources, social_snippet,
          diagram_type, diagram_label, images, svg_content, created_at, published_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
        ON CONFLICT (id) DO NOTHING`,
        [
          p.id, p.questionId, p.title, p.slug, p.introduction, p.sections, p.conclusion,
          p.metaDescription, p.channel, p.difficulty, p.tags, p.diagram, p.quickReference,
          p.glossary, p.realWorldExample, p.funFact, p.sources, p.socialSnippet,
          p.diagramType, p.diagramLabel, p.images, p.svgContent,
          p.createdAt, p.publishedAt ?? null,
        ]
      );
      bpInserted++;
    }
    console.log(`✓ Imported ${bpInserted} blog posts`);
  }

  await pool.end();
}

main().catch(err => { console.error(err); process.exit(1); });
