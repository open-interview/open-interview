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
  'Must directly answer the question asked',
  'Must demonstrate technical depth: name specific technologies, patterns, or trade-offs',
  'Must be self-contained — no "as mentioned above" or "see explanation"',
  'No filler openers: avoid "Great question", "Basically", "Simply put"',
  'No trailing ellipsis or cut-off sentences',
  'Write in third-person declarative style, not "you should…"',
];

// ─── Explanation formats ──────────────────────────────────────────────────────

export const EXPLANATION_FORMATS = {
  /**
   * Standard format for most technical questions.
   */
  standard: `## Why This Is Asked

Brief context on why interviewers ask this question.

## Key Concepts

- **Concept 1**: explanation
- **Concept 2**: explanation
- **Concept 3**: explanation

## Code Example

\`\`\`javascript
// Concrete implementation
function example() {
  return 'value';
}
\`\`\`

## Follow-up Questions

- Follow-up question 1?
- Follow-up question 2?`,

  /**
   * System design format — required for any question involving "design", "architect", or "scale".
   */
  systemDesign: `## Functional Requirements

- Requirement 1
- Requirement 2

## Non-Functional Requirements (NFRs)

- Availability: e.g. 99.99%
- Latency: e.g. p99 < 100ms
- Scalability: e.g. 10M DAU
- Consistency: e.g. eventual

## Back-of-Envelope Calculations

### Users & Traffic

- DAU: number
- Peak QPS: number

### Storage

- Per user: size
- Total: size

## High-Level Design

Architecture overview.

## Deep Dive: Key Components

### Component 1

Details.

### Component 2

Details.

## Trade-offs & Considerations

- Trade-off 1: explanation
- Trade-off 2: explanation

## Failure Scenarios & Mitigations

- Scenario 1: mitigation
- Scenario 2: mitigation`,
};

// ─── Explanation rules ────────────────────────────────────────────────────────

export const EXPLANATION_RULES = [
  'Use ## for top-level sections, ### for sub-sections',
  'Add a blank line after every heading',
  'Add a blank line between sections',
  'Code fences (```) must be on their own line with a language tag',
  'Bold markers (**) must be on the same line as the text — never split across lines',
  'Each bullet must be on its own line starting with "- "',
  'Minimum 3 sections; system-design questions must use the NFR format',
  'Do not repeat the plain-text answer verbatim — add depth',
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
