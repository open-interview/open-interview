/**
 * Test Bot Prompt Template — MCQ Generation
 *
 * Learning science principles applied:
 * - Contrastive learning: wrong options must be built from COMMON MISCONCEPTIONS,
 *   not just plausible-sounding alternatives. Explaining why wrong answers are wrong
 *   is the single highest-impact retention technique in multiple-choice learning.
 * - The generation effect: re-phrasing questions as application scenarios (not just
 *   "what is X?") forces active recall, not pattern-matching recognition.
 * - Interleaving: mixing concept types within a set prevents the "blocked practice"
 *   illusion of competence where learners recognise question types, not concepts.
 * - Desirable difficulty: well-crafted distractors that reflect real mistakes make
 *   retrieval harder but produce far stronger long-term memory traces.
 */

import { jsonOutputRule } from './base.js';

export const schema = [
  {
    q: "question text — framed as a scenario or application, not just 'define X'",
    o: ["correct answer", "misconception-based wrong answer", "misconception-based wrong answer", "misconception-based wrong answer"],
    c: [0],
    e: "Why the correct answer is right AND why each wrong option is a common mistake."
  }
];

export const guidelines = [
  // Question phrasing
  'Rephrase as a scenario or application challenge when possible — avoid plain "What is X?" phrasing',
  'Mix question types: ~50% application/scenario, ~50% concept/distinction',

  // Options structure
  'Make EVERY wrong option a specific, named common misconception — not just a plausible-sounding alternative',
  'Ensure exactly 4 options per question',
  'Correct indices are 0-based; randomise the correct answer position (do NOT always put it at index 0)',

  // Multi-answer questions
  'About 20-30% of questions should have MULTIPLE correct answers (c array with 2+ indices)',
  'For multi-answer questions, phrase as "Which of the following…" or "Select all that apply…"',
  'NEVER use positional references: no "Both A and B", "All of the above", "None of the above" — options are shuffled',
  'Each option must be self-contained and make sense regardless of position',

  // Explanation quality — the highest-impact field for retention
  'Explanation MUST explain: (1) why the correct answer is right, (2) what misconception each wrong option represents',
  'Explanation should explicitly name the mistake: "Developers often confuse X with Y because…"',
  'Keep explanations concise but complete — one sentence per option is the target',
];

export function build(context) {
  const { questions } = context;

  const summaries = questions.map((q, i) =>
    `${i + 1}. Q: ${q.question.substring(0, 120)}\n   A: ${q.answer.substring(0, 200)}`
  ).join('\n\n');

  return `You are a JSON generator. Output ONLY valid JSON, no explanations, no markdown.

Create ${questions.length} multiple-choice questions (MCQs) from these Q&As.
Your goal is maximum RETENTION — not just testing whether the learner read the content.

SOURCE Q&As:
${summaries}

DISTRACTOR QUALITY IS THE MOST IMPORTANT FACTOR:
Wrong options must be specific common misconceptions, not vague alternatives.

Examples of GOOD distractors (misconception-based):
- For "What does async/await do?" → wrong option: "It runs the function on a separate thread" (common misconception — it doesn't)
- For "What is a foreign key?" → wrong option: "It encrypts the referenced column" (sounds plausible, is wrong)
- For "What does O(log n) mean?" → wrong option: "The algorithm loops log(n) times regardless of input" (misunderstands Big-O)

Examples of BAD distractors (just plausible, not instructive):
- "It speeds up the function" (teaches nothing about the misconception)
- "It creates a new thread" (too vague — is it wrong, or partially right?)

EXPLANATION FORMAT (REQUIRED for each question):
"[Correct answer] is right because [specific reason]. 
Option [B] is wrong — this is a common mistake: [name the misconception]. 
Option [C] is wrong because [name the misconception]. 
Option [D] is wrong because [name the misconception]."

QUESTION PHRASING:
- ~50% application/scenario: "Your Redis cache is evicting items every 30 s. What setting controls this?"
- ~50% concept/distinction: "What is the key difference between optimistic and pessimistic locking?"
- Avoid pure definition prompts: "What is X?" unless the concept is a definition itself

Return a JSON array with this exact structure:
${JSON.stringify(schema, null, 2)}

Where:
- q = question text (rephrase as application/scenario when possible)
- o = array of exactly 4 options (wrong options = specific misconceptions)
- c = array of correct 0-based indices ([0] for single, [0,2] for multiple correct)
- e = explanation: why correct is right + what misconception each wrong option represents

QUESTION MIX:
- ~70-80% single-answer questions
- ~20-30% multiple-answer questions phrased as "Which of the following…" or "Select all that apply…"

GUIDELINES:
${guidelines.map(g => `- ${g}`).join('\n')}

${jsonOutputRule}`;
}

export default { schema, guidelines, build };
