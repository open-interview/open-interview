import { join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import embeddings from '../../ai/providers/embeddings.js';

const VECTORS_DIR = join(process.cwd(), 'data', 'vectors');
const DATA_DIR = join(process.cwd(), 'client', 'public', 'data');

if (!existsSync(VECTORS_DIR)) {
  mkdirSync(VECTORS_DIR, { recursive: true });
}

export const meta = {
  name: 'embed',
  description: 'Backfill vector embeddings for unembedded questions',
};

export async function run(channelId, options, stats) {
  const limit = options.limit ?? Infinity;
  stats.startChannel(channelId);

  const questions = readChannelFile(channelId);
  if (questions.length === 0) {
    stats.endChannel(channelId);
    return { processed: 0, errors: 0 };
  }

  const unembedded = getUnembeddedQuestions(questions, channelId);
  const candidates = unembedded.slice(0, limit);

  if (candidates.length === 0) {
    stats.endChannel(channelId);
    return { processed: 0, skipped: questions.length, errors: 0 };
  }

  const batchSize = 50;
  let processed = 0, errors = 0;

  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize);
    try {
      const texts = batch.map(q =>
        [q.question, q.answer, q.eli5, q.tldr]
          .filter(Boolean).join(' ').substring(0, 8000)
      );
      const vectors = await embeddings.embedBatch(texts);

      const file = vectorsFile(channelId);
      let existing = [];
      try { existing = JSON.parse(readFileSync(file, 'utf8')); } catch {}
      if (!Array.isArray(existing)) existing = [];
      const existingMap = new Map(existing.map(e => [e.originalId || e.id, e]));

      for (let j = 0; j < batch.length; j++) {
        existingMap.set(batch[j].id, {
          id: `vec-${batch[j].id}`,
          originalId: batch[j].id,
          vector: vectors[j],
          channel: channelId,
        });
      }

      writeFileSync(file, JSON.stringify(Array.from(existingMap.values()), null, 2));

      processed += batch.length;
      for (let j = 0; j < batch.length; j++) {
        const tag = (batch[j].question || batch[j].id || '').substring(0, 50).replace(/\s+\?.*$/, '').trim();
        const idx = i + j + 1;
        console.log(`  [${idx}/${candidates.length}] (${Math.floor(idx / candidates.length * 100)}%) ${tag}`);
      }
    } catch (e) {
      errors += batch.length;
      stats.recordAttempt(channelId, { ok: false, error: e.message, durationMs: 0 });
    }
  }

  stats.endChannel(channelId);
  return { processed, errors, before: questions.length - processed, after: questions.length };
}

export async function runBatch(channelIds, options, stats) {
  let totalProcessed = 0, totalErrors = 0;

  for (const ch of channelIds) {
    const result = await run(ch, options, stats);
    totalProcessed += result.processed;
    totalErrors += result.errors;
  }

  return { processed: totalProcessed, errors: totalErrors };
}

function vectorsFile(channel) {
  return join(VECTORS_DIR, `${channel}.json`);
}

function readChannelFile(channel) {
  const p = join(DATA_DIR, `${channel}.json`);
  if (!existsSync(p)) return [];
  try {
    const raw = JSON.parse(readFileSync(p, 'utf8'));
    return Array.isArray(raw) ? raw : (raw.questions || []);
  } catch { return []; }
}

function getUnembeddedQuestions(questions, channelId) {
  const vectorFile = vectorsFile(channelId);
  let existingIds = new Set();
  try {
    const raw = JSON.parse(readFileSync(vectorFile, 'utf8'));
    if (Array.isArray(raw)) {
      existingIds = new Set(raw.map(e => e.originalId || e.id));
    }
  } catch {}
  return questions.filter(q => q.question && q.answer && !existingIds.has(q.id));
}

export default { meta, run, runBatch };
