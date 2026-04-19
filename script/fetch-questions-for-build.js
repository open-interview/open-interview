/**
 * Generate static JSON files for GitHub Pages build from data/ directory.
 * No database required — reads committed data/ files.
 */
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = 'client/public/data';
const DATA_DIR = 'data';

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

  return { isValid: issues.length === 0, issues };
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
  console.log('=== Generating Static Data Files from data/ directory ===\n');

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // ── Load questions from data/questions/*.json ──────────────────────────────
  const questionsDir = path.join(DATA_DIR, 'questions');
  if (!fs.existsSync(questionsDir)) {
    console.error('❌ data/questions/ not found. Run: pnpm run data:export');
    process.exit(1);
  }

  console.log('📥 Loading questions from data/questions/...');
  const allQuestions = [];
  const channelFiles = fs.readdirSync(questionsDir).filter(f => f.endsWith('.json') && f !== '.gitkeep');
  for (const file of channelFiles) {
    const questions = JSON.parse(fs.readFileSync(path.join(questionsDir, file), 'utf8'));
    allQuestions.push(...questions);
  }
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
    }
  }
  console.log(`   ✓ Accepted: ${questions.length} | ✗ Rejected: ${rejected.length}`);

  // Group by channel and write channel files
  const channelData = {};
  for (const q of questions) {
    if (!channelData[q.channel]) {
      channelData[q.channel] = { questions: [], subChannels: new Set(), companies: new Set(), stats: { total: 0, beginner: 0, intermediate: 0, advanced: 0, newThisWeek: 0 } };
    }
    channelData[q.channel].questions.push(q);
    channelData[q.channel].subChannels.add(q.subChannel);
    channelData[q.channel].stats.total++;
    channelData[q.channel].stats[q.difficulty]++;
    if (isWithinLastWeek(q.createdAt)) channelData[q.channel].stats.newThisWeek++;
    if (q.companies) q.companies.forEach(c => channelData[q.channel].companies.add(c));
  }

  console.log('\n📝 Writing channel files...');
  const channelStats = [];
  for (const [channelId, data] of Object.entries(channelData)) {
    fs.writeFileSync(path.join(OUTPUT_DIR, `${channelId}.json`), JSON.stringify({ questions: data.questions, subChannels: Array.from(data.subChannels).sort(), companies: Array.from(data.companies).sort(), stats: data.stats }, null, 0));
    channelStats.push({ id: channelId, questionCount: data.stats.total, ...data.stats });
  }
  console.log(`   ✓ ${channelStats.length} channel files`);

  fs.writeFileSync(path.join(OUTPUT_DIR, 'channels.json'), JSON.stringify(channelStats, null, 0));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'all-questions.json'), JSON.stringify(questions.map(q => ({ id: q.id, question: q.question, channel: q.channel, subChannel: q.subChannel, difficulty: q.difficulty, tags: q.tags, companies: q.companies })), null, 0));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'stats.json'), JSON.stringify({ totalQuestions: questions.length, totalChannels: channelStats.length, channels: channelStats, lastUpdated: new Date().toISOString() }, null, 0));
  console.log('   ✓ channels.json, all-questions.json, stats.json');

  // ── Supplementary data from data/ files ───────────────────────────────────
  console.log('\n📥 Writing supplementary data files...');
  copyDataFile('flashcards/all.json',    'flashcards.json',         d => d, []);
  copyDataFile('certifications.json',    'certifications.json',     d => enrichCertifications(d, channelData), []);
  copyDataFile('tests.json',             'tests.json',              d => filterTests(d, questions), []);
  copyDataFile('coding-challenges.json', 'coding-challenges.json',  d => d, []);
  copyDataFile('learning-paths.json',    'learning-paths.json',     d => d, []);
  copyDataFile('voice-sessions.json',    'voice-sessions.json',     d => ({ sessions: Array.isArray(d) ? d : (d.sessions ?? []) }), { sessions: [] });

  generateInterviewerComments(OUTPUT_DIR);
  generateChangelog(OUTPUT_DIR, questions);

  // Pass-through files generated by other scripts — write empty fallback if absent
  for (const f of ['bot-activity.json', 'github-analytics.json', 'blog-posts.json', 'bot-monitor.json', 'similar-questions.json']) {
    const dest = path.join(OUTPUT_DIR, f);
    if (!fs.existsSync(dest)) {
      fs.writeFileSync(dest, JSON.stringify(f.includes('blog') ? {} : [], null, 0));
    }
  }

  console.log('\n✅ Static data files generated successfully!');
  console.log(`   Total questions: ${questions.length} | Channels: ${channelStats.length}`);
}

function copyDataFile(srcRelative, destFile, transform, fallback) {
  const src = path.join(DATA_DIR, srcRelative);
  try {
    const data = JSON.parse(fs.readFileSync(src, 'utf8'));
    const out = transform(data);
    fs.writeFileSync(path.join(OUTPUT_DIR, destFile), JSON.stringify(out, null, 0));
    const count = Array.isArray(out) ? out.length : (out.sessions?.length ?? Object.keys(out).length);
    console.log(`   ✓ ${destFile} (${count})`);
  } catch (e) {
    fs.writeFileSync(path.join(OUTPUT_DIR, destFile), JSON.stringify(fallback, null, 0));
    console.log(`   ⚠️ ${destFile}: using fallback (${e.message})`);
  }
}

function enrichCertifications(certs, channelData) {
  return certs.map(cert => {
    let questionCount = 0;
    if (cert.channelMappings?.length) {
      for (const m of cert.channelMappings) {
        const ch = channelData[m.channel];
        if (ch) {
          questionCount += m.subChannel
            ? ch.questions.filter(q => q.subChannel === m.subChannel).length
            : ch.questions.length;
        }
      }
    }
    if (questionCount === 0 && channelData[cert.id]) {
      questionCount = channelData[cert.id].questions.length;
    }
    const { channelMappings: _, ...rest } = cert;
    return { ...rest, questionCount };
  });
}

function filterTests(tests, questions) {
  const questionMap = new Map(questions.map(q => [q.id, q]));
  const isIrrelevant = q => {
    const t = (q.question || '').toLowerCase();
    return (t.includes('percentage') && t.includes('candidate')) || t.includes('the candidate') || t.includes('in the scenario') || t.length < 30;
  };
  return tests.map(t => ({
    ...t,
    questions: t.questions.filter(q => !isIrrelevant(q)).map(tq => {
      const orig = questionMap.get(tq.questionId);
      return orig ? { ...tq, channel: orig.channel, subChannel: orig.subChannel } : tq;
    })
  }));
}

function generateChangelog(OUTPUT_DIR, questions) {
  const entry = { date: new Date().toISOString().split('T')[0], type: 'feature', title: 'Platform Active', description: 'Questions served from static data files.', details: {} };
  fs.writeFileSync(path.join(OUTPUT_DIR, 'changelog.json'), JSON.stringify({ entries: [entry], stats: { totalQuestionsAdded: questions.length, totalQuestionsImproved: 0, lastUpdated: new Date().toISOString() } }, null, 0));
  console.log('   ✓ changelog.json');
}

function generateInterviewerComments(OUTPUT_DIR) {
  const comments = {
    skip: ["No worries, let's move on.", "That's fine, we'll skip this one.", "Okay, next question.", "Moving on — that's perfectly normal."],
    shuffle: ["Let's mix things up a bit.", "Switching to a different topic.", "Okay, let's try something different.", "Good idea to vary the questions."],
    quick_answer: ["Nice and concise — I like that.", "Quick and to the point!", "Good speed. Let's keep going.", "Efficient answer!"],
    long_pause: ["Take your time, there's no rush.", "It's okay to think it through.", "No pressure — think out loud if it helps.", "Still there? Take all the time you need."],
    retry: ["Let's give that one another shot.", "No problem, try again.", "Second attempt — you've got this.", "Let's revisit that question."],
    good_score: ["Excellent work! You're doing great.", "Strong performance — keep it up!", "Very impressive answers.", "You're well-prepared for this."],
    bad_score: ["Don't worry — practice makes perfect.", "Keep going, you're learning as you go.", "These are tough questions. Keep at it.", "Every attempt makes you better."],
    first_question: ["Let's get started! Take a breath and go.", "Here's your first question — good luck!", "Ready? Here we go.", "Interview starting — you've got this!"],
    last_question: ["Last one — finish strong!", "Final question coming up.", "Almost there — one more to go.", "Last question — give it your best!"],
    idle: ["Whenever you're ready.", "Take your time.", "No rush — I'm here when you're ready.", "Ready when you are."]
  };
  fs.writeFileSync(path.join(OUTPUT_DIR, 'interviewer-comments.json'), JSON.stringify(comments, null, 0));
  console.log('   ✓ interviewer-comments.json');
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
