#!/usr/bin/env node
import { getAllUnifiedQuestions } from './utils.js';

const args = process.argv.slice(2).reduce((acc, arg, i, arr) => {
  if (arg.startsWith('--')) acc[arg.slice(2)] = arr[i + 1] ?? true;
  return acc;
}, {});

const PRACTICE_URL = 'https://open-interview.github.io/';
const BLOG_BASE    = 'https://open-interview.github.io';

function slug(title) {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 60);
}

function channelEmoji(ch) {
  return { sre:'📈', devops:'⚙️', kubernetes:'☸️', aws:'☁️', terraform:'🏗️',
           security:'🔐', 'system-design':'🏗️', 'generative-ai':'🤖',
           frontend:'🎨', backend:'🔧', database:'🗄️' }[ch] || '📝';
}

function truncate(str, n) { return str?.length > n ? str.slice(0, n - 3) + '...' : str; }

async function fetchQuestion() {
  const allQuestions = await getAllUnifiedQuestions();
  const questions = allQuestions.filter(q => q.status !== 'deleted');

  if (process.argv.includes('--id')) {
    const id = process.argv[process.argv.indexOf('--id') + 1];
    return questions.find(q => q.id === id);
  } else if (process.argv.includes('--channel')) {
    const channel = process.argv[process.argv.indexOf('--channel') + 1];
    const filtered = questions.filter(q => q.channel === channel);
    return filtered[Math.floor(Math.random() * filtered.length)];
  } else {
    const channels = ['sre','devops','kubernetes','aws','terraform','security','system-design'];
    const filtered = questions.filter(q => channels.includes(q.channel));
    return filtered[Math.floor(Math.random() * filtered.length)];
  }
}

function simulateBlogContext(q) {
  const lines = (q.explanation || '').split('\n')
    .map(l => l.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim())
    .filter(l => l.startsWith('- ') || l.startsWith('• '))
    .map(l => l.replace(/^[-•]\s*/, ''))
    .slice(0, 4);

  const quickReference = lines.length ? lines.join(' | ') : q.answer?.slice(0, 120);

  const socialHook = `${channelEmoji(q.channel)} ${q.question.split('?')[0]}?`;
  const socialBody = lines.slice(0, 3).map(l => `• ${l}`).join('\n');

  return { quickReference, socialHook, socialBody, realWorldExample: '' };
}

function buildLinkedInPost(q, blogCtx, blogUrl) {
  const emoji = channelEmoji(q.channel);
  const { quickReference, socialHook, socialBody } = blogCtx;

  const opener = `🤔 Engineers disagree on this. Where do you stand?\n\n`;

  const keyPoints = quickReference
    ? quickReference.split(' | ').slice(0, 4).map((p, i) => {
        const icons = ['🔍','⚡','🎯','💡'];
        return `${icons[i] || '•'} ${p}`;
      }).join('\n')
    : `🔍 ${q.answer?.slice(0, 200)}`;

  const story = `${socialHook}\n\n${q.answer?.slice(0, 180)}...\n\nKey insights:\n\n${keyPoints}\n\nUnderstanding this is the difference between a stable system and a 3am page.`;

  const tags = ['#SoftwareEngineering', '#TechCareers', '#InterviewPrep',
    `#${q.channel.replace(/-/g, '')}`, '#DevOps'].join(' ');

  const separator = '─────────────────────────';

  return `${opener}${story}

${separator}

🔗 Read the full article:
${blogUrl}

🎯 Practice interview questions:
${PRACTICE_URL}

${tags}`;
}

function buildPoll(q) {
  const concept = q.question.split(' ').slice(0, 6).join(' ');
  const pollQuestion = truncate(`What is the primary purpose of: ${concept}?`, 140);

  const answerWords = q.answer.split(/[,.\n]/).map(s => s.trim()).filter(s => s.length > 10 && s.length < 30);
  const correct = truncate(answerWords[0] || 'Ensure reliability', 30);
  const distractors = [
    truncate(answerWords[1] || 'Reduce latency only', 30),
    truncate(answerWords[2] || 'Replace monitoring tools', 30),
    truncate(answerWords[3] || 'Automate deployments', 30),
  ];
  const options = [correct, ...distractors].sort(() => Math.random() - 0.5);

  const emoji = channelEmoji(q.channel);
  const introText = `${emoji} Quick ${q.channel.toUpperCase()} fundamentals check!\n⚡ This concept comes up in every production system.\n👇 Vote and drop your reasoning in the comments — let's debate.\n#${q.channel.replace(/-/g,'')} #DevOps #TechCommunity`;

  const cta = '👇 Cast your vote. Disagree with the result? Say why below.';

  const postText = `⚡ Real scenario. What would you do?\n\n${introText}\n\n${cta}\n\n#SoftwareEngineering #TechCareers #InterviewPrep`;

  return { pollQuestion, options, postText, duration: 'TWO_WEEKS (14 days)' };
}

function box(title, content) {
  const width = 62;
  const line = '═'.repeat(width);
  console.log(`\n${line}`);
  console.log(`  ${title}`);
  console.log(line);
  console.log(content);
  console.log(line);
}

async function main() {
  console.log('\n🔍 Fetching question from database...');
  const q = await fetchQuestion();
  if (!q) { console.error('No question found'); process.exit(1); }
  console.log(`   ✅ ${q.id} | ${q.channel} | ${q.difficulty}`);
  console.log(`   Q: ${q.question.slice(0, 80)}...`);

  const blogCtx = simulateBlogContext(q);
  const blogUrl = `${BLOG_BASE}/posts/${q.id}/${slug(q.question)}/`;

  const poll = buildPoll(q);
  box('📊 LINKEDIN POLL — what will be posted', [
    `POLL QUESTION (max 140 chars):`,
    `  "${poll.pollQuestion}"`,
    ``,
    `OPTIONS:`,
    ...poll.options.map((o, i) => `  ${i + 1}. ${o}`),
    ``,
    `DURATION: ${poll.duration}`,
    ``,
    `POST TEXT:`,
    `─`.repeat(60),
    poll.postText,
    `─`.repeat(60),
  ].join('\n'));

  const post = buildLinkedInPost(q, blogCtx, blogUrl);
  box('📢 LINKEDIN POST — what will be posted', [
    `CHARACTER COUNT: ${post.length} / 3000`,
    ``,
    `─`.repeat(60),
    post,
    `─`.repeat(60),
  ].join('\n'));

  box('🧠 ARTICLE CONTEXT injected into AI prompt', [
    `quick_reference:`,
    `  ${blogCtx.quickReference?.slice(0, 120)}`,
    ``,
    `social_hook:`,
    `  ${blogCtx.socialHook}`,
    ``,
    `social_body:`,
    blogCtx.socialBody?.split('\n').map(l => `  ${l}`).join('\n'),
  ].join('\n'));

  console.log('\n✅ Dry run complete — no APIs called, nothing posted.\n');
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
