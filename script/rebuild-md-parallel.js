/**
 * Parallel MD rebuilder — splits 121 posts across N workers and runs them concurrently.
 * Usage: node script/rebuild-md-parallel.js [--workers 20]
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { fileURLToPath } from 'url';
import { dbClient } from './db/pg-client.js';
import { serializeMD, validateMD } from './ai/utils/md-serializer.js';

const __filename = fileURLToPath(import.meta.url);
const OUT_DIR = path.resolve('content/posts');

// ── Worker thread ─────────────────────────────────────────────────────────────
if (!isMainThread) {
  const { posts, questions } = workerData;
  const results = { written: 0, skipped: 0, warned: 0, files: [] };

  fs.mkdirSync(OUT_DIR, { recursive: true });

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
      results.skipped++;
      parentPort.postMessage({ type: 'error', slug, msg: err.message });
      continue;
    }

    const { valid, errors, warnings } = validateMD(mdString);

    if (warnings.length) {
      results.warned++;
      parentPort.postMessage({ type: 'warn', slug, warnings });
    }

    if (!valid) {
      results.skipped++;
      parentPort.postMessage({ type: 'invalid', slug, errors });
      continue;
    }

    const mdPath = path.join(OUT_DIR, `${slug}.md`);
    fs.writeFileSync(mdPath, mdString, 'utf-8');
    results.written++;
    results.files.push(slug);
    parentPort.postMessage({ type: 'ok', slug });
  }

  parentPort.postMessage({ type: 'done', results });
  process.exit(0);
}

// ── Main thread ───────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const wIdx = args.indexOf('--workers');
const NUM_WORKERS = wIdx !== -1 ? parseInt(args[wIdx + 1]) : 20;

async function main() {
  const JSON_PATH = path.resolve('data/blog-posts.json');
  let posts = [];

  if (fs.existsSync(JSON_PATH)) {
    const raw = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
    posts = Array.isArray(raw) ? raw : raw.posts || Object.values(raw);
  }

  // Merge DB posts not in JSON
  try {
    const r = await dbClient.execute(
      `SELECT bp.*, q.question, q.answer FROM blog_posts bp LEFT JOIN questions q ON q.id = bp.question_id ORDER BY bp.created_at DESC`
    );
    const jsonSlugs = new Set(posts.map(p => p.blogSlug || p.slug));
    for (const row of r.rows) {
      if (!jsonSlugs.has(row.slug)) {
        posts.push({
          id: row.id, question_id: row.question_id,
          blogTitle: row.title, blogSlug: row.slug,
          blogIntro: row.introduction,
          blogSections: typeof row.sections === 'string' ? JSON.parse(row.sections) : (row.sections || []),
          sections: typeof row.sections === 'string' ? JSON.parse(row.sections) : (row.sections || []),
          blogConclusion: row.conclusion, conclusion: row.conclusion,
          blogMeta: row.meta_description, meta_description: row.meta_description,
          channel: row.channel, difficulty: row.difficulty,
          tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || []),
          diagram: row.diagram, diagramLabel: row.diagram_label,
          funFact: row.fun_fact, fun_fact: row.fun_fact,
          quickReference: typeof row.quick_reference === 'string' ? JSON.parse(row.quick_reference) : (row.quick_reference || []),
          glossary: typeof row.glossary === 'string' ? JSON.parse(row.glossary) : (row.glossary || []),
          realWorldExample: typeof row.real_world_example === 'string' ? JSON.parse(row.real_world_example) : row.real_world_example,
          sources: typeof row.sources === 'string' ? JSON.parse(row.sources) : (row.sources || []),
          svgContent: typeof row.svg_content === 'string' ? JSON.parse(row.svg_content) : (row.svg_content || {}),
          images: typeof row.images === 'string' ? JSON.parse(row.images) : (row.images || []),
          createdAt: row.created_at,
          _question: row.question, _answer: row.answer,
        });
      }
    }
  } catch (err) {
    console.warn(`⚠️ DB load failed (using JSON only): ${err.message}`);
  }

  // Load questions map
  let questions = {};
  try {
    const r = await dbClient.execute('SELECT id, question, answer FROM questions');
    r.rows.forEach(q => { questions[q.id] = q; });
  } catch {}

  console.log(`\n🚀 Rebuilding ${posts.length} posts with ${NUM_WORKERS} parallel workers\n`);
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Split posts into N batches
  const batches = Array.from({ length: NUM_WORKERS }, () => []);
  posts.forEach((p, i) => batches[i % NUM_WORKERS].push(p));

  const totals = { written: 0, skipped: 0, warned: 0 };
  const startTime = Date.now();

  await Promise.all(
    batches.map((batch, idx) => {
      if (!batch.length) return Promise.resolve();
      return new Promise((resolve, reject) => {
        const worker = new Worker(__filename, {
          workerData: { posts: batch, questions },
        });

        worker.on('message', msg => {
          if (msg.type === 'ok') process.stdout.write(`  ✓ [w${idx + 1}] ${msg.slug}\n`);
          else if (msg.type === 'warn') process.stdout.write(`  ⚠ [w${idx + 1}] ${msg.slug}: ${msg.warnings.join(', ')}\n`);
          else if (msg.type === 'invalid') process.stdout.write(`  ✗ [w${idx + 1}] ${msg.slug}: ${msg.errors.join(', ')}\n`);
          else if (msg.type === 'error') process.stdout.write(`  ✗ [w${idx + 1}] ${msg.slug}: ${msg.msg}\n`);
          else if (msg.type === 'done') {
            totals.written += msg.results.written;
            totals.skipped += msg.results.skipped;
            totals.warned += msg.results.warned;
          }
        });

        worker.on('error', reject);
        worker.on('exit', code => {
          if (code !== 0) reject(new Error(`Worker ${idx + 1} exited with code ${code}`));
          else resolve();
        });
      });
    })
  );

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✅ Done in ${elapsed}s — ${totals.written} written, ${totals.skipped} skipped, ${totals.warned} with warnings`);
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
