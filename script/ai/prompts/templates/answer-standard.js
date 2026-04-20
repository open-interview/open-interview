/**
 * Answer Standard Template
 *
 * Defines the canonical structure, rules, and validation criteria for
 * all interview question answers generated or improved in this system.
 *
 * Import this in generate.js and improve.js to enforce consistency.
 */

import config from '../../config.js';

const { answer: thresholds } = config.qualityThresholds;

// ─── Structure ────────────────────────────────────────────────────────────────

/**
 * The canonical answer schema.
 * Every generated/improved answer MUST conform to this shape.
 */
export const answerSchema = {
  // Short, plain-text answer shown in the card view (150-500 chars)
  answer: `Plain text, ${thresholds.minLength}-${thresholds.maxLength} chars. No markdown, no bold, no code blocks.`,
  // Rich markdown explanation shown in the detail view
  explanation: 'Markdown with ## sections. See EXPLANATION_FORMATS below.',
};

// ─── Plain-text answer rules ──────────────────────────────────────────────────

export const ANSWER_RULES = [
  `Length: ${thresholds.minLength}–${thresholds.maxLength} characters (hard limits)`,
  'Plain text ONLY — no markdown, no **bold**, no `code`, no bullet lists',
  'Start with the direct answer — no preamble, no context-setting',
  'Name specific technologies, patterns, or trade-offs',
  'Self-contained — no "as mentioned above" or "see explanation"',
  'No filler: no "Great question", "Basically", "Simply put", "In summary"',
  'No trailing ellipsis or cut-off sentences',
  'Declarative style — state facts, not advice ("X does Y", not "you should use X")',
];

// ─── Explanation formats ──────────────────────────────────────────────────────

export const EXPLANATION_FORMATS = {
  /**
   * Standard format for most technical questions.
   */
  standard: `## How It Works

Concise technical explanation of the mechanism/concept.

## Key Points

- **Point 1**: one-line explanation
- **Point 2**: one-line explanation
- **Point 3**: one-line explanation

## Example

\`\`\`javascript
// Minimal working example
\`\`\``,

  /**
   * System design format — for questions involving "design", "architect", or "scale".
   */
  systemDesign: `## Core Design

High-level architecture in 2-3 sentences.

## Components

- **Component 1**: role and why
- **Component 2**: role and why

## Trade-offs

- **Pro**: reason
- **Con**: reason

## Scale Considerations

Key numbers and bottlenecks.`,
};

// ─── Explanation rules ────────────────────────────────────────────────────────

export const EXPLANATION_RULES = [
  'Use ## for top-level sections, ### for sub-sections',
  'Add a blank line after every heading',
  'Code fences (```) must be on their own line with a language tag',
  'Bold markers (**) must be on the same line as the text',
  'Each bullet must be on its own line starting with "- "',
  'Minimum 2 sections — no filler sections like "Why This Is Asked" or "Follow-up Questions"',
  'Do not repeat the plain-text answer — add depth and examples only',
  'Be concise: every sentence must add information, no padding',
];

// ─── Audit criteria (used by answer-auditor-bot) ──────────────────────────────

/**
 * Checks that can be run against a stored answer without calling the LLM.
 * Returns an array of issue strings (empty = pass).
 */
export function auditAnswer(answer = '', explanation = '') {
  const issues = [];

  // Plain-text answer checks
  if (!answer || answer.trim().length === 0) {
    issues.push('missing_answer');
  } else {
    if (answer.length < thresholds.minLength) issues.push('short_answer');
    if (answer.length > thresholds.maxLength) issues.push('long_answer');
    if (/\*\*/.test(answer)) issues.push('answer_has_markdown_bold');
    if (/```/.test(answer)) issues.push('answer_has_code_block');
    if (/^#+\s/m.test(answer)) issues.push('answer_has_headings');
    if (/\.\.\.$/.test(answer.trim())) issues.push('truncated_answer');
    if (answer.trim().length < 50) issues.push('placeholder_answer');
  }

  // Explanation checks
  if (!explanation || explanation.trim().length === 0) {
    issues.push('missing_explanation');
  } else {
    if (explanation.length < config.qualityThresholds.explanation.minLength) {
      issues.push('short_explanation');
    }
    if (!/^##\s/m.test(explanation)) issues.push('explanation_missing_sections');
    if (/\.\.\.$/.test(explanation.trim())) issues.push('truncated_explanation');
  }

  return issues;
}

/**
 * Severity map for audit issues — used by the bot to decide action.
 */
export const ISSUE_SEVERITY = {
  missing_answer: 'critical',
  missing_explanation: 'critical',
  truncated_answer: 'high',
  truncated_explanation: 'high',
  short_answer: 'high',
  placeholder_answer: 'high',
  answer_has_markdown_bold: 'medium',
  answer_has_code_block: 'medium',
  answer_has_headings: 'medium',
  long_answer: 'medium',
  short_explanation: 'medium',
  explanation_missing_sections: 'low',
};

/**
 * Build the answer-standard section to inject into any prompt.
 * Call this in generate.js / improve.js to keep prompts DRY.
 */
export function buildAnswerStandardSection(isSystemDesign = false) {
  const format = isSystemDesign ? EXPLANATION_FORMATS.systemDesign : EXPLANATION_FORMATS.standard;

  return `
ANSWER STANDARD (MANDATORY):

Plain-text "answer" field rules:
${ANSWER_RULES.map(r => `- ${r}`).join('\n')}

"explanation" field rules:
${EXPLANATION_RULES.map(r => `- ${r}`).join('\n')}

EXPLANATION FORMAT TO USE:
${format}
`.trim();
}

export default {
  answerSchema,
  ANSWER_RULES,
  EXPLANATION_RULES,
  EXPLANATION_FORMATS,
  ISSUE_SEVERITY,
  auditAnswer,
  buildAnswerStandardSection,
};
