/**
 * Cognitive Load Reduction Rewrite Prompt Template
 *
 * Rewrites question, answer, eli5, and tldr fields to be clearer and easier
 * to understand without losing technical accuracy.
 *
 * Learning science principles applied:
 * - Cognitive load theory: lead with the core insight, strip subordinate clauses
 * - Explicit analogy bridging: eli5 must map back to the technical reality
 * - Retrieval hook design: tldr must reconstruct the concept 24h later, not summarise it
 * - Active voice + front-loading: most important information in the first clause
 */

import { jsonOutputRule, buildSystemContext } from './base.js';

export const schema = {
  question: "Single focused question ending with ? — max 20 words",
  answer:   "Plain text only, NO markdown. Main point first. Max 300 chars. Active voice. Concrete trade-off or example included.",
  eli5:     "Vivid everyday analogy that bridges back to the technical concept in the final sentence. Max 200 chars.",
  tldr:     "Memory hook — one sentence the learner can still reconstruct the concept from 24 h later. Max 100 chars. Specific and concrete."
};

export const examples = [
  {
    input: {
      question: "In the context of distributed systems, can you explain what eventual consistency means and how it differs from strong consistency?",
      answer:   "Eventual consistency is a consistency model used in distributed computing to achieve high availability. It informally guarantees that, if no new updates are made to a given data item, eventually all accesses to that item will return the last updated value.",
      eli5:     "Eventual consistency is a concept where a distributed system will eventually become consistent over time.",
      tldr:     "Eventual consistency means data will become consistent eventually but not immediately after writes."
    },
    output: {
      question: "What is eventual consistency in distributed systems?",
      answer:   "After a write, replicas may briefly return stale data. Once updates stop, all nodes converge to the latest value. Used in Cassandra and DynamoDB — trades instant accuracy for higher availability and no write blocking.",
      eli5:     "Like gossip in school — you tell 3 friends, they each tell 3 more. For 10 minutes different people know different things, but eventually everyone has the same story. Distributed databases gossip like this: briefly out of sync, then they all catch up.",
      tldr:     "Replicas sync eventually, not instantly — trades immediate accuracy for availability."
    }
  },
  {
    input: {
      question: "What is the purpose of using indexes in a relational database management system?",
      answer:   "Indexes in databases are used to speed up the retrieval of data. An index is a data structure that provides a quick lookup of data based on the values in specific columns.",
      eli5:     "A database index is like an index in a book.",
      tldr:     "Database indexes speed up queries."
    },
    output: {
      question: "What is a database index and when should you use one?",
      answer:   "An index is a B-tree structure that maps column values to row locations, turning an O(n) table scan into an O(log n) lookup. Use on frequently queried columns — but each index slows down writes and consumes disk space.",
      eli5:     "Imagine searching a 1,000-page book by reading every page vs. flipping to the index and jumping straight there. A database index works exactly the same way: it maps each column value to the exact row address so the DB never scans the whole table.",
      tldr:     "Indexes trade slower writes for O(log n) reads — add them on WHERE and JOIN columns."
    }
  }
];

export const guidelines = [
  'question: single focused question, max 20 words, ends with ?. Remove verbose preamble.',
  'answer: plain text only — NO markdown, NO bold (**), NO bullets. Max 300 chars.',
  'answer: state the main point first, then 1-2 supporting details including a trade-off or real technology name',
  'answer: define jargon inline with parentheses on first use',
  'eli5: open with a concrete physical analogy (not software), develop it in 2-3 sentences, then bridge back to the technical concept in the final sentence',
  'eli5: max 200 characters',
  'tldr: one sentence — a memory hook, not a summary. Must let the learner reconstruct the concept 24 h later. Max 100 chars.',
  'tldr: prefer specific/concrete ("Redis stores data in RAM, persists async") over abstract ("caching is faster")',
  'preserve all technical facts — only simplify language and structure',
  'use active voice throughout',
];

export function build(context) {
  const { question, answer, eli5, tldr, channel, difficulty, fields } = context;

  const fieldList = fields || ['question', 'answer', 'eli5', 'tldr'];
  const currentContent = {};
  if (fieldList.includes('question') && question) currentContent.question = question;
  if (fieldList.includes('answer')   && answer)   currentContent.answer   = answer;
  if (fieldList.includes('eli5')     && eli5)     currentContent.eli5     = eli5;
  if (fieldList.includes('tldr')     && tldr)     currentContent.tldr     = tldr;

  const outputSchema = {};
  for (const f of fieldList) {
    if (schema[f]) outputSchema[f] = schema[f];
  }

  return `${buildSystemContext('rewrite')}

Rewrite this technical interview content to reduce cognitive load and improve retention.
Preserve all technical facts. Only simplify language, sentence structure, and focus.

Topic area: ${channel || 'general'}
Difficulty: ${difficulty || 'intermediate'}

CURRENT CONTENT (some fields may be empty — generate them from the available context):
${JSON.stringify(currentContent, null, 2)}

REWRITE RULES:

question:
- Single focused question, max 20 words, ends with ?
- Remove verbose preamble ("In the context of…", "Can you explain…", "Could you describe…")
- Lead with the key concept, not the domain setup

answer:
- Plain text ONLY — NO markdown, NO bold, NO bullets, NO code blocks
- MAX 300 characters
- State the main point in the first sentence (inverted pyramid)
- Include at least one concrete trade-off or real technology name
- Define any jargon inline: "B-tree (a sorted tree structure)"
- Active voice: "Redis stores…" not "Data is stored in Redis…"

eli5:
- Open with a vivid, physical, everyday analogy — NOT software
- Develop the analogy in 2-3 sentences with sensory/spatial language
- Final sentence MUST bridge back: "…[X] works the same way: [technical concept in plain words]."
- MAX 200 characters
- Zero jargon — if a term appears, define it in the same breath

tldr:
- One sentence MEMORY HOOK, not a summary
- Must let the learner reconstruct the full concept from memory 24 hours later
- Prefer SPECIFIC and CONCRETE: "Redis stores the full dataset in RAM" not "caching is fast"
- Capture the key TRADE-OFF or DISTINCTION when possible
- MAX 100 characters
- No filler: no "basically", "essentially", "this means", "in other words"

IMPORTANT: Output EVERY field listed below — generate any missing field from the available context.

Output this exact JSON structure:
${JSON.stringify(outputSchema, null, 2)}

${jsonOutputRule}`;
}

export default { schema, examples, guidelines, build };
