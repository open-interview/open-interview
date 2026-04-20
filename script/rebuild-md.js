/**
 * Backfill script: rebuild content/posts/<slug>.md for all blog_posts rows.
 * No API calls — reads from DB only.
 *
 * Usage:
 *   node script/rebuild-md.js                   → rebuild all posts
 *   node script/rebuild-md.js --id q-1266       → rebuild one post by question_id
 *   node script/rebuild-md.js --dry-run         → print first post MD to stdout, no files written
 *   node script/rebuild-md.js --validate-only   → validate all, report issues, no write
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { dbClient } from './db/pg-client.js';
import { serializeMD, validateMD } from './ai/utils/md-serializer.js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const VALIDATE_ONLY = args.includes('--validate-only');
const idIdx = args.indexOf('--id');
const FILTER_ID = idIdx !== -1 ? args[idIdx + 1] : null;

const OUT_DIR = path.resolve('content/posts');

function mapRow(row) {
  return {
    id: row.id,
    question_id: row.question_id,
    blogTitle: row.title,
    title: row.title,
    blogSlug: row.slug,
    slug: row.slug,
    blogIntro: row.introduction,
    introduction: row.introduction,
    blogSections: row.sections,
    sections: row.sections,
    blogConclusion: row.conclusion,
    conclusion: row.conclusion,
    blogMeta: row.meta_description,
    meta_description: row.meta_description,
    channel: row.channel,
    difficulty: row.difficulty,
    tags: row.tags,
    diagram: row.diagram,
    diagramLabel: row.diagram_label,
    diagram_label: row.diagram_label,
    funFact: row.fun_fact,
    fun_fact: row.fun_fact,
    quickReference: row.quick_reference,
    quick_reference: row.quick_reference,
    glossary: row.glossary,
    realWorldExample: row.real_world_example,
    real_world_example: row.real_world_example,
    sources: row.sources,
    svgContent: row.svg_content,
    svg_content: row.svg_content,
    images: row.images,
    createdAt: row.created_at,
    category: row.category || '',
  };
}

async function main() {
  let written = 0, skipped = 0, warned = 0;

  // Build query
  let sql = `SELECT bp.*, q.question, q.answer
             FROM blog_posts bp
             LEFT JOIN questions q ON q.id = bp.question_id
             ORDER BY bp.created_at DESC`;
  const sqlArgs = [];

  if (FILTER_ID) {
    sql = `SELECT bp.*, q.question, q.answer
           FROM blog_posts bp
           LEFT JOIN questions q ON q.id = bp.question_id
           WHERE bp.question_id = ?
           ORDER BY bp.created_at DESC`;
    sqlArgs.push(FILTER_ID);
  }

  const result = await dbClient.execute({ sql, args: sqlArgs });
  const rows = result.rows;

  if (!rows.length) {
    console.log('No blog posts found.');
    process.exit(0);
  }

  console.log(`Found ${rows.length} post(s). Mode: ${DRY_RUN ? 'dry-run' : VALIDATE_ONLY ? 'validate-only' : 'write'}`);

  if (!DRY_RUN && !VALIDATE_ONLY) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  for (const row of rows) {
    const post = mapRow(row);
    const question = { question: row.question, answer: row.answer };
    const slug = post.blogSlug || post.slug || post.id;

    let mdString;
    try {
      mdString = serializeMD(post, question);
    } catch (err) {
      console.error(`  ✗ [${slug}] serializeMD failed: ${err.message}`);
      skipped++;
      continue;
    }

    const { valid, errors, warnings } = validateMD(mdString);

    if (warnings.length) {
      warned++;
      warnings.forEach(w => console.warn(`  ⚠ [${slug}] ${w}`));
    }

    if (!valid) {
      errors.forEach(e => console.error(`  ✗ [${slug}] ${e}`));
      skipped++;
      continue;
    }

    if (DRY_RUN) {
      console.log('\n' + '─'.repeat(60));
      console.log(`DRY RUN — ${slug}.md`);
      console.log('─'.repeat(60));
      console.log(mdString);
      // Only print first post in dry-run
      break;
    }

    if (VALIDATE_ONLY) {
      console.log(`  ✓ [${slug}] valid`);
      written++;
      continue;
    }

    const mdPath = path.join(OUT_DIR, `${slug}.md`);
    fs.writeFileSync(mdPath, mdString, 'utf-8');
    console.log(`  📄 ${mdPath}`);
    written++;
  }

  console.log(`\nDone. ${written} ${VALIDATE_ONLY ? 'valid' : 'written'}, ${skipped} skipped, ${warned} with warnings.`);
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
