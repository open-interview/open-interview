/**
 * Answer Standard Template
 *
 * Defines the canonical structure, rules, and validation criteria for
 * all interview question answers generated or improved in this system.
 *
 * Learning science principles applied:
 * - Error-based learning: surfacing common mistakes dramatically improves retention
 * - Elaborative interrogation: explaining WHY anchors the concept to existing knowledge
 * - Concrete examples before abstractions: code example before explanation, not after
 * - Real-world stakes: naming production systems (Redis, Kafka, etc.) makes it memorable
 */

import config from '../../config.js';

const { answer: thresholds } = config.qualityThresholds;

// ─── Structure ────────────────────────────────────────────────────────────────

export const answerSchema = {
  answer:      `Plain text, ${thresholds.minLength}-${thresholds.maxLength} chars. No markdown, no bold, no code blocks.`,
  explanation: 'Markdown with ## sections. See EXPLANATION_FORMATS below.',
};

// ─── Plain-text answer rules ──────────────────────────────────────────────────

export const ANSWER_RULES = [
  `Length: ${thresholds.minLength}–${thresholds.maxLength} characters (hard limits)`,
  'Plain text ONLY — no markdown, no **bold**, no `code`, no bullet lists',
  'State the direct answer first — no preamble, no context-setting',
  'Name specific technologies, patterns, or trade-offs (Redis, not "a cache")',
  'Self-contained — no "as mentioned above" or "see explanation"',
  'No filler: no "Great question", "Basically", "Simply put", "In summary"',
  'No trailing ellipsis or cut-off sentences',
  'Declarative style — state facts ("X does Y"), not advice ("you should use X")',
  'Include at least one concrete trade-off or edge case to show depth',
];

// ─── Explanation formats ──────────────────────────────────────────────────────
// Each section is chosen for a specific learning-science reason:
// "How It Works"    → builds the mental model (elaborative interrogation)
// "Code Example"    → concrete before abstract (dual coding)
// "Common Mistake"  → error-based learning; the most powerful retention tool
// "Interview Tip"   → real-world stakes + what evaluators are actually listening for

export const EXPLANATION_FORMATS = {
  /**
   * Standard format for most technical questions.
   */
  standard: `## How It Works

Concise technical explanation of the mechanism, including WHY it is designed this way.

## Code Example

\`\`\`javascript
// Minimal, runnable example showing the concept
\`\`\`

## Key Points

- **Point 1**: one-line explanation
- **Point 2**: one-line explanation
- **Point 3**: one-line explanation

## Common Mistake

What developers typically get wrong or misunderstand about this concept, and why that matters.

## Interview Tip

The specific insight or trade-off the interviewer is listening for. What separates a good answer from a great one.`,

  /**
   * System design format — for questions involving "design", "architect", or "scale".
   */
  systemDesign: `## Core Design

High-level architecture in 2-3 sentences. Name the real components and how they connect.

## Components

- **Component 1**: its role and why this design choice was made
- **Component 2**: its role and why this design choice was made

## Trade-offs

- **Pro**: concrete benefit with a real-world implication
- **Con**: concrete limitation and how to mitigate it

## Scale Considerations

Key numbers, bottlenecks, and the failure mode to watch for at scale.

## Common Mistake

The design decision most candidates get wrong and why it causes problems.

## Interview Tip

What the interviewer is testing: the specific depth signal that elevates a good answer.`,
};

// ─── Explanation rules ────────────────────────────────────────────────────────

export const EXPLANATION_RULES = [
  'Use ## for top-level sections, ### for sub-sections',
  'Add a blank line after every heading',
  'Code fences (```) must be on their own line with a language tag',
  'Bold markers (**) must be on the same line as the text',
  'Each bullet must be on its own line starting with "- "',
  'Minimum 4 sections: How It Works, Code Example, Common Mistake, and at least one more',
  'Do not repeat the plain-text answer — add mechanism, examples, and depth only',
  'Every sentence must add new information — no padding or re-phrasing',
  '"Common Mistake" section is REQUIRED — name the actual mistake, not a vague warning',
  '"Interview Tip" section is REQUIRED — state what the interviewer is specifically listening for',
];

// ─── Audit criteria ──────────────────────────────────────────────────────────

export function auditAnswer(answer = '', explanation = '') {
  const issues = [];

  if (!answer || answer.trim().length === 0) {
    issues.push('missing_answer');
  } else {
    if (answer.length < thresholds.minLength) issues.push('short_answer');
    if (answer.length > thresholds.maxLength) issues.push('long_answer');
    if (/\*\*/.test(answer))         issues.push('answer_has_markdown_bold');
    if (/```/.test(answer))          issues.push('answer_has_code_block');
    if (/^#+\s/m.test(answer))       issues.push('answer_has_headings');
    if (/\.\.\.$/.test(answer.trim())) issues.push('truncated_answer');
    if (answer.trim().length < 50)   issues.push('placeholder_answer');
  }

  if (!explanation || explanation.trim().length === 0) {
    issues.push('missing_explanation');
  } else {
    if (explanation.length < config.qualityThresholds.explanation.minLength) {
      issues.push('short_explanation');
    }
    if (!/^##\s/m.test(explanation))           issues.push('explanation_missing_sections');
    if (/\.\.\.$/.test(explanation.trim()))    issues.push('truncated_explanation');
    if (!/common mistake/i.test(explanation))  issues.push('explanation_missing_common_mistake');
    if (!/interview tip/i.test(explanation))   issues.push('explanation_missing_interview_tip');
  }

  return issues;
}

export const ISSUE_SEVERITY = {
  missing_answer:                      'critical',
  missing_explanation:                 'critical',
  truncated_answer:                    'high',
  truncated_explanation:               'high',
  short_answer:                        'high',
  placeholder_answer:                  'high',
  explanation_missing_common_mistake:  'high',
  explanation_missing_interview_tip:   'high',
  answer_has_markdown_bold:            'medium',
  answer_has_code_block:               'medium',
  answer_has_headings:                 'medium',
  long_answer:                         'medium',
  short_explanation:                   'medium',
  explanation_missing_sections:        'low',
};

export function buildAnswerStandardSection(isSystemDesign = false) {
  const format = isSystemDesign
    ? EXPLANATION_FORMATS.systemDesign
    : EXPLANATION_FORMATS.standard;

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
