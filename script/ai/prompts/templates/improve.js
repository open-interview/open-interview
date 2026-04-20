/**
 * Question Improvement Prompt Template
 */

import { jsonOutputRule, buildSystemContext, markdownFormattingRules } from './base.js';
import config from '../../config.js';
import { buildAnswerStandardSection } from './answer-standard.js';

export const schema = {
  question: "improved question ending with ?",
  answer: "comprehensive interview answer (150-500 chars) that demonstrates expertise. Plain text only, NO markdown.",
  explanation: "detailed explanation with sections, properly formatted markdown"
};

export const examples = [
  {
    input: { 
      question: "What is caching", 
      answer: "storing data", 
      issues: ["short_answer", "no_question_mark"] 
    },
    output: {
      question: "What is caching and when should you use it in a web application?",
      answer: "Caching stores frequently accessed data in fast storage (memory/Redis) to reduce latency and database load. Use it for read-heavy data that doesn't change often. Key strategies include cache-aside (lazy loading), write-through, and write-behind. Always consider TTL, invalidation strategy, and cache stampede prevention.",
      explanation: "## Why This Is Asked\n\nCaching is fundamental to building scalable systems...\n\n## Key Concepts\n\n- Cache-aside pattern\n- TTL management\n- Cache invalidation"
    }
  }
];

// Use centralized guidelines from config, plus improve-specific rules
const { answer: answerThresholds, explanation: explanationThresholds } = config.qualityThresholds;

export const guidelines = [
  'Ensure question ends with a question mark',
  `Answer MUST be ${answerThresholds.minLength}-${answerThresholds.maxLength} characters`,
  'Answer must be PLAIN TEXT only - NO markdown, NO bold (**), NO code blocks',
  ...config.guidelines.answer,
  ...config.guidelines.explanation,
  'For system design, use the NFR format with calculations',
  'Each section header should be on its own line with ## prefix',
  'Add blank line after each heading and between sections'
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

${isSystemDesign ? 'Use the SYSTEM DESIGN format with NFRs and calculations.' : 'Use the STANDARD format with code examples.'}

${markdownFormattingRules}

${buildAnswerStandardSection(isSystemDesign)}

Output this exact JSON structure:
${JSON.stringify(schema, null, 2)}

${jsonOutputRule}`;
}

export default { schema, examples, guidelines, build };
