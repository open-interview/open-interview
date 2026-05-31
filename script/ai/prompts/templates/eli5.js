/**
 * ELI5 (Explain Like I'm 5) Prompt Template
 *
 * Learning science principles applied:
 * - Dual coding: analogy creates a visual/spatial mental image alongside the concept
 * - Analogy bridging: the analogy must explicitly map back to the technical reality
 * - Concrete-before-abstract: story first, technical label second
 * - Mental model hook: ends with a one-liner the learner will still recall tomorrow
 */

import { jsonOutputRule, qualityRules, buildSystemContext } from './base.js';
import { buildStandardSection } from './content-standards.js';
import config from '../../config.js';

export const schema = {
  eli5: "Vivid analogy that bridges back to the technical concept. No jargon. Memorable hook at the end."
};

export const examples = [
  {
    input: { question: "What is a database index?", answer: "A data structure that improves query speed by creating a pointer to data rows" },
    output: {
      eli5: "Imagine a 1,000-page cookbook. Without a table of contents you'd flip every page hunting for 'chocolate cake'. An index is that table of contents — it maps each recipe name to an exact page, so you jump straight there. A database index does the exact same thing: instead of scanning every row, the database looks up the column value in the index and jumps straight to the matching rows."
    }
  },
  {
    input: { question: "What is a load balancer?", answer: "Distributes incoming network traffic across multiple servers" },
    output: {
      eli5: "Picture a theme park with 6 identical rollercoaster tracks side by side. A ride attendant at the entrance watches the queues and waves each group to whichever track has the shortest line — no single track ever packs up while others sit empty. A load balancer is that attendant: it sees each incoming request and sends it to whichever server is least busy, so no single machine gets overwhelmed."
    }
  },
  {
    input: { question: "What is eventual consistency?", answer: "A model where all replicas converge to the same value over time, trading immediate accuracy for availability" },
    output: {
      eli5: "Imagine telling one friend a secret and asking them to pass it on. For a few minutes different people know different things, but eventually the whole group has heard the same story. Distributed databases work the same way — after you save data, different servers briefly hold slightly different versions, but they keep syncing until every server agrees. You trade 'always perfectly accurate' for 'never goes down'."
    }
  }
];

export const guidelines = [
  `Keep it under ${config.qualityThresholds.eli5.maxLength} characters`,
  ...config.guidelines.eli5
];

export function build(context) {
  const { question, answer } = context;

  return `${buildSystemContext('eli5')}

Create an "Explain Like I'm 5" explanation for this technical interview question.

Question: "${question}"
Technical Answer: "${answer || 'N/A'}"

YOUR EXPLANATION MUST:
1. Open with a vivid, concrete, everyday analogy (physical objects, places, or situations — not software)
2. Use sensory or spatial language so the learner forms a mental image
3. Explicitly map the analogy back to the technical concept in the final 1-2 sentences
   ("…a load balancer does the exact same thing: it sends each request to the least-busy server.")
4. End with a memorable one-liner or mental hook the learner will still recall tomorrow
5. Contain ZERO technical jargon — if a term must appear, define it in the same sentence

${buildStandardSection('eli5')}

${qualityRules.beginner}

GOOD PATTERN:
"Imagine [concrete everyday scenario]. [Develop the analogy with 2-3 vivid sentences.]
[Technical concept] works the same way: [explicit 1-sentence bridge back to the technology]."

BAD PATTERNS TO AVOID:
- Opening with a definition ("X is a concept that…")
- Analogies that don't map back ("It's like a library" — without explaining what the shelves, books, or librarian map to)
- Any sentence starting with "In computer science…" or "In software…"

Output this exact JSON structure:
${JSON.stringify(schema)}

${jsonOutputRule}`;
}

export default { schema, examples, guidelines, build };
