/**
 * Question Improvement Prompt Template
 *
 * Learning science principles applied:
 * - Error-based learning: every improved explanation must include a Common Mistake section
 * - Elaborative interrogation: the WHY behind a concept is required in the explanation
 * - Interview Tip: naming what the interviewer is specifically listening for helps learners
 *   prioritise which depth signals to emphasise in a real interview
 */

import { jsonOutputRule, buildSystemContext, markdownFormattingRules } from './base.js';
import config from '../../config.js';
import { buildAnswerStandardSection } from './answer-standard.js';

export const schema = {
  question:    "Improved question ending with ?",
  answer:      "Comprehensive interview answer (150-500 chars) demonstrating expertise. Plain text only, NO markdown.",
  explanation: "Detailed explanation with sections: How It Works, Code Example, Common Mistake, Interview Tip, and Key Points. Properly formatted markdown."
};

export const examples = [
  {
    input: {
      question: "What is caching",
      answer:   "storing data",
      issues:   ["short_answer", "no_question_mark"]
    },
    output: {
      question: "What is caching and when should you use it in a web application?",
      answer:   "Caching stores frequently read data in fast storage (RAM/Redis) to reduce latency and database load. Use it for read-heavy data that changes infrequently. Key strategies: cache-aside (lazy load on miss), write-through (sync write to cache + DB), write-behind (async). Always define TTL and an invalidation strategy to prevent stale reads.",
      explanation: `## How It Works

Cache-aside is the most common pattern: the app checks the cache first; on a miss it fetches from DB, writes the result to cache, then returns it. Subsequent reads hit the cache until the TTL expires or the entry is explicitly invalidated.

## Code Example

\`\`\`javascript
async function getUser(id) {
  const cached = await redis.get(\`user:\${id}\`);
  if (cached) return JSON.parse(cached);

  const user = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  await redis.setex(\`user:\${id}\`, 300, JSON.stringify(user)); // TTL = 5 min
  return user;
}
\`\`\`

## Common Mistake

Caching mutable data without a clear invalidation strategy causes stale reads. Developers often set a long TTL thinking it improves performance, but then a record is updated in the DB and users see outdated data for minutes. Always pair a TTL with an explicit cache invalidation on writes.

## Interview Tip

Interviewers want to hear about trade-offs: "what happens on a cache miss?", "how do you handle cache stampede?", and "how do you invalidate?". Mentioning cache stampede prevention (e.g. probabilistic early expiry or a distributed lock on miss) signals production experience.

## Key Points

- **Cache-aside** (lazy loading): fetch-on-miss, most flexible
- **Write-through**: write to cache and DB together — no stale reads, higher write latency
- **Write-behind**: write to cache, async flush to DB — fastest writes, risk of data loss
- **TTL**: always set one; infinite TTL is a memory leak waiting to happen`
    }
  }
];

const { answer: answerThresholds, explanation: explanationThresholds } = config.qualityThresholds;

export const guidelines = [
  'Ensure question ends with a question mark',
  `Answer MUST be ${answerThresholds.minLength}-${answerThresholds.maxLength} characters`,
  'Answer must be PLAIN TEXT only — NO markdown, NO bold (**), NO code blocks',
  'Answer must name specific technologies, patterns, or trade-offs',
  ...config.guidelines.answer,
  'Explanation MUST include a "Common Mistake" section — name the actual mistake',
  'Explanation MUST include an "Interview Tip" section — state what the interviewer is testing for',
  ...config.guidelines.explanation,
  'For system design, use the NFR format with calculations',
  'Each section header must be on its own line with ## prefix',
  'Add blank line after each heading and between sections',
];

export function build(context) {
  const { question, answer, explanation, channel, issues, relevanceFeedback } = context;

  const isSystemDesign = channel === 'system-design' ||
    question.toLowerCase().includes('design') ||
    question.toLowerCase().includes('architect');

  let feedbackSection = '';
  if (relevanceFeedback) {
    feedbackSection = `\nRELEVANCE FEEDBACK TO ADDRESS:`;
    if (relevanceFeedback.questionIssues?.length > 0) {
      feedbackSection += `\n- Question Issues: ${relevanceFeedback.questionIssues.join('; ')}`;
    }
    if (relevanceFeedback.answerIssues?.length > 0) {
      feedbackSection += `\n- Answer Issues: ${relevanceFeedback.answerIssues.join('; ')}`;
    }
    if (relevanceFeedback.missingTopics?.length > 0) {
      feedbackSection += `\n- Missing Topics: ${relevanceFeedback.missingTopics.join('; ')}`;
    }
  }

  return `${buildSystemContext('improve')}

Improve this ${channel || 'technical'} interview question. Fix: ${(issues || []).slice(0, 3).join(', ')}
${feedbackSection}

Current Question: "${(question || '').substring(0, 150)}"
Current Answer: "${(answer || 'missing').substring(0, 150)}"

${isSystemDesign ? 'Use the SYSTEM DESIGN format with NFRs, trade-offs, and scale calculations.' : 'Use the STANDARD format with a code example.'}

RETENTION REQUIREMENTS (non-negotiable):
- The "Common Mistake" section MUST name the specific mistake developers make — not a vague warning
- The "Interview Tip" section MUST state exactly what the interviewer is listening for
- The code example MUST be minimal but runnable — not pseudocode unless the concept is language-agnostic

${markdownFormattingRules}

${buildAnswerStandardSection(isSystemDesign)}

Output this exact JSON structure:
${JSON.stringify(schema, null, 2)}

${jsonOutputRule}`;
}

export default { schema, examples, guidelines, build };
