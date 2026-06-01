import fs from 'fs';
import path from 'path';
import { generateBlogPost } from '../../ai/graphs/blog-graph.js';
import { getQuestionsForChannel, getAllChannelsFromDb } from '../../utils.js';

const BLOG_DIR = path.join(process.cwd(), 'content', 'posts');

export const meta = {
  name: 'blog',
  description: 'Generate blog posts from interview questions',
  defaultLimit: 5,
  defaultConcurrency: 3,
};

export async function run(channelId, options, stats) {
  stats.startChannel(channelId);
  const limit = options.limit || meta.defaultLimit;

  const questions = await getQuestionsForChannel(channelId);
  const candidates = questions
    .filter(q => q.question && q.answer && q.status !== 'deleted')
    .slice(0, limit);

  if (candidates.length === 0) {
    console.log(`  ⚠️  ${channelId}: no valid questions found`);
    stats.endChannel(channelId);
    return { processed: 0, errors: 0 };
  }

  let processed = 0;
  for (const q of candidates) {
    try {
      const slug = q.question.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 80) || `post-${q.id}`;

      const outPath = path.join(BLOG_DIR, `${slug}.md`);
      if (fs.existsSync(outPath) && !options.force) {
        console.log(`  ⏭️  ${slug} — already exists (use --force to overwrite)`);
        continue;
      }

      const post = await generateBlogPost({
        question: q.question,
        answer: q.answer,
        explanation: q.explanation,
        channel: q.channel,
        tags: q.tags || [],
        difficulty: q.difficulty,
      });

      if (!post) {
        console.log(`  ❌ ${q.id}: blog generation returned empty`);
        continue;
      }

      const frontmatter = [
        '---',
        `title: "${(post.title || q.question).replace(/"/g, '\\"')}"`,
        `excerpt: "${(post.excerpt || '').replace(/"/g, '\\"')}"`,
        `date: ${new Date().toISOString().split('T')[0]}`,
        `tags: [${(post.tags || q.tags || []).map(t => `"${t}"`).join(', ')}]`,
        `difficulty: ${q.difficulty || 'intermediate'}`,
        `channel: "${q.channel}"`,
        '---',
        '',
      ].join('\n');

      const content = frontmatter + (post.content || post.body || '');
      fs.writeFileSync(outPath, content);
      processed++;
      console.log(`  ✅ ${q.id}: ${slug}`);

      stats.recordAttempt(channelId, { ok: true, durationMs: 0 });
    } catch (err) {
      console.log(`  ❌ ${q.id}: ${err.message}`);
      stats.recordAttempt(channelId, { ok: false, error: err.message, durationMs: 0 });
    }
  }

  stats.endChannel(channelId);
  return { processed, errors: candidates.length - processed };
}

export async function runBatch(channelIds, options, stats) {
  let totalProcessed = 0;
  let totalErrors = 0;
  for (const ch of channelIds) {
    const result = await run(ch, options, stats);
    totalProcessed += result.processed;
    totalErrors += result.errors;
  }
  return { processed: totalProcessed, errors: totalErrors };
}

export default { meta, run, runBatch, runWorkerPool };

export async function runWorkerPool(channelIds, options, stats) {
  const { detectOptimalWorkers, runWorkerPool } = await import('../workers.js');
  const concurrency = options.concurrency || meta.defaultConcurrency;
  const workers = options.workers || detectOptimalWorkers();
  const limit = Math.ceil((options.limit || meta.defaultLimit) / Math.max(1, channelIds.length));

  const allQuestions = [];
  for (const ch of channelIds) {
    const qs = await getQuestionsForChannel(ch);
    for (const q of qs.filter(q => q.question && q.answer && q.status !== 'deleted').slice(0, limit)) {
      allQuestions.push({ ...q, _channel: ch });
    }
  }

  let serial = 0;
  const results = await runWorkerPool(allQuestions, async (q) => {
    serial++;
    const tag = (q.question || q.id || '').substring(0, 50).replace(/\s+\?.*$/, '').trim();
    console.log(`  [${serial}/${allQuestions.length}] (${Math.floor(serial / allQuestions.length * 100)}%) ${tag}`);

    const slug = q.question.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 80) || `post-${q.id}`;
    const outPath = path.join(BLOG_DIR, `${slug}.md`);
    if (fs.existsSync(outPath) && !options.force) return { skipped: true };

    try {
      const post = await generateBlogPost({
        question: q.question, answer: q.answer, explanation: q.explanation,
        channel: q._channel || q.channel, tags: q.tags || [], difficulty: q.difficulty,
      });
      if (!post) return { error: 'empty response' };

      const frontmatter = [
        '---',
        `title: "${(post.title || q.question).replace(/"/g, '\\"')}"`,
        `excerpt: "${(post.excerpt || '').replace(/"/g, '\\"')}"`,
        `date: ${new Date().toISOString().split('T')[0]}`,
        `tags: [${(post.tags || q.tags || []).map(t => `"${t}"`).join(', ')}]`,
        `difficulty: ${q.difficulty || 'intermediate'}`,
        `channel: "${q._channel || q.channel}"`,
        '---', '',
      ].join('\n');
      fs.writeFileSync(outPath, frontmatter + (post.content || post.body || ''));
      return { ok: true };
    } catch (err) {
      return { error: err.message };
    }
  }, workers);

  const ok = results.filter(r => r?.ok).length;
  const err = results.filter(r => r?.error).length;
  return { processed: ok, errors: err };
}
