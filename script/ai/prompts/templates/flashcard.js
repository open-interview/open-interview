/**
 * Flashcard Prompt Template
 *
 * Learning science principles applied:
 * - Active recall over recognition: the HINT must make the learner GENERATE the answer
 *   from an application prompt, not just recognise a definition they've seen before.
 * - WHAT → WHY → EXAMPLE back structure: three-part backs are retained 40% better
 *   than plain definitions because they build a connected schema, not an isolated fact.
 * - Desirable difficulty: the hint should be challenging enough to require effort,
 *   because retrieval that requires effort strengthens the memory trace more.
 * - Vivid mnemonics: spatial, absurd, or story-based images are recalled far better
 *   than acronyms alone — force the mnemonic to create a mental picture.
 */

import { jsonOutputRule } from './base.js';
import { buildStandardSection } from './content-standards.js';

export const schema = {
  front:    "Core concept as an application challenge — not a 'define X' question. Max 100 chars.",
  back:     "WHAT it is (1 sentence) → WHY it works that way (1 sentence) → EXAMPLE (1 concrete sentence). Max 300 chars.",
  hint:     "An application nudge: 'Think about what happens when [scenario]…' — challenges recall without giving it away.",
  mnemonic: "A vivid, story-based or spatial memory image — NOT just an acronym. Should create a mental picture."
};

export const examples = [
  {
    input: {
      question: "What is a database index?",
      answer: "A B-tree or hash structure that maps column values to row locations, enabling O(log n) lookups instead of O(n) full-table scans."
    },
    output: {
      front:    "A users table has 50M rows. Adding WHERE email = ? drops from 30 s to 2 ms. What made that possible?",
      back:     "WHAT: An index is a sorted lookup structure (B-tree) mapping email values to row addresses. WHY: The DB jumps directly to matching rows instead of scanning all 50M. EXAMPLE: CREATE INDEX idx_email ON users(email) — turns a table scan into a tree walk.",
      hint:     "Think about what happens when you search a phone book vs. reading every name from page 1…",
      mnemonic: "Picture the back of a textbook: the Index page points you to exact page numbers instead of rereading the whole book. Your DB index is that same page — but it updates itself every time you INSERT a row."
    }
  },
  {
    input: {
      question: "What is eventual consistency?",
      answer: "A model where distributed replicas may temporarily diverge after a write but will converge to the same value once propagation completes."
    },
    output: {
      front:    "You update your profile on DynamoDB. A friend reads it 1 second later and sees the old value. Is this a bug?",
      back:     "WHAT: Eventual consistency means replicas sync asynchronously — briefly out of sync is by design, not a fault. WHY: Requiring instant sync across all nodes would mean every write blocks until every replica confirms, killing availability. EXAMPLE: DynamoDB, Cassandra, and DNS all trade instant accuracy for high uptime.",
      hint:     "Think about why Amazon chose this for shopping carts, and what the worst case actually is for a user…",
      mnemonic: "Gossip at school: you whisper news to 3 friends, they each tell 3 more. For 10 minutes different people know different things — but eventually everyone has the same story. Distributed nodes gossip exactly like this."
    }
  }
];

export function build(context) {
  const { question, answer } = context;

  return `Distill this interview question and answer into a high-retention flashcard.

Question: "${question}"
Answer: "${answer}"

FIELD RULES:

front (max 100 chars):
- Frame as an APPLICATION CHALLENGE, NOT a definition prompt
- ✅ "A query on 50M rows takes 30 s. How do you fix it in one SQL command?"
- ✅ "Your API handles 1K req/s fine but fails at 10K. What's the first thing you check?"
- ❌ "What is database indexing?" (too passive — learner just recognises, doesn't retrieve)
- ❌ "Define eventual consistency" (same problem)

back (max 300 chars — MUST follow WHAT → WHY → EXAMPLE pattern):
- WHAT: one sentence defining the concept accurately
- WHY: one sentence explaining WHY it is designed this way (the core insight)
- EXAMPLE: one concrete sentence naming a real technology, command, or scenario
- No markdown, plain text only

hint:
- Start with "Think about…" or "Consider what happens when…"
- Describe a specific scenario that forces recall — NOT a synonym or partial definition
- ✅ "Think about what happens when two users update the same record simultaneously on different servers…"
- ❌ "It's related to synchronisation" (gives it away)

mnemonic:
- Create a VIVID MENTAL IMAGE or SHORT STORY — spatial or absurd images stick best
- Acronyms are acceptable only if each letter maps to something meaningful
- ✅ "Picture a telephone game at a party: your message changes slightly as it passes — a distributed system without strong consistency works exactly like that."
- ❌ "ACID = Atomicity, Consistency, Isolation, Durability" (no image, pure label)

${buildStandardSection('flashcard')}

Output this exact JSON structure:
${JSON.stringify(schema)}

${jsonOutputRule}`;
}

export default { schema, examples, build };
