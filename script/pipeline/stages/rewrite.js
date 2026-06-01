import { join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import ai from '../../ai/index.js';
import { embedAndSave } from '../vector-rag.js';

const DATA_DIR = join(process.cwd(), 'client', 'public', 'data');

export const meta = {
  name: 'rewrite',
  description: 'Rewrite question/answer/eli5/tldr fields to reduce cognitive load',
  defaultFields: ['question', 'answer', 'eli5', 'tldr'],
  defaultMinScore: 70,
};

export async function run(channelId, options, stats) {
  const fields = options.fields ?? meta.defaultFields;
  const limit = options.limit ?? 200;
  const minScore = options.minScore ?? meta.defaultMinScore;
  const dryRun = options.dryRun ?? false;

  stats.startChannel(channelId);

  const questions = readChannelFile(channelId);
  if (questions.length === 0) {
    stats.endChannel(channelId);
    return { processed: 0, skipped: 0, errors: 0 };
  }

  const candidates = questions
    .filter(q => {
      if (!q.question || !q.answer) return false;
      if (q.relevanceScore != null && q.relevanceScore >= minScore) return false;
      return true;
    })
    .slice(0, limit);

  if (candidates.length === 0) {
    stats.endChannel(channelId);
    return { processed: 0, skipped: questions.length, errors: 0 };
  }

  const dataPath = join('client', 'public', 'data', `${channelId}.json`);

  let serial = 0;
  let processed = 0, errors = 0;

  for (const q of candidates) {
    const t0 = Date.now();
    const rewritten = await rewriteQuestion(q, fields);

    if (!dryRun) {
      serial++;
      const tag = (q.question || q.id || '').substring(0, 50).replace(/\s+\?.*$/, '').trim();
      console.log(`  [${serial}/${candidates.length}] (${Math.floor(serial / candidates.length * 100)}%) ${tag}`);
    }

    if (!rewritten) {
      stats.recordAttempt(channelId, { ok: false, error: 'no content', durationMs: Date.now() - t0 });
      continue;
    }

    writeIncremental(channelId, q.id, rewritten);
    const updatedQuestion = { ...q, ...rewritten };
    embedAndSave(updatedQuestion, channelId).catch(() => {});
    stats.recordAttempt(channelId, { ok: true, fields: rewritten, durationMs: Date.now() - t0 });
    processed++;
  }

  const finalUpdated = readChannelFile(channelId).map(q => {
    const match = candidates.find(c => c.id === q.id);
    if (!match) return q;
    const rewritten = match;
    const result = {};
    let changed = false;
    for (const f of fields) {
      if (rewritten[f] && rewritten[f] !== q[f]) {
        result[f] = rewritten[f];
        changed = true;
      }
    }
    if (!changed) return q;
    return { ...q, ...result, lastRewritten: new Date().toISOString(), rewriteVersion: (q.rewriteVersion || 0) + 1 };
  });

  if (!dryRun) {
    writeChannelFile(channelId, finalUpdated);
  }

  stats.endChannel(channelId);
  return { processed, skipped: questions.length - candidates.length, errors };
}

function readChannelFile(channel) {
  const p = join(DATA_DIR, `${channel}.json`);
  if (!existsSync(p)) return [];
  try {
    const raw = JSON.parse(readFileSync(p, 'utf8'));
    return Array.isArray(raw) ? raw : (raw.questions || []);
  } catch { return []; }
}

function writeChannelFile(channel, questions) {
  const p = join(DATA_DIR, `${channel}.json`);
  let existing = {};
  try { existing = JSON.parse(readFileSync(p, 'utf8')); } catch {}
  if (Array.isArray(existing)) {
    writeFileSync(p, JSON.stringify(questions, null, 2));
  } else {
    writeFileSync(p, JSON.stringify({ ...existing, questions }, null, 2));
  }
}

function writeIncremental(channel, id, rewritten) {
  try {
    const fpath = join(DATA_DIR, `${channel}.json`);
    let raw = JSON.parse(readFileSync(fpath, 'utf8'));
    const arr = Array.isArray(raw) ? raw : raw.questions;
    const idx = arr.findIndex(d => d.id === id);
    if (idx >= 0) {
      arr[idx] = { ...arr[idx], ...rewritten, lastRewritten: new Date().toISOString(), rewriteVersion: (arr[idx].rewriteVersion || 0) + 1 };
      writeFileSync(fpath, JSON.stringify(Array.isArray(raw) ? arr : { ...raw, questions: arr }, null, 2));
    }
  } catch {}
}

async function rewriteQuestion(q, fields) {
  const activeFields = fields.filter(f => Boolean(q[f]));
  if (activeFields.length === 0) return null;

  const rewriteSchema = ai.getTemplate('rewrite').schema;
  const expectedSchema = {};
  for (const f of ['question', 'answer']) {
    if (rewriteSchema[f]) expectedSchema[f] = rewriteSchema[f];
  }

  const result = await ai.run('rewrite', {
    question:   q.question,
    answer:     q.answer,
    eli5:       q.eli5,
    tldr:       q.tldr,
    channel:    q.channel,
    difficulty: q.difficulty,
    fields:     activeFields,
  }, { cache: false, schema: expectedSchema });

  const out = {};
  for (const f of activeFields) {
    if (result[f]) out[f] = result[f];
  }
  return Object.keys(out).length > 0 ? out : null;
}

export default { meta, run };
