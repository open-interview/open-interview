import fs from 'fs';
import path from 'path';
import { getQuestionsForChannel, getAllChannelsFromDb } from '../../utils.js';

const VOICE_FILE = path.join(process.cwd(), 'client', 'public', 'data', 'voice-sessions.json');

export const meta = {
  name: 'voice',
  description: 'Generate voice interview sessions from questions',
  defaultLimit: 50,
};

const TEMPLATES = {
  'system-design': [
    "What is the purpose of {kw} in system design?",
    "How does {kw} help with scalability?",
    "When would you use {kw}?",
    "What are the trade-offs of {kw}?",
    "How do {kw} work together?",
  ],
  'behavioral': [
    "Describe a situation involving {kw}.",
    "How did you handle {kw}?",
    "What was the outcome of {kw}?",
    "What did you learn about {kw}?",
    "How would you approach {kw} differently?",
  ],
  default: [
    "What is {kw}?",
    "How does {kw} work?",
    "Why is {kw} important?",
    "When would you use {kw}?",
    "What are the benefits of {kw}?",
  ],
};

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function extractTopic(question) {
  return question
    .replace(/^(what|how|why|when|explain|describe|tell me about)\s+/i, '')
    .replace(/\?$/, '').trim().substring(0, 50);
}

function extractAnswer(keywords, answer, explanation) {
  const text = `${answer} ${explanation}`.toLowerCase();
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const relevant = sentences.filter(s => keywords.some(k => s.includes(k.toLowerCase())));
  return (relevant.length > 0 ? relevant.slice(0, 2).join('. ') : answer.split(/[.!?]/)[0]).trim() + '.';
}

function loadExistingSessions() {
  try {
    const raw = JSON.parse(fs.readFileSync(VOICE_FILE, 'utf8'));
    if (Array.isArray(raw)) return raw;
    if (raw?.sessions && Array.isArray(raw.sessions)) return raw.sessions;
    return [];
  } catch { return []; }
}

function saveSessions(sessions) {
  fs.writeFileSync(VOICE_FILE, JSON.stringify({ sessions }, null, 2));
}

export async function run(channelId, options, stats) {
  const limit = options.limit || meta.defaultLimit;
  stats.startChannel(channelId);

  const questions = await getQuestionsForChannel(channelId);
  const suitable = questions.filter(q =>
    q.question && q.voiceSuitable &&
    q.voiceKeywords && q.voiceKeywords.length >= 4 &&
    q.status !== 'deleted'
  ).slice(0, limit);

  if (suitable.length === 0) {
    console.log(`  ⚠️  ${channelId}: no voice-suitable questions found`);
    stats.endChannel(channelId);
    return { processed: 0, errors: 0 };
  }

  const existing = loadExistingSessions();
  let created = 0;

  for (const q of suitable) {
    const keywords = typeof q.voiceKeywords === 'string' ? JSON.parse(q.voiceKeywords) : (q.voiceKeywords || []);
    if (keywords.length < 4) continue;

    const templates = TEMPLATES[q.channel] || TEMPLATES.default;
    const groups = chunk(keywords, 2);
    const microQuestions = groups.slice(0, 6).map((group, i) => ({
      id: `${q.id}-micro-${i + 1}`,
      question: templates[i % templates.length].replace('{kw}', group.join(' and ')),
      expectedAnswer: extractAnswer(group, q.answer || '', q.explanation || ''),
      keywords: group,
      difficulty: i < 2 ? 'easy' : i < 4 ? 'medium' : 'hard',
      order: i + 1,
    }));

    if (microQuestions.length < 3) continue;

    const sessionId = `vs-${channelId}-${q.id}`;
    const idx = existing.findIndex(s => s.id === sessionId);
    const session = {
      id: sessionId,
      topic: extractTopic(q.question),
      description: `Voice session for ${channelId}: ${extractTopic(q.question)}`,
      channel: channelId,
      difficulty: q.difficulty,
      questionIds: [q.id],
      totalQuestions: microQuestions.length,
      microQuestions,
      estimatedMinutes: microQuestions.length * 2,
      lastUpdated: new Date().toISOString(),
    };

    if (idx >= 0) existing[idx] = session;
    else existing.push(session);
    created++;
  }

  saveSessions(existing);
  console.log(`  ✅ ${channelId}: created/updated ${created} sessions`);

  stats.endChannel(channelId);
  return { processed: created, errors: 0 };
}

export async function runBatch(channelIds, options, stats) {
  let total = 0;
  for (const ch of channelIds) {
    const r = await run(ch, options, stats);
    total += r.processed;
  }
  return { processed: total, errors: 0 };
}

export default { meta, run, runBatch };
