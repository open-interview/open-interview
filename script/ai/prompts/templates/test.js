/**
 * Test Bot Prompt Template
 * Generates MCQ questions from Q&A content
 */

import { jsonOutputRule } from './base.js';

export const schema = [
  {
    q: "question text",
    o: ["option a", "option b", "option c", "option d"],
    c: [0],
    e: "brief explanation"
  }
];

export const guidelines = [
  'Rephrase questions slightly for variety',
  'Make wrong options realistic and plausible',
  'Ensure exactly 4 options per question',
  'Correct indices are 0-based',
  'Keep explanations brief but informative',
  'IMPORTANT: About 20-30% of questions should have MULTIPLE correct answers (c array with 2+ indices)',
  'For multi-answer questions, phrase as "Which of the following..." or "Select all that apply..."',
  'NEVER use positional references in options like "Both A and B", "All of the above", "None of the above", "A and B only" - options are shuffled so these become invalid',
  'Each option must be self-contained and make sense regardless of its position'
];

export function build(context) {
  const { questions } = context;
  
  const summaries = questions.map((q, i) => 
    `${i + 1}. Q: ${q.question.substring(0, 100)} A: ${q.answer.substring(0, 150)}`
  ).join('\n');

  return `You are a JSON generator. Output ONLY valid JSON, no explanations, no markdown.

Create ${questions.length} multiple choice questions (MCQs) from these Q&As:

${summaries}

Return a JSON array with this exact structure:
${JSON.stringify(schema, null, 2)}

Where:
- q = question text (rephrase slightly for variety)
- o = array of 4 plausible options (make wrong options realistic)
- c = array of correct option indices (0-based). Use [0] for single answer, [0,2] for multiple correct answers
- e = brief explanation of why the answer is correct

IMPORTANT: Generate a mix of question types:
- ~70-80% single-answer questions (c has 1 index)
- ~20-30% multiple-answer questions (c has 2+ indices, phrase as "Which of the following..." or "Select all that apply...")

GUIDELINES:
${guidelines.map(g => `- ${g}`).join('\n')}

${jsonOutputRule}`;
}

export default { schema, guidelines, build };
