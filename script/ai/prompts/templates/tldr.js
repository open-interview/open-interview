/**
 * TLDR (Too Long; Didn't Read) Prompt Template
 *
 * Learning science principles applied:
 * - Retrieval practice: a good TLDR is a retrieval CUE, not a summary.
 *   One sentence should let the learner reconstruct the full concept from memory.
 * - Specificity effect: concrete/specific language is recalled far better than
 *   abstract/general language ("Redis stores data in RAM" vs "caching is fast").
 * - Key-distinction framing: capturing the most important trade-off anchors the
 *   concept relative to what it is NOT, which prevents confusion.
 */

import { jsonOutputRule, qualityRules, buildSystemContext } from './base.js';
import { buildStandardSection } from './content-standards.js';
import config from '../../config.js';

export const schema = {
  tldr: "One memory-hook sentence — concrete, specific, and phrased so a learner can reconstruct the concept 24h later."
};

export const examples = [
  {
    input: { question: "What is database indexing?", answer: "Indexing creates a B-tree or hash data structure that maps column values to row locations, so the query engine jumps directly to matching rows instead of scanning the full table." },
    output: { tldr: "An index trades extra write overhead for O(log n) lookups — without one, every query scans every row." }
  },
  {
    input: { question: "What's the difference between REST and GraphQL?", answer: "REST exposes fixed resource endpoints using HTTP verbs; GraphQL exposes a single endpoint where the client specifies exactly which fields to return, eliminating over-fetching and under-fetching." },
    output: { tldr: "REST gives you fixed endpoints and fixed shapes; GraphQL gives you one endpoint and you declare exactly what data you need." }
  },
  {
    input: { question: "What are microservices?", answer: "Microservices split a monolithic application into small, independently deployable services that each own a single business capability and communicate over APIs." },
    output: { tldr: "Each service deploys, scales, and fails independently — you trade simplicity for isolation and operational complexity." }
  },
  {
    input: { question: "What is eventual consistency?", answer: "After a write, replicas may briefly diverge but will converge to the same value once updates stop propagating through the cluster." },
    output: { tldr: "Eventual consistency: all nodes agree eventually, not immediately — you gain availability, you lose instant accuracy." }
  }
];

export const guidelines = [
  `Maximum ${config.qualityThresholds.tldr.maxLength} characters total — strict limit`,
  ...config.guidelines.tldr
];

export function build(context) {
  const { question, answer } = context;

  return `${buildSystemContext('tldr')}

Write a MEMORY HOOK — one sentence that lets a learner reconstruct this entire concept from memory 24 hours later.

Question: "${question}"
Answer: "${(answer || '').substring(0, 600)}"

YOUR TLDR MUST:
1. Be SPECIFIC and CONCRETE — name the actual technology, pattern, or number
   ✅ "Redis stores the full dataset in RAM and persists async to disk — O(1) reads, eventual durability"
   ❌ "Caching improves performance by storing data temporarily"

2. Capture the KEY TRADE-OFF or CRITICAL DISTINCTION, not just what something is
   ✅ "Indexes speed up reads but slow down writes — always benchmark before adding one"
   ❌ "Indexes make database queries faster"

3. Be phrased as something a confident candidate says out loud in one breath
   ✅ "Event sourcing stores every state change as an immutable event, so you can replay history but can't do simple CRUD"
   ❌ "Event sourcing is a pattern where you store events"

4. Have ZERO filler: no "basically", "essentially", "simply", "in other words", "this means"

${buildStandardSection('tldr')}

${qualityRules.concise}

Output this exact JSON structure:
${JSON.stringify(schema)}

${jsonOutputRule}`;
}

export default { schema, examples, guidelines, build };
