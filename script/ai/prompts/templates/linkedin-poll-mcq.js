/**
 * LinkedIn Poll MCQ Generation Template
 * Takes any interview question + answer and generates a 4-option MCQ suitable for a LinkedIn poll.
 * One option is correct, three are plausible distractors.
 */

import { jsonOutputRule } from './base.js';

export const schema = {
  pollQuestion: "Short rephrased question for LinkedIn poll (max 130 chars, ends with ?)",
  options: [
    "Short option A (max 30 chars)",
    "Short option B (max 30 chars)",
    "Short option C (max 30 chars)",
    "Short option D (max 30 chars)"
  ],
  correctIndex: 1,
  introText: "3-4 line engaging intro with emojis, hook line, context, and CTA to vote. End with 2-3 relevant hashtags."
};

export function build(context) {
  const { question, answer, explanation, tags, channel } = context;

  const tagsLine = Array.isArray(tags) && tags.length
    ? `Tags: ${tags.join(', ')}`
    : (tags ? `Tags: ${tags}` : '');

  const explanationLine = explanation
    ? `\nEXPLANATION (use to craft better distractors and introText):\n${explanation}`
    : '';

  return `You are a technical educator creating an engaging LinkedIn poll about core technology fundamentals.

You are given a complex interview question. Your job is to:
1. Identify the single core concept or technology being tested (e.g. "Kubernetes resource limits", "Terraform state", "AWS IAM roles")
2. Create a simple, beginner-friendly MCQ poll about that core concept — NOT about the complex scenario itself

ORIGINAL QUESTION (for concept extraction only — do NOT use this as the poll question):
${question}

ANSWER (use this to understand the correct concept):
${answer}
${explanationLine}

CHANNEL/TOPIC: ${channel || 'software engineering'}
${tagsLine}

POLL QUESTION STYLE — keep it simple and conceptual, like:
- "What does a Kubernetes LimitRange do?"
- "Which AWS service stores Terraform state remotely?"
- "What does 'idempotent' mean in DevOps?"
- "What is the purpose of an SRE error budget?"
- "Which Linux command shows disk I/O stats in real time?"

RULES:
- pollQuestion: a simple, clear fundamentals question about the core concept. Max 130 characters. Must end with ?
- options: exactly 4 options, EACH MUST BE 30 CHARACTERS OR FEWER. Plain text only, no labels, no markdown. Count characters carefully.
- correctIndex: 0-based index of the correct option. Randomize position (not always index 0).
- introText: 3-4 lines that hook the reader. Follow this structure:
    Line 1: Emoji + punchy hook (challenge or bold statement — do NOT use fabricated statistics)
    Line 2: Emoji + 1 sentence on why this concept matters day-to-day
    Line 3: Emoji + CTA like "Vote below!" or "Test your basics — vote now!"
    Line 4: 2-3 relevant hashtags
  Use varied emojis (🚀 ⚡ 🔥 🎯 💡 🛠️ 🤔 👇). Do NOT reveal the answer.
  ATTRIBUTION RULE: Do NOT use statistics or percentages unless they are well-known documented facts. Prefer conceptual hooks over unverified numbers.

INTROTEXT EXAMPLES:
"🤔 Do you know your Kubernetes basics?\n⚡ This concept trips up engineers in every K8s interview.\n👇 Vote and see how others do!\n#Kubernetes #DevOps #CloudNative"

"🔥 Quick AWS fundamentals check!\n🎯 This is day-1 knowledge every cloud engineer needs.\n💡 Cast your vote now!\n#AWS #CloudComputing #DevOps"

${jsonOutputRule}

Output this exact JSON:
${JSON.stringify(schema, null, 2)}`;
}

export default { schema, build };
