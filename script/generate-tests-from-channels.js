#!/usr/bin/env node
/**
 * Generate tests.json from existing channel question files.
 * Each test = N MCQ questions per channel, where each MCQ uses the
 * channel's existing question + answer as the correct option, and 3
 * randomly-picked other answers from the same channel as distractors.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', 'client', 'public', 'data');

const QUESTIONS_PER_TEST = 25;
const PASSING_SCORE = 70;

const channels = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'channels.json'), 'utf8'));

const channelNameMap = {};
try {
  const cfg = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'channels.json'), 'utf8'));
  for (const c of cfg) channelNameMap[c.id] = c.id;
} catch {}

function titleize(slug) {
  return slug
    .split('-')
    .map(w => w.length <= 3 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function truncate(str, n) {
  if (!str) return '';
  const clean = String(str).replace(/\s+/g, ' ').trim();
  return clean.length <= n ? clean : clean.slice(0, n - 1).trimEnd() + '…';
}

function buildTestForChannel(channelId) {
  const file = path.join(DATA_DIR, `${channelId}.json`);
  if (!fs.existsSync(file)) return null;
  let data;
  try { data = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
  const allQs = Array.isArray(data?.questions) ? data.questions : [];
  if (allQs.length < 8) return null;

  // Pick a balanced sample
  const sample = shuffle(allQs).slice(0, Math.min(QUESTIONS_PER_TEST, allQs.length));
  const answerPool = allQs.map(q => truncate(q.answer, 220)).filter(Boolean);

  const questions = sample.map((q, idx) => {
    const correct = truncate(q.answer, 220) || 'Refer to the explanation.';
    // Pick 3 distractors that are different from the correct
    const distractorCandidates = shuffle(answerPool.filter(a => a && a !== correct));
    const distractors = distractorCandidates.slice(0, 3);
    while (distractors.length < 3) distractors.push('None of the above');

    const options = shuffle([
      { id: 'a', text: correct, isCorrect: true },
      { id: 'b', text: distractors[0], isCorrect: false },
      { id: 'c', text: distractors[1], isCorrect: false },
      { id: 'd', text: distractors[2], isCorrect: false },
    ]).map((o, i) => ({ ...o, id: String.fromCharCode(97 + i) }));

    return {
      id: `${channelId}-q-${idx}`,
      questionId: q.id,
      question: q.question,
      type: 'single',
      options,
      explanation: q.explanation || q.answer || '',
      difficulty: ['beginner', 'intermediate', 'advanced'].includes(q.difficulty) ? q.difficulty : 'intermediate',
    };
  });

  const channelName = titleize(channelId);
  return {
    id: `test-${channelId}`,
    channelId,
    channelName,
    title: `${channelName} Knowledge Test`,
    description: `Test your understanding of ${channelName} with ${questions.length} questions.`,
    questions,
    passingScore: PASSING_SCORE,
    createdAt: new Date().toISOString(),
    version: 1,
  };
}

function main() {
  const tests = [];
  let skipped = 0;
  for (const ch of channels) {
    const t = buildTestForChannel(ch.id);
    if (t) tests.push(t);
    else skipped++;
  }
  const outDir = path.join(DATA_DIR, 'tests');
  fs.mkdirSync(outDir, { recursive: true });
  for (const t of tests) {
    fs.writeFileSync(path.join(outDir, `${t.channelId}.json`), JSON.stringify([t], null, 2));
  }

  // Write consolidated tests.json for downstream consumption
  fs.writeFileSync(path.join(DATA_DIR, 'tests.json'), JSON.stringify(tests, null, 0));
  console.log(`Wrote ${tests.length} tests (skipped ${skipped}) to ${outDir}/`);
  console.log(`   ✓ tests.json (${tests.length} tests)`);
}

main();
