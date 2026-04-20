/**
 * Export all content from PostgreSQL to data/ directory for static builds.
 * Run after content updates: pnpm run data:export
 * Commit the data/ directory so CI/CD builds work without a DB.
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { dbClient as client, getPool } from './db/pg-client.js';

function write(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

async function main() {
  console.log('=== Exporting data to data/ directory ===\n');

  // ── Questions ──────────────────────────────────────────────────────────────
  const qRows = (await client.execute('SELECT * FROM questions ORDER BY channel, sub_channel, id')).rows;
  console.log(`Fetched ${qRows.length} questions`);
  const byChannel = {};
  for (const row of qRows) {
    const ch = row.channel;
    if (!byChannel[ch]) byChannel[ch] = [];
    byChannel[ch].push({
      id: row.id, question: row.question, answer: row.answer,
      explanation: row.explanation, diagram: row.diagram, difficulty: row.difficulty,
      tags: row.tags ? JSON.parse(row.tags) : [],
      channel: row.channel, subChannel: row.sub_channel, sourceUrl: row.source_url,
      videos: row.videos ? JSON.parse(row.videos) : null,
      companies: row.companies ? JSON.parse(row.companies) : null,
      eli5: row.eli5,
      voiceKeywords: row.voice_keywords ? JSON.parse(row.voice_keywords) : null,
      voiceSuitable: row.voice_suitable, isNew: row.is_new,
      lastUpdated: row.last_updated, createdAt: row.created_at,
    });
  }
  const channelStats = [];
  for (const [channel, questions] of Object.entries(byChannel)) {
    write(`data/questions/${channel}.json`, questions);
    console.log(`  ✓ questions/${channel}.json (${questions.length})`);
    channelStats.push({ id: channel, questionCount: questions.length });
  }
  write('data/meta/channels.json', channelStats);

  // ── Flashcards ─────────────────────────────────────────────────────────────
  try {
    const fcRows = (await client.execute('SELECT * FROM flashcards ORDER BY channel, created_at DESC')).rows;
    const flashcards = fcRows.map(r => ({
      id: r.id, questionId: r.question_id, channel: r.channel, difficulty: r.difficulty,
      tags: r.tags ? JSON.parse(r.tags) : [],
      front: r.front, back: r.back, hint: r.hint, mnemonic: r.mnemonic,
      createdAt: r.created_at,
    }));
    write('data/flashcards/all.json', flashcards);
    console.log(`  ✓ flashcards/all.json (${flashcards.length})`);
  } catch (e) { console.log(`  ⚠️ flashcards: ${e.message}`); }

  // ── Certifications ─────────────────────────────────────────────────────────
  try {
    const certRows = (await client.execute(`SELECT * FROM certifications WHERE status = 'active' ORDER BY name`)).rows;
    const certs = certRows.map(r => ({
      id: r.id, name: r.name, provider: r.provider, description: r.description,
      icon: r.icon, color: r.color, difficulty: r.difficulty, category: r.category,
      estimatedHours: r.estimated_hours, examCode: r.exam_code, officialUrl: r.official_url,
      domains: r.domains ? JSON.parse(r.domains) : [],
      prerequisites: r.prerequisites ? JSON.parse(r.prerequisites) : [],
      passingScore: r.passing_score, examDuration: r.exam_duration,
      channelMappings: r.channel_mappings ? JSON.parse(r.channel_mappings) : [],
      createdAt: r.created_at, lastUpdated: r.last_updated,
    }));
    write('data/certifications.json', certs);
    console.log(`  ✓ certifications.json (${certs.length})`);
  } catch (e) { console.log(`  ⚠️ certifications: ${e.message}`); }

  // ── Tests ──────────────────────────────────────────────────────────────────
  try {
    const testRows = (await client.execute('SELECT * FROM tests ORDER BY channel_name')).rows;
    const tests = testRows.map(r => ({
      id: r.id, channelId: r.channel_id, channelName: r.channel_name,
      title: r.title, description: r.description,
      questions: r.questions ? JSON.parse(r.questions) : [],
      passingScore: r.passing_score || 70,
      createdAt: r.created_at, lastUpdated: r.last_updated, version: r.version || 1,
    }));
    write('data/tests.json', tests);
    console.log(`  ✓ tests.json (${tests.length})`);
  } catch (e) { console.log(`  ⚠️ tests: ${e.message}`); }

  // ── Coding Challenges ──────────────────────────────────────────────────────
  try {
    const ccRows = (await client.execute('SELECT * FROM coding_challenges ORDER BY category, difficulty, id')).rows;
    const challenges = ccRows.map(r => ({
      id: r.id, title: r.title, description: r.description,
      difficulty: r.difficulty, category: r.category,
      tags: r.tags ? JSON.parse(r.tags) : [],
      companies: r.companies ? JSON.parse(r.companies) : [],
      starterCode: { javascript: r.starter_code_js, python: r.starter_code_py },
      testCases: r.test_cases ? JSON.parse(r.test_cases) : [],
      hints: r.hints ? JSON.parse(r.hints) : [],
      solution: { javascript: r.solution_js, python: r.solution_py },
      complexity: { time: r.complexity_time, space: r.complexity_space, explanation: r.complexity_explanation },
      timeLimit: r.time_limit || 15, createdAt: r.created_at,
    }));
    write('data/coding-challenges.json', challenges);
    console.log(`  ✓ coding-challenges.json (${challenges.length})`);
  } catch (e) { console.log(`  ⚠️ coding-challenges: ${e.message}`); }

  // ── Learning Paths ─────────────────────────────────────────────────────────
  try {
    const lpRows = (await client.execute('SELECT * FROM learning_paths ORDER BY title')).rows;
    const paths = lpRows.map(r => ({
      id: r.id, title: r.title, description: r.description,
      channel: r.channel, difficulty: r.difficulty, estimatedHours: r.estimated_hours,
      questionIds: r.question_ids ? JSON.parse(r.question_ids) : [],
      tags: r.tags ? JSON.parse(r.tags) : [],
      createdAt: r.created_at,
    }));
    write('data/learning-paths.json', paths);
    console.log(`  ✓ learning-paths.json (${paths.length})`);
  } catch (e) { console.log(`  ⚠️ learning-paths: ${e.message}`); }

  // ── Voice Sessions ─────────────────────────────────────────────────────────
  try {
    const vsRows = (await client.execute('SELECT * FROM voice_sessions ORDER BY channel, created_at DESC')).rows;
    const sessions = vsRows.map(r => ({
      id: r.id, topic: r.topic, description: r.description,
      channel: r.channel, difficulty: r.difficulty,
      questionIds: r.question_ids ? JSON.parse(r.question_ids) : [],
      totalQuestions: r.total_questions, estimatedMinutes: r.estimated_minutes,
      createdAt: r.created_at,
    }));
    write('data/voice-sessions.json', sessions);
    console.log(`  ✓ voice-sessions.json (${sessions.length})`);
  } catch (e) { console.log(`  ⚠️ voice-sessions: ${e.message}`); }

  // ── Blog Posts ─────────────────────────────────────────────────────────────
  try {
    const bpRows = (await client.execute('SELECT * FROM blog_posts ORDER BY created_at DESC')).rows;
    const posts = bpRows.map(r => ({
      id: r.id, questionId: r.question_id, title: r.title, slug: r.slug,
      introduction: r.introduction, sections: r.sections, conclusion: r.conclusion,
      metaDescription: r.meta_description, channel: r.channel, difficulty: r.difficulty,
      tags: r.tags, diagram: r.diagram, quickReference: r.quick_reference,
      glossary: r.glossary, realWorldExample: r.real_world_example,
      funFact: r.fun_fact, sources: r.sources, socialSnippet: r.social_snippet,
      diagramType: r.diagram_type, diagramLabel: r.diagram_label,
      images: r.images, svgContent: r.svg_content,
      createdAt: r.created_at, publishedAt: r.published_at,
    }));
    write('data/blog-posts.json', posts);
    console.log(`  ✓ blog-posts.json (${posts.length})`);
  } catch (e) { console.log(`  ⚠️ blog-posts: ${e.message}`); }

  console.log('\n✅ Export complete. Commit the data/ directory.');
  await getPool().end();
}

main().catch(err => { console.error(err); process.exit(1); });
