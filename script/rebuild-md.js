/**
 * Backfill script: rebuild content/posts/<slug>.md for all blog posts.
 * Reads from data/blog-posts.json (primary) joined with DB for question text.
 * No API calls.
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
const JSON_PATH = path.resolve('data/blog-posts.json');

async function loadQuestions() {
  try {
    const r = await dbClient.execute('SELECT id, question, answer FROM questions');
    const map = {};
    r.rows.forEach(q => { map[q.id] = q; });
    return map;
  } catch {
    return {};
  }
}

async function main() {
  let written = 0, skipped = 0, warned = 0;

  // Load blog posts from JSON file (has full content)
  let posts = [];
  if (fs.existsSync(JSON_PATH)) {
    const raw = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
    posts = Array.isArray(raw) ? raw : raw.posts || Object.values(raw);
  }

  // Also load from DB to get any posts not in JSON
  try {
    const r = await dbClient.execute(
      `SELECT bp.*, q.question, q.answer FROM blog_posts bp LEFT JOIN questions q ON q.id = bp.question_id ORDER BY bp.created_at DESC`
    );
    // Merge: JSON posts take priority (they have full content), DB fills gaps
    const jsonSlugs = new Set(posts.map(p => p.blogSlug || p.slug));
    for (const row of r.rows) {
      const slug = row.slug;
      if (!jsonSlugs.has(slug)) {
        posts.push({
          id: row.id,
          question_id: row.question_id,
          blogTitle: row.title,
          blogSlug: row.slug,
          blogIntro: row.introduction,
          blogSections: typeof row.sections === 'string' ? JSON.parse(row.sections) : (row.sections || []),
          blogConclusion: row.conclusion,
          blogMeta: row.meta_description,
          channel: row.channel,
          difficulty: row.difficulty,
          tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || []),
          diagram: row.diagram,
          diagramLabel: row.diagram_label,
          funFact: row.fun_fact,
          quickReference: typeof row.quick_reference === 'string' ? JSON.parse(row.quick_reference) : (row.quick_reference || []),
          glossary: typeof row.glossary === 'string' ? JSON.parse(row.glossary) : (row.glossary || []),
          realWorldExample: typeof row.real_world_example === 'string' ? JSON.parse(row.real_world_example) : row.real_world_example,
          sources: typeof row.sources === 'string' ? JSON.parse(row.sources) : (row.sources || []),
          svgContent: typeof row.svg_content === 'string' ? JSON.parse(row.svg_content) : (row.svg_content || {}),
          images: typeof row.images === 'string' ? JSON.parse(row.images) : (row.images || []),
          createdAt: row.created_at,
          _question: row.question,
          _answer: row.answer,
        });
      }
    }
  } catch (err) {
    console.warn(`⚠️ DB load failed (using JSON only): ${err.message}`);
  }

  if (FILTER_ID) {
    posts = posts.filter(p => (p.id || p.question_id) === FILTER_ID || p.blogSlug === FILTER_ID);
  }

  if (!posts.length) {
    console.log('No blog posts found.');
    process.exit(0);
  }

  // Load questions from DB for Q&A section
  const questions = await loadQuestions();

  console.log(`Found ${posts.length} post(s). Mode: ${DRY_RUN ? 'dry-run' : VALIDATE_ONLY ? 'validate-only' : 'write'}`);

  if (!DRY_RUN && !VALIDATE_ONLY) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  for (const post of posts) {
    const slug = post.blogSlug || post.slug || post.id;
    const qid = post.question_id || post.id;
    const dbQ = questions[qid] || {};
    const question = {
      question: post._question || dbQ.question || '',
      answer: post._answer || dbQ.answer || '',
    };

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
