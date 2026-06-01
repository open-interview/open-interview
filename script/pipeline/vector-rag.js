import fs from 'fs';
import path from 'path';
import embeddings from '../ai/providers/embeddings.js';

const VECTORS_DIR = path.join(process.cwd(), 'data', 'vectors');
const SIMILAR_FILE = path.join(process.cwd(), 'client', 'public', 'data', 'similar-questions.json');
const AGGREGATED_FILE = path.join(VECTORS_DIR, 'questions.json');

const _channelCache = new Map();

function vectorsFile(channel) {
  return path.join(VECTORS_DIR, `${channel}.json`);
}

function loadChannelEmbeddings(channel) {
  if (_channelCache.has(channel)) return _channelCache.get(channel);
  const file = vectorsFile(channel);
  try {
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    const entries = Array.isArray(raw) ? raw : [];
    _channelCache.set(channel, entries);
    return entries;
  } catch {
    _channelCache.set(channel, []);
    return [];
  }
}

function loadAllEmbeddings() {
  if (!fs.existsSync(VECTORS_DIR)) return [];
  const all = [];
  const files = fs.readdirSync(VECTORS_DIR).filter(f => f.endsWith('.json') && f !== 'questions.json');
  for (const f of files) {
    const channel = f.replace(/\.json$/, '');
    try {
      const entries = JSON.parse(fs.readFileSync(path.join(VECTORS_DIR, f), 'utf8'));
      if (Array.isArray(entries)) all.push(...entries);
    } catch {}
  }
  return all;
}

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * (b[i] || 0);
    normA += a[i] * a[i];
    normB += (b[i] || 0) * (b[i] || 0);
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export async function findSimilar(questionId, options = {}) {
  const { topK = 5, threshold = 0.15, channel } = options;
  const embeddingsList = channel ? loadChannelEmbeddings(channel) : loadAllEmbeddings();
  const target = embeddingsList.find(e => e.originalId === questionId || e.id === questionId);
  if (!target) return [];

  const scored = [];
  for (const emb of embeddingsList) {
    if (emb.originalId === questionId || emb.id === questionId) continue;
    if (channel && emb.channel !== channel) continue;
    const sim = cosineSimilarity(target.vector, emb.vector);
    if (sim >= threshold) {
      scored.push({ id: emb.originalId || emb.id, similarity: sim, channel: emb.channel });
    }
  }

  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, topK);
}

export async function computeAllSimilarities(options = {}) {
  const { topK = 5, threshold = 0.15, channel } = options;
  const embeddingsList = channel ? loadChannelEmbeddings(channel) : loadAllEmbeddings();
  const similarityMap = {};
  let processed = 0;

  const batch = channel
    ? embeddingsList.filter(e => e.channel === channel)
    : embeddingsList;

  for (const emb of batch) {
    const similar = await findSimilar(emb.originalId || emb.id, { topK, threshold, channel });
    if (similar.length > 0) {
      similarityMap[emb.originalId || emb.id] = similar;
    }
    processed++;
    if (processed % 100 === 0 || processed === batch.length) {
      process.stdout.write(`\r  Progress: ${processed}/${batch.length} questions`);
    }
  }

  const output = {
    generated: new Date().toISOString(),
    totalQuestions: batch.length,
    questionsWithSimilar: Object.keys(similarityMap).length,
    threshold, topK,
    similarities: similarityMap,
  };

  fs.writeFileSync(SIMILAR_FILE, JSON.stringify(output, null, 2));

  return output;
}

export function getEmbeddingCount() {
  return getStats().total;
}

export function getStats() {
  if (!fs.existsSync(VECTORS_DIR)) return { total: 0, channels: {}, channelCount: 0 };
  const files = fs.readdirSync(VECTORS_DIR).filter(f => f.endsWith('.json') && f !== 'questions.json');
  let total = 0;
  const channels = {};
  for (const f of files) {
    const channel = f.replace(/\.json$/, '');
    try {
      const entries = JSON.parse(fs.readFileSync(path.join(VECTORS_DIR, f), 'utf8'));
      const count = Array.isArray(entries) ? entries.length : 0;
      channels[channel] = count;
      total += count;
    } catch {
      channels[channel] = 0;
    }
  }
  return { total, channels, channelCount: Object.keys(channels).length };
}

export function getQuestionsNeedingEmbedding(allQuestions) {
  const embedded = new Set();
  if (fs.existsSync(VECTORS_DIR)) {
    const files = fs.readdirSync(VECTORS_DIR).filter(f => f.endsWith('.json') && f !== 'questions.json');
    for (const f of files) {
      try {
        const entries = JSON.parse(fs.readFileSync(path.join(VECTORS_DIR, f), 'utf8'));
        if (Array.isArray(entries)) {
          for (const e of entries) embedded.add(e.originalId || e.id);
        }
      } catch {}
    }
  }
  return allQuestions.filter(q => !embedded.has(q.id));
}

export async function saveEmbeddings(entries) {
  for (const entry of entries) {
    const channel = entry.channel || 'uncategorized';
    const file = vectorsFile(channel);
    let existing = [];
    try { existing = JSON.parse(fs.readFileSync(file, 'utf8')); } catch {}
    if (!Array.isArray(existing)) existing = [];

    const seen = new Set(existing.map(e => e.originalId || e.id));
    if (!seen.has(entry.originalId || entry.id)) {
      existing.push(entry);
    }
    if (!fs.existsSync(VECTORS_DIR)) fs.mkdirSync(VECTORS_DIR, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(existing, null, 2));
    _channelCache.delete(channel);
  }
}

export async function embedAndSave(question, channel) {
  if (!question || !question.id) return;
  const file = vectorsFile(channel);
  let existing = [];
  try { existing = JSON.parse(fs.readFileSync(file, 'utf8')); } catch {}
  if (!Array.isArray(existing)) existing = [];

  const textToEmbed = [question.question, question.answer, question.eli5, question.tldr]
    .filter(Boolean).join(' ').substring(0, 8000);

  const vector = await embeddings.embed(textToEmbed);
  const entry = {
    id: `vec-${question.id}`,
    originalId: question.id,
    vector,
    channel: channel || '',
  };

  const existingIdx = existing.findIndex(e => (e.originalId || e.id) === question.id);
  if (existingIdx >= 0) {
    existing[existingIdx] = entry;
  } else {
    existing.push(entry);
  }

  if (!fs.existsSync(VECTORS_DIR)) fs.mkdirSync(VECTORS_DIR, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(existing, null, 2));
  _channelCache.delete(channel);
}

export async function clearEmbeddings() {
  if (!fs.existsSync(VECTORS_DIR)) return;
  const files = fs.readdirSync(VECTORS_DIR).filter(f => f.endsWith('.json') && f !== 'questions.json');
  for (const f of files) {
    fs.writeFileSync(path.join(VECTORS_DIR, f), '[]');
  }
  _channelCache.clear();
}

export function rebuildAggregatedFile() {
  const all = loadAllEmbeddings();
  if (!fs.existsSync(VECTORS_DIR)) fs.mkdirSync(VECTORS_DIR, { recursive: true });
  fs.writeFileSync(AGGREGATED_FILE, JSON.stringify(all, null, 2));
  console.log(`  Rebuilt aggregated vector file: ${all.length} entries across all channels`);
  return all;
}

export function migrateMonolithicToPerChannel() {
  if (!fs.existsSync(AGGREGATED_FILE)) return { migrated: 0 };
  let raw;
  try { raw = JSON.parse(fs.readFileSync(AGGREGATED_FILE, 'utf8')); } catch { return { migrated: 0 }; }
  if (!Array.isArray(raw)) return { migrated: 0 };

  const byChannel = {};
  for (const entry of raw) {
    const ch = entry.channel || 'uncategorized';
    if (!byChannel[ch]) byChannel[ch] = [];
    byChannel[ch].push(entry);
  }

  if (!fs.existsSync(VECTORS_DIR)) fs.mkdirSync(VECTORS_DIR, { recursive: true });

  let total = 0;
  for (const [ch, entries] of Object.entries(byChannel)) {
    const file = vectorsFile(ch);
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify(entries, null, 2));
      total += entries.length;
    }
  }

  if (total > 0) {
    console.log(`  Migrated ${total} vectors from monolithic file to per-channel files`);
  }
  return { migrated: total, channels: Object.keys(byChannel).length };
}

export function getAllChannelEmbeddings(channel) {
  return loadChannelEmbeddings(channel);
}
