/**
 * Blog Topic Discovery Agent
 *
 * Scans the question bank and identifies worthy topics for blog posts.
 * Prioritizes topics with real-world grounding potential.
 */

import fs from 'fs';
import path from 'path';

const QUESTIONS_DIR = path.resolve(process.cwd(), 'data/questions');
const CHANNELS_FILE = path.resolve(process.cwd(), 'data/meta/channels.json');

const BLOG_CHANNELS = [
  'system-design', 'backend', 'frontend', 'devops', 'database',
  'ai-ml', 'security', 'cloud', 'performance-testing', 'engineering'
];

const DIFFICULTY_PREFERENCE = ['intermediate', 'advanced', 'expert'];

function loadQuestions() {
  if (!fs.existsSync(QUESTIONS_DIR)) return [];
  const files = fs.readdirSync(QUESTIONS_DIR).filter(f => f.endsWith('.json'));
  const questions = [];
  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(QUESTIONS_DIR, file), 'utf-8'));
      const items = Array.isArray(data) ? data : data.questions || [];
      questions.push(...items);
    } catch { /* skip malformed */ }
  }
  return questions;
}

function loadChannels() {
  if (!fs.existsSync(CHANNELS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(CHANNELS_FILE, 'utf-8'));
  } catch { return []; }
}

function scoreTopicWorthiness(question) {
  let score = 0;
  const answer = (question.answer || '').length;
  const explanation = (question.explanation || '').length;
  const hasDiagram = !!question.diagram;
  const companies = Array.isArray(question.companies) ? question.companies : [];
  const tags = Array.isArray(question.tags) ? question.tags : [];

  if (answer > 200) score += 20;
  if (explanation > 200) score += 15;
  if (hasDiagram) score += 15;
  if (companies.length > 0) score += companies.length * 5;
  if (tags.length > 2) score += 5;

  const hasRealWorldPotential = /netflix|uber|stripe|google|aws|meta|shopify|airbnb|linkedin|twitter|spotify|slack|doordash|github|microsoft/i.test(
    (question.question || '') + (question.answer || '')
  );
  if (hasRealWorldPotential) score += 20;

  return score;
}

export async function discoverTopics(options = {}) {
  const {
    count = 10,
    channels = BLOG_CHANNELS,
    minScore = 30,
    excludeIds = []
  } = options;

  console.log('\n🔍 [TOPIC AGENT] Discovering worthy blog topics...\n');

  const questions = loadQuestions();
  const channelData = loadChannels();
  const channelNames = channelData.reduce((acc, c) => {
    acc[c.id] = c.name;
    return acc;
  }, {});

  console.log(`   Found ${questions.length} questions in question bank`);

  const scored = questions
    .filter(q => {
      const channel = q.channel || q.subChannel || '';
      return channels.includes(channel) && !excludeIds.includes(q.id);
    })
    .map(q => ({
      ...q,
      topicScore: scoreTopicWorthiness(q)
    }))
    .filter(q => q.topicScore >= minScore)
    .sort((a, b) => b.topicScore - a.topicScore);

  console.log(`   ${scored.length} questions meet minimum score threshold\n`);

  const channelBuckets = {};
  for (const q of scored) {
    const channel = q.channel || 'general';
    if (!channelBuckets[channel]) channelBuckets[channel] = [];
    channelBuckets[channel].push(q);
  }

  const selected = [];
  const usedChannels = new Set();
  const channelKeys = Object.keys(channelBuckets);
  const targetPerChannel = Math.ceil(count / channelKeys.length);

  for (const channel of channelKeys) {
    const bucket = channelBuckets[channel];
    const take = Math.min(targetPerChannel, bucket.length, count - selected.length);
    for (let i = 0; i < take && selected.length < count; i++) {
      const item = bucket[i];
      selected.push({
        id: item.id,
        question: item.question,
        answer: item.answer,
        explanation: item.explanation,
        channel: item.channel || channel,
        difficulty: item.difficulty || 'intermediate',
        tags: Array.isArray(item.tags) ? item.tags : [],
        companies: Array.isArray(item.companies) ? item.companies : [],
        diagram: item.diagram || null,
        topicScore: item.topicScore,
        channelName: channelNames[channel] || channel
      });
      usedChannels.add(channel);
    }
  }

  if (selected.length < count) {
    const remaining = scored.filter(q => !selected.some(s => s.id === q.id));
    for (const q of remaining) {
      if (selected.length >= count) break;
      selected.push({
        id: q.id,
        question: q.question,
        answer: q.answer,
        explanation: q.explanation,
        channel: q.channel || 'general',
        difficulty: q.difficulty || 'intermediate',
        tags: Array.isArray(q.tags) ? q.tags : [],
        companies: Array.isArray(q.companies) ? q.companies : [],
        diagram: q.diagram || null,
        topicScore: q.topicScore,
        channelName: channelNames[q.channel] || q.channel
      });
    }
  }

  console.log(`\n📋 Selected ${selected.length} topics for blog generation:\n`);
  for (const topic of selected) {
    console.log(`   [${topic.channel}] (${topic.topicScore}pts) ${topic.question.substring(0, 80)}...`);
  }
  console.log();

  return selected;
}

export default { discoverTopics };
