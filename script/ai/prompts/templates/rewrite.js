/**
 * Cognitive Load Reduction Rewrite Prompt Template
 *
 * Rewrites question, answer, eli5, and tldr fields to be clearer and easier
 * to understand without losing technical accuracy.
 */

import { jsonOutputRule, buildSystemContext } from './base.js';

export const schema = {
  question: "Single focused question ending with ? — max 20 words",
  answer:   "Plain text only, NO markdown. Main point first. Max 300 chars. Active voice.",
  eli5:     "Simple analogy a non-coder can grasp. Max 120 chars.",
  tldr:     "One punchy sentence — the single most important takeaway. Max 80 chars."
};

export const examples = [
  {
    input: {
      question: "In the context of distributed systems, can you explain what eventual consistency means and how it differs from strong consistency?",
      answer: "Eventual consistency is a consistency model used in distributed computing to achieve high availability. It informally guarantees that, if no new updates are made to a given data item, eventually all accesses to that item will return the last updated value.",
      eli5: "Eventual consistency is a concept where a distributed system will eventually become consistent over time.",
      tldr: "Eventual consistency means data will become consistent eventually but not immediately after writes."
    },
    output: {
      question: "What is eventual consistency in distributed systems?",
      answer: "Eventual consistency means all replicas will agree on the same value — but not instantly. After a write, nodes may briefly return stale data. Once updates stop, all nodes converge to the latest value. Trades immediate accuracy for higher availability (used in Cassandra, DynamoDB).",
      eli5: "Like gossip at school — news spreads slowly, but eventually everyone hears the same story.",
      tldr: "Replicas sync eventually, not instantly — trades accuracy for availability."
    }
  }
];

export const guidelines = [
  'question: single focused question, max 20 words, ends with ?',
  'answer: plain text only — NO markdown, NO bold (**), NO bullets',
  'answer: state the main point first, then 1-2 supporting details',
  'answer: define jargon inline with parentheses on first use',
  'answer: max 300 characters',
  'eli5: use a concrete everyday analogy, max 120 characters',
  'tldr: one sentence, the single most important takeaway, max 80 characters',
  'preserve all technical facts — only simplify language and structure',
  'use active voice throughout'
];

export function build(context) {
  const { question, answer, eli5, tldr, channel, difficulty, fields } = context;

  // Only include current content for the fields we're actually rewriting
  const fieldList = fields || ['question', 'answer', 'eli5', 'tldr'];
  const currentContent = {};
  if (fieldList.includes('question') && question)    currentContent.question = question;
  if (fieldList.includes('answer')   && answer)      currentContent.answer   = answer;
  if (fieldList.includes('eli5')     && eli5)        currentContent.eli5     = eli5;
  if (fieldList.includes('tldr')     && tldr)        currentContent.tldr     = tldr;

  const outputSchema = {};
  for (const f of fieldList) {
    if (schema[f]) outputSchema[f] = schema[f];
  }

  return `${buildSystemContext('rewrite')}

You are rewriting technical interview content to reduce cognitive load.
Preserve all technical facts. Only simplify language, sentence structure, and focus.

Topic area: ${channel || 'general'}
Difficulty: ${difficulty || 'intermediate'}

CURRENT CONTENT:
${JSON.stringify(currentContent, null, 2)}

REWRITE RULES:
- question: Single focused question, max 20 words, ends with ?. Remove verbose preamble.
- answer: Plain text only (NO markdown). Max 300 chars. State main point first. Active voice. Define jargon inline.
- eli5: Concrete everyday analogy. Max 120 chars. Must work for a non-programmer.
- tldr: One sentence — the single most important takeaway. Max 80 chars.

Output this exact JSON structure with only the keys listed below:
${JSON.stringify(outputSchema, null, 2)}

${jsonOutputRule}`;
}

export default { schema, examples, guidelines, build };
