/**
 * Flashcard Prompt Template
 */

import { jsonOutputRule } from './base.js';
import { buildStandardSection } from './content-standards.js';

export const schema = {
  front: "Concise term or concept (max 100 chars)",
  back: "Clear explanation (max 300 chars)",
  hint: "One-line clue to trigger recall",
  mnemonic: "Memory trick or acronym"
};

export function build(context) {
  const { question, answer } = context;

  return `Distill this interview question and answer into a memorable flashcard.

Question: "${question}"
Answer: "${answer}"

Rules:
- front: the core term/concept being tested, max 100 chars
- back: clear, self-contained explanation, max 300 chars
- hint: one-line clue that nudges recall without giving it away
- mnemonic: a memory trick, acronym, or analogy to make it stick

${buildStandardSection('flashcard')}

Output this exact JSON structure:
${JSON.stringify(schema)}

${jsonOutputRule}`;
}

export default { schema, build };
