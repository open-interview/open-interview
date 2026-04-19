/**
 * Fetch questions from SQLite database and generate static JSON files for GitHub Pages build.
 * This script runs during the build process to embed all questions into the static site.
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { dbClient as client } from './db/pg-client.js';

const OUTPUT_DIR = 'client/public/data';

/**
 * Quality Gate: Validate question format
 * Prevents malformed questions from being included in build
 */
function validateQuestionFormat(question) {
  const issues = [];
  
  // Check for multiple-choice format in answer field (wrong format)
  if (question.answer && question.answer.startsWith('[{')) {
    issues.push('Multiple-choice format in text answer field');
  }
  
  // Check for missing required fields
  if (!question.question || question.question.length < 10) {
    issues.push('Question text too short or missing');
  }
  
  if (!question.answer || question.answer.length < 10) {
    issues.push('Answer text too short or missing');
  }
  
  // Check for placeholder content
  const placeholders = ['TODO', 'FIXME', 'TBD', 'placeholder', 'lorem ipsum'];
  const content = `${question.question} ${question.answer}`.toLowerCase();
  if (placeholders.some(p => content.includes(p.toLowerCase()))) {
    issues.push('Contains placeholder content');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

function parseQuestionRow(row) {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    explanation: row.explanation,
    diagram: row.diagram,
    difficulty: row.difficulty,
    tags: row.tags ? JSON.parse(row.tags) : [],
    channel: row.channel,
    subChannel: row.sub_channel,
    sourceUrl: row.source_url,
    videos: row.videos ? JSON.parse(row.videos) : null,
    companies: row.companies ? JSON.parse(row.companies) : null,
    eli5: row.eli5,
    relevanceScore: row.relevance_score,
    voiceKeywords: row.voice_keywords ? JSON.parse(row.voice_keywords) : null,
    voiceSuitable: row.voice_suitable === 1,
    isNew: row.is_new === 1, // Parse isNew flag from database
    lastUpdated: row.last_updated,
    createdAt: row.created_at,
  };
}

// Check if a date is within the last 7 days
function isWithinLastWeek(dateStr) {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return date >= weekAgo;
}

async function main() {
  console.log('=== Fetching Questions from SQLite database for Static Build ===\n');

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Fetch all questions
  console.log('📥 Fetching all questions...');
  const result = await client.execute('SELECT * FROM questions ORDER BY channel, sub_channel, id');
  const allQuestions = result.rows.map(parseQuestionRow);
  console.log(`   Found ${allQuestions.length} questions`);

  // Apply quality gate
  console.log('\n🔒 Applying quality gate...');
  const questions = [];
  const rejected = [];
  
  for (const q of allQuestions) {
    const validation = validateQuestionFormat(q);
    if (validation.isValid) {
      questions.push(q);
    } else {
      rejected.push({ id: q.id, issues: validation.issues });
      console.log(`   ❌ Rejected ${q.id}: ${validation.issues.join(', ')}`);
    }
  }
  
  console.log(`   ✓ Accepted: ${questions.length} questions`);
  console.log(`   ✗ Rejected: ${rejected.length} questions`);
  
  if (rejected.length > 0) {
    console.log('\n⚠️  Rejected questions need to be fixed in the database');
    console.log('   Run: node script/fix-cert-questions-with-bots.js');
  }

  // Group questions by channel
  const channelData = {};
  const channelStats = [];

  for (const q of questions) {
    if (!channelData[q.channel]) {
      channelData[q.channel] = {
        questions: [],
        subChannels: new Set(),
        companies: new Set(),
        stats: { total: 0, beginner: 0, intermediate: 0, advanced: 0, newThisWeek: 0 }
      };
    }
    
    channelData[q.channel].questions.push(q);
    channelData[q.channel].subChannels.add(q.subChannel);
    channelData[q.channel].stats.total++;
    channelData[q.channel].stats[q.difficulty]++;
    
    // Count questions added in the last week
    if (isWithinLastWeek(q.createdAt)) {
      channelData[q.channel].stats.newThisWeek++;
    }
    
    if (q.companies) {
      q.companies.forEach(c => channelData[q.channel].companies.add(c));
    }
  }

  // Write individual channel files
  console.log('\n📝 Writing channel files...');
  for (const [channelId, data] of Object.entries(channelData)) {
    const channelFile = path.join(OUTPUT_DIR, `${channelId}.json`);
    fs.writeFileSync(channelFile, JSON.stringify({
      questions: data.questions,
      subChannels: Array.from(data.subChannels).sort(),
      companies: Array.from(data.companies).sort(),
      stats: data.stats
    }, null, 0)); // Minified for production
    console.log(`   ✓ ${channelId}.json (${data.questions.length} questions)`);
    
    channelStats.push({
      id: channelId,
      questionCount: data.stats.total,
      ...data.stats
    });
  }

  // Write channels index
  const channelsFile = path.join(OUTPUT_DIR, 'channels.json');
  fs.writeFileSync(channelsFile, JSON.stringify(channelStats, null, 0));
  console.log(`   ✓ channels.json (${channelStats.length} channels)`);

  // Write all questions index (for search)
  const allQuestionsFile = path.join(OUTPUT_DIR, 'all-questions.json');
  const searchIndex = questions.map(q => ({
    id: q.id,
    question: q.question,
    channel: q.channel,
    subChannel: q.subChannel,
    difficulty: q.difficulty,
    tags: q.tags,
    companies: q.companies
  }));
  fs.writeFileSync(allQuestionsFile, JSON.stringify(searchIndex, null, 0));
  console.log(`   ✓ all-questions.json (search index)`);

  // Write stats
  const statsFile = path.join(OUTPUT_DIR, 'stats.json');
  fs.writeFileSync(statsFile, JSON.stringify({
    totalQuestions: questions.length,
    totalChannels: channelStats.length,
    channels: channelStats,
    lastUpdated: new Date().toISOString()
  }, null, 0));
  console.log(`   ✓ stats.json`);

  // Fetch all independent data sources in parallel
  console.log('\n📥 Fetching supplementary data in parallel...');
  await Promise.allSettled([
    fetchBotActivity(client, OUTPUT_DIR),
    fetchGithubAnalytics(client, OUTPUT_DIR),
    fetchTests(client, OUTPUT_DIR, questions),
    fetchCodingChallenges(client, OUTPUT_DIR),
    fetchFlashcards(client, OUTPUT_DIR),
    fetchChangelog(client, OUTPUT_DIR, questions),
    fetchBlogPosts(client, OUTPUT_DIR),
    fetchCertifications(client, OUTPUT_DIR),
  ]);

  console.log('\n✅ Static data files generated successfully!');
  console.log(`   Output directory: ${OUTPUT_DIR}`);
  console.log(`   Total questions: ${questions.length}`);
  console.log(`   Total channels: ${channelStats.length}`);
}

// ============================================
// PARALLEL FETCH HELPERS
// ============================================

async function fetchBotActivity(client, OUTPUT_DIR) {
  console.log('   📥 bot-activity...');
  try {
    const [activityResult, statsResult] = await Promise.all([
      client.execute(`
        WITH RankedActivity AS (
          SELECT w.id, w.item_type as botType, w.item_id as questionId, q.question as questionText,
                 q.channel, w.action, w.status, w.result, w.processed_at as completedAt,
                 ROW_NUMBER() OVER (PARTITION BY w.item_type, w.item_id ORDER BY w.processed_at DESC) as rn
          FROM work_queue w LEFT JOIN questions q ON w.item_id = q.id
          WHERE w.status IN ('completed', 'failed')
        )
        SELECT id, botType, questionId, questionText, channel, action, status, result, completedAt
        FROM RankedActivity WHERE rn = 1 ORDER BY completedAt DESC NULLS LAST LIMIT 100`),
      client.execute(`
        SELECT item_type as botType,
               SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
               SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
               MAX(processed_at) as lastRun
        FROM work_queue WHERE status IN ('completed', 'failed') GROUP BY item_type ORDER BY lastRun DESC NULLS LAST`)
    ]);

    const activities = activityResult.rows.map(row => ({
      id: row.id, botType: row.bottype, questionId: row.questionid,
      questionText: row.questiontext ? String(row.questiontext).substring(0, 100) : 'Unknown question',
      channel: row.channel || 'unknown', action: row.action || 'processed',
      status: row.status, completedAt: row.completedat
    }));
    const botStats = statsResult.rows.map(row => ({
      botType: row.bottype, completed: Number(row.completed) || 0,
      failed: Number(row.failed) || 0, lastRun: row.lastrun || new Date().toISOString()
    }));
    fs.writeFileSync(path.join(OUTPUT_DIR, 'bot-activity.json'), JSON.stringify({ activities, stats: botStats, lastUpdated: new Date().toISOString() }, null, 0));
    console.log(`   ✓ bot-activity.json (${activities.length} activities)`);
  } catch (e) {
    console.log(`   ⚠️ bot-activity: ${e.message}`);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'bot-activity.json'), JSON.stringify({ activities: [], stats: [], lastUpdated: new Date().toISOString() }, null, 0));
  }
}

async function fetchGithubAnalytics(client, OUTPUT_DIR) {
  console.log('   📥 github-analytics...');
  try {
    const [viewsResult, referrersResult, repoStatsResult] = await Promise.all([
      client.execute(`SELECT date, repo, metric_type, metric_name, count, uniques FROM github_analytics WHERE metric_type IN ('views', 'clones') ORDER BY date DESC LIMIT 60`),
      client.execute(`SELECT metric_name as referrer, count, uniques FROM github_analytics WHERE metric_type = 'referrer' AND date = (SELECT MAX(date) FROM github_analytics WHERE metric_type = 'referrer') ORDER BY count DESC LIMIT 10`),
      client.execute(`SELECT repo, metric_name, count FROM github_analytics WHERE metric_type = 'repo_stat' AND date = (SELECT MAX(date) FROM github_analytics WHERE metric_type = 'repo_stat')`)
    ]);
    const viewsByDate = {}, clonesByDate = {};
    for (const row of viewsResult.rows) {
      const date = row.date;
      if (row.metric_type === 'views') { if (!viewsByDate[date]) viewsByDate[date] = { count: 0, uniques: 0 }; viewsByDate[date].count += Number(row.count) || 0; viewsByDate[date].uniques += Number(row.uniques) || 0; }
      else if (row.metric_type === 'clones') { if (!clonesByDate[date]) clonesByDate[date] = { count: 0, uniques: 0 }; clonesByDate[date].count += Number(row.count) || 0; clonesByDate[date].uniques += Number(row.uniques) || 0; }
    }
    const views = Object.entries(viewsByDate).map(([date, data]) => ({ date, ...data })).sort((a, b) => a.date.localeCompare(b.date));
    const clones = Object.entries(clonesByDate).map(([date, data]) => ({ date, ...data })).sort((a, b) => a.date.localeCompare(b.date));
    const referrers = referrersResult.rows.map(row => ({ referrer: row.referrer, count: Number(row.count) || 0, uniques: Number(row.uniques) || 0 }));
    const repoStats = {};
    for (const row of repoStatsResult.rows) { if (!repoStats[row.repo]) repoStats[row.repo] = {}; repoStats[row.repo][row.metric_name] = Number(row.count) || 0; }
    fs.writeFileSync(path.join(OUTPUT_DIR, 'github-analytics.json'), JSON.stringify({ views, clones, referrers, repoStats, lastUpdated: new Date().toISOString() }, null, 0));
    console.log(`   ✓ github-analytics.json (${views.length} days)`);
  } catch (e) {
    console.log(`   ⚠️ github-analytics: ${e.message}`);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'github-analytics.json'), JSON.stringify({ views: [], clones: [], referrers: [], repoStats: {}, lastUpdated: new Date().toISOString() }, null, 0));
  }
}

async function fetchTests(client, OUTPUT_DIR, questions) {
  console.log('   📥 tests...');
  try {
    const testsResult = await client.execute(`SELECT id, channel_id, channel_name, title, description, questions, passing_score, created_at, last_updated, version FROM tests ORDER BY channel_name`);
    const questionMap = new Map(questions.map(q => [q.id, q]));
    const isIrrelevantQuestion = (q) => { const text = (q.question || '').toLowerCase(); return (text.includes('percentage') && text.includes('candidate')) || (text.includes('the candidate') && text.includes('when')) || text.includes('in the scenario') || text.includes('in this case') || text.length < 30; };
    const tests = testsResult.rows.map(row => {
      const allQuestions = JSON.parse(row.questions);
      const filteredQuestions = allQuestions.filter(q => !isIrrelevantQuestion(q)).map(tq => { const orig = questionMap.get(tq.questionId); return orig ? { ...tq, channel: orig.channel, subChannel: orig.subChannel } : { ...tq, channel: tq.channel || row.channel_id, subChannel: tq.subChannel || 'general' }; });
      return { id: row.id, channelId: row.channel_id, channelName: row.channel_name, title: row.title, description: row.description, questions: filteredQuestions, passingScore: row.passing_score || 70, createdAt: row.created_at, lastUpdated: row.last_updated, version: row.version || 1 };
    });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'tests.json'), JSON.stringify(tests, null, 0));
    console.log(`   ✓ tests.json (${tests.length} tests)`);
  } catch (e) {
    console.log(`   ⚠️ tests: ${e.message}`);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'tests.json'), JSON.stringify([], null, 0));
  }
}

async function fetchCodingChallenges(client, OUTPUT_DIR) {
  console.log('   📥 coding-challenges...');
  try {
    const result = await client.execute(`SELECT id, title, description, difficulty, category, tags, companies, starter_code_js, starter_code_py, test_cases, hints, solution_js, solution_py, complexity_time, complexity_space, complexity_explanation, time_limit, created_at FROM coding_challenges ORDER BY category, difficulty, id`);
    const challenges = result.rows.map(row => ({ id: row.id, title: row.title, description: row.description, difficulty: row.difficulty, category: row.category, tags: row.tags ? JSON.parse(row.tags) : [], companies: row.companies ? JSON.parse(row.companies) : [], starterCode: { javascript: row.starter_code_js, python: row.starter_code_py }, testCases: row.test_cases ? JSON.parse(row.test_cases) : [], hints: row.hints ? JSON.parse(row.hints) : [], solution: { javascript: row.solution_js, python: row.solution_py }, complexity: { time: row.complexity_time, space: row.complexity_space, explanation: row.complexity_explanation }, timeLimit: row.time_limit || 15, createdAt: row.created_at }));
    fs.writeFileSync(path.join(OUTPUT_DIR, 'coding-challenges.json'), JSON.stringify(challenges, null, 0));
    console.log(`   ✓ coding-challenges.json (${challenges.length} challenges)`);
  } catch (e) {
    console.log(`   ⚠️ coding-challenges: ${e.message}`);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'coding-challenges.json'), JSON.stringify([], null, 0));
  }
}

async function fetchFlashcards(client, OUTPUT_DIR) {
  console.log('   📥 flashcards...');
  try {
    const result = await client.execute(`SELECT id, question_id, channel, difficulty, tags, front, back, hint, mnemonic, created_at FROM flashcards ORDER BY channel, created_at DESC`);
    const flashcards = result.rows.map(row => ({ id: row.id, questionId: row.question_id, channel: row.channel, difficulty: row.difficulty, tags: row.tags ? JSON.parse(row.tags) : [], front: row.front, back: row.back, hint: row.hint, mnemonic: row.mnemonic, createdAt: row.created_at }));
    fs.writeFileSync(path.join(OUTPUT_DIR, 'flashcards.json'), JSON.stringify(flashcards, null, 0));
    console.log(`   ✓ flashcards.json (${flashcards.length} flashcards)`);
  } catch (e) {
    console.error(`   ❌ flashcards FAILED: ${e.message}`);
    throw e;  // fail loudly — empty flashcards.json must not be committed
  }
}

async function fetchChangelog(client, OUTPUT_DIR, questions) {
  console.log('   📥 changelog...');
  try {
    const [changelogResult, totals] = await Promise.all([
      client.execute(`SELECT DATE(processed_at::timestamptz) as date, item_type as bot_type, COUNT(*) as count, STRING_AGG(DISTINCT q.channel, ',') as channels FROM work_queue w LEFT JOIN questions q ON w.item_id = q.id WHERE w.status = 'completed' AND processed_at::timestamptz >= NOW() - INTERVAL '30 days' GROUP BY DATE(processed_at::timestamptz), item_type ORDER BY date DESC, count DESC`),
      client.execute(`SELECT SUM(CASE WHEN action = 'new question created' THEN 1 ELSE 0 END) as added, SUM(CASE WHEN action != 'new question created' THEN 1 ELSE 0 END) as improved FROM work_queue WHERE status = 'completed'`)
    ]);

    const entriesByDate = {};
    for (const row of changelogResult.rows) {
      const date = row.date;
      if (!entriesByDate[date]) entriesByDate[date] = { date, questionsAdded: 0, questionsImproved: 0, channels: new Set(), activities: [] };
      const entry = entriesByDate[date];
      const channels = row.channels ? row.channels.split(',').filter(Boolean) : [];
      channels.forEach(c => entry.channels.add(c));
      if (row.bot_type === 'generate' || row.bot_type === 'coding-challenge' || row.bot_type === 'question') { entry.questionsAdded += Number(row.count) || 0; entry.activities.push({ type: row.bot_type, action: 'added', count: Number(row.count) || 0 }); }
      else { entry.questionsImproved += Number(row.count) || 0; entry.activities.push({ type: row.bot_type, action: 'improved', count: Number(row.count) || 0 }); }
    }
    const changelogEntries = Object.values(entriesByDate).filter(e => e.questionsAdded > 0 || e.questionsImproved > 0).map(e => ({ date: e.date, type: e.questionsAdded > 0 ? 'added' : 'improved', title: e.questionsAdded > 0 ? `${e.questionsAdded} new question${e.questionsAdded > 1 ? 's' : ''} added` : `${e.questionsImproved} question${e.questionsImproved > 1 ? 's' : ''} improved`, description: `Bot activity on ${e.date}`, details: { questionsAdded: e.questionsAdded, questionsImproved: e.questionsImproved, channels: Array.from(e.channels), activities: e.activities } })).slice(0, 30);
    const changelog = { entries: changelogEntries.length > 0 ? changelogEntries : [{ date: new Date().toISOString().split('T')[0], type: 'feature', title: 'Platform Active', description: 'Questions served from SQLite database.', details: {} }], stats: { totalQuestionsAdded: Number(totals.rows[0]?.added) || questions.length, totalQuestionsImproved: Number(totals.rows[0]?.improved) || 0, lastUpdated: new Date().toISOString() } };
    fs.writeFileSync(path.join(OUTPUT_DIR, 'changelog.json'), JSON.stringify(changelog, null, 0));
    console.log(`   ✓ changelog.json (${changelogEntries.length} entries)`);
  } catch (e) {
    console.log(`   ⚠️ changelog: ${e.message}`);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'changelog.json'), JSON.stringify({ entries: [{ date: new Date().toISOString().split('T')[0], type: 'feature', title: 'Platform Active', description: 'Questions served from database.', details: {} }], stats: { totalQuestionsAdded: questions.length, totalQuestionsImproved: 0, lastUpdated: new Date().toISOString() } }, null, 0));
  }
}

async function fetchBlogPosts(client, OUTPUT_DIR) {
  console.log('   📥 blog-posts...');
  try {
    const result = await client.execute(`SELECT question_id, title, slug FROM blog_posts ORDER BY created_at DESC`);
    const blogPosts = {};
    for (const row of result.rows) blogPosts[row.question_id] = { title: row.title, slug: row.slug, url: `/posts/${row.question_id}/${row.slug}/` };
    fs.writeFileSync(path.join(OUTPUT_DIR, 'blog-posts.json'), JSON.stringify(blogPosts, null, 0));
    console.log(`   ✓ blog-posts.json (${Object.keys(blogPosts).length} posts)`);
  } catch (e) {
    console.log(`   ⚠️ blog-posts: ${e.message}`);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'blog-posts.json'), JSON.stringify({}, null, 0));
  }
}

async function fetchCertifications(client, OUTPUT_DIR) {
  console.log('   📥 certifications...');
  try {
    const certsResult = await client.execute(`SELECT id, name, provider, description, icon, color, difficulty, category, estimated_hours, exam_code, official_url, domains, prerequisites, status, question_count, passing_score, exam_duration, created_at, last_updated, channel_mappings FROM certifications WHERE status = 'active' ORDER BY name`);
    const certifications = await Promise.all(certsResult.rows.map(async (row) => {
      let questionCount = 0;
      try {
        if (row.channel_mappings) {
          const channelMappings = JSON.parse(row.channel_mappings);
          const counts = await Promise.all(channelMappings.map(mapping => client.execute({ sql: mapping.subChannel ? `SELECT COUNT(*) as count FROM questions WHERE channel = ? AND sub_channel = ? AND status = 'active'` : `SELECT COUNT(*) as count FROM questions WHERE channel = ? AND status = 'active'`, args: mapping.subChannel ? [mapping.channel, mapping.subChannel] : [mapping.channel] })));
          questionCount = counts.reduce((sum, r) => sum + (r.rows[0]?.count || 0), 0);
        }
        if (questionCount === 0) { const r = await client.execute({ sql: `SELECT COUNT(*) as count FROM questions WHERE channel = ? AND status = 'active'`, args: [row.id] }); questionCount = r.rows[0]?.count || 0; }
      } catch (e) { /* ignore */ }
      return { id: row.id, name: row.name, provider: row.provider, description: row.description, icon: row.icon || 'award', color: row.color || 'text-primary', difficulty: row.difficulty, category: row.category, estimatedHours: row.estimated_hours || 40, examCode: row.exam_code, officialUrl: row.official_url, domains: row.domains ? JSON.parse(row.domains) : [], prerequisites: row.prerequisites ? JSON.parse(row.prerequisites) : [], questionCount, passingScore: row.passing_score || 70, examDuration: row.exam_duration || 90, createdAt: row.created_at, lastUpdated: row.last_updated };
    }));
    fs.writeFileSync(path.join(OUTPUT_DIR, 'certifications.json'), JSON.stringify(certifications, null, 0));
    console.log(`   ✓ certifications.json (${certifications.length} certifications)`);
  } catch (e) {
    console.log(`   ⚠️ certifications: ${e.message}`);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'certifications.json'), JSON.stringify([], null, 0));
  }
}

main().catch(e => {
  if (e.code === 'SQLITE_NOTADB' || e.code === 'URL_INVALID' || e.message?.includes('not a database') || e.message?.includes('SQLITE')) {
    console.warn(`⚠️  DB error: ${e.message}. Build will continue with empty data.`);
    process.exit(0);
  }
  console.error('Fatal:', e);
  process.exit(1);
});
