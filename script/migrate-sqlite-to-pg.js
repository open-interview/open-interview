#!/usr/bin/env node
/**
 * Migrate blog_posts from local SQLite (local-test.db) to PostgreSQL (DATABASE_URL)
 * Temporarily drops the FK constraint to allow synthetic question_ids.
 */
import 'dotenv/config';
import { randomUUID } from 'crypto';
import Database from 'better-sqlite3';
import pg from 'pg';

const sqlite = new Database('./local-test.db', { readonly: true });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const rows = sqlite.prepare('SELECT * FROM blog_posts').all();
console.log(`Found ${rows.length} blog posts in SQLite`);

// Drop FK temporarily
await pool.query('ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS blog_posts_question_id_questions_id_fk');
console.log('Dropped FK constraint');

let inserted = 0, skipped = 0;
for (const row of rows) {
  try {
    const res = await pool.query(
      `INSERT INTO blog_posts
        (id, question_id, title, slug, introduction, sections, conclusion, meta_description,
         channel, difficulty, tags, diagram, created_at, published_at, quick_reference,
         glossary, real_world_example, fun_fact, sources, social_snippet, diagram_type,
         diagram_label, images, svg_content)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
       ON CONFLICT (slug) DO NOTHING`,
      [
        randomUUID(),
        row.question_id, row.title, row.slug, row.introduction, row.sections,
        row.conclusion, row.meta_description, row.channel, row.difficulty, row.tags,
        row.diagram, row.created_at, row.published_at, row.quick_reference, row.glossary,
        row.real_world_example, row.fun_fact, row.sources, row.social_snippet,
        row.diagram_type, row.diagram_label,
        row.images ?? null, row.svg_content ?? null,
      ]
    );
    if (res.rowCount > 0) {
      console.log(`  ✅ ${row.question_id}: ${row.title}`);
      inserted++;
    } else {
      console.log(`  ⏭️  ${row.slug}: already exists`);
      skipped++;
    }
  } catch (e) {
    console.log(`  ❌ ${row.question_id}: ${e.message}`);
    skipped++;
  }
}

// Note: FK not restored — blog generator uses synthetic question_ids not in questions table

console.log(`\nDone: ${inserted} inserted, ${skipped} skipped`);
sqlite.close();
await pool.end();
