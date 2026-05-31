/**
 * Central AI Configuration
 * All GenAI settings in one place for consistency across bots
 */

export default {
  defaultProvider: 'opencode',
  defaultModel: process.env.OPENCODE_MODEL || 'opencode/big-pickle',

  retry: {
    maxAttempts: 3,
    delayMs: 10000,
    backoffMultiplier: 1.5
  },

  circuitBreaker: {
    failureThreshold: 5,
    resetTimeoutMs: 300000
  },

  cache: {
    enabled: true,
    ttlMs: 86400000,
    maxSize: 1000
  },

  rateLimit: {
    requestsPerMinute: 30,
    delayBetweenRequestsMs: 2000
  },

  globalRules: [
    'You are a JSON generator. Output ONLY valid JSON.',
    'No markdown code blocks, no explanations, no text before or after.',
    'Follow the exact JSON structure specified.',
    'Be concise and accurate.'
  ],

  qualityThresholds: {
    eli5:        { minLength: 80, maxLength: 500 },
    tldr:        { minLength: 30, maxLength: 150 },
    diagram:     { minLength: 50, minNodes: 4 },
    explanation: { minLength: 200 },
    answer:      { minLength: 150, maxLength: 500 }
  },

  guidelines: {
    // ── ELI5 ──────────────────────────────────────────────────────────────────
    // Goal: lasting mental model, not just a simplification.
    // Learning science: dual coding + concrete-before-abstract + analogy bridging.
    eli5: [
      'Open with a concrete, everyday analogy — not a definition',
      'The analogy MUST map back to the technical concept at the end ("…just like X does Y in software")',
      'Use sensory or spatial language (physical objects, movement, places) — it sticks longer',
      'Avoid all technical jargon; if a term must appear, define it in the same breath',
      'End with a one-sentence mental hook the learner will remember tomorrow',
      'Target: someone who has never written code but can follow a good story',
    ],

    // ── TLDR ─────────────────────────────────────────────────────────────────
    // Goal: standalone memory trigger, not a summary.
    // Learning science: retrieval practice — one precise sentence reconstructs the concept.
    tldr: [
      'Write a MEMORY HOOK, not a summary — it must let the learner reconstruct the concept 24 h later',
      'Prefer specific and concrete over abstract: "Redis stores data in RAM" beats "caching improves speed"',
      'Capture the most important TRADE-OFF or KEY DISTINCTION, not just what something is',
      'Start with the key noun or verb — no filler openers (basically, essentially, this means)',
      'Phrase it as something a confident candidate would say out loud in one breath',
      'If the concept is complex, focus on the ONE point that unlocks everything else',
    ],

    // ── ANSWER ───────────────────────────────────────────────────────────────
    answer: [
      'State the direct answer in the first sentence — no preamble',
      'Name specific technologies, patterns, or trade-offs (Redis not "a cache")',
      'Cover the key points interviewers expect to hear',
      'Declarative style: "X does Y" not "you should use X"',
      'Demonstrate depth with at least one concrete trade-off or edge case',
      'Self-contained — never reference "the explanation" or "above"',
    ],

    // ── EXPLANATION ──────────────────────────────────────────────────────────
    // Learning science: error-based learning + real-world stakes + elaborative interrogation.
    explanation: [
      'Explain the WHY — what problem this solves and why the solution is designed this way',
      'Always include a concrete code or pseudo-code example',
      'Surface at least one common mistake or misconception ("Developers often assume… but…")',
      'Connect to a real production system (Redis, Kafka, React, Postgres, etc.)',
      'Build on the answer — do not repeat it',
      'Every sentence must add new information; remove padding',
    ],

    // ── CLASSIFY ─────────────────────────────────────────────────────────────
    classify: [
      'Return the PRIMARY channel first (most relevant)',
      'Include SECONDARY channels only if genuinely relevant',
      'Maximum 3 channels per question',
      'Only add secondary channels if confidence > medium',
      'Use exact channel and subchannel IDs from the provided structure',
    ],

    // ── CODING CHALLENGE ────────────────────────────────────────────────────
    codingChallenge: [
      'Generate problems solvable in 10-20 minutes',
      'Test case inputs/outputs MUST be valid JSON',
      'Function names: camelCase for JS, snake_case for Python',
      'Include 3-4 test cases covering normal AND edge cases',
      'Solutions must be CORRECT and produce exact expected outputs',
      'Starter code has function signature only with "// Your code here"',
    ],

    // ── COMPANY ─────────────────────────────────────────────────────────────
    company: [
      'Return 4-6 real tech companies known to ask this type of question',
      'Prioritize FAANG and top-tier tech companies',
      'Consider the question topic when selecting companies',
      'Include a mix of company sizes (big tech + unicorns)',
      'Only include companies that actually conduct technical interviews',
    ],

    // ── RELEVANCE ────────────────────────────────────────────────────────────
    relevance: [
      'Score each criterion from 1-10 based on the scale provided',
      'Provide specific improvement suggestions if score is below 80',
      'Recommendation should be: keep (80+), improve (40-79), retire (<40)',
      'Be specific about what topics are missing or need improvement',
    ],

    // ── GENERATE ─────────────────────────────────────────────────────────────
    // Goal: questions that test conceptual depth, not trivia.
    generate: [
      'Question must be SPECIFIC and PRACTICAL — something actually asked in interviews',
      'Include a realistic scenario or context when appropriate',
      'Answer must demonstrate expertise — not a high-level definition',
      'Explanation must include: mechanism, common mistake, and a code example',
      'CRITICAL: Use proper markdown — all ** must be paired, ## on own line, ``` on own line',
      'Bullet points must start with "- " on a new line, not inline',
      'NEVER reference "the candidate", "the team", or context-specific scenarios',
      'Questions must be GENERAL enough to apply to any interview setting',
      'For behavioral questions, ask about general situations only',
      'Avoid "In this scenario…" or "In this case…" — they need prior context to make sense',
    ],

    // ── DIAGRAM ─────────────────────────────────────────────────────────────
    diagram: [
      'Use clear, descriptive node labels — not generic "Step 1" labels',
      'Show the NORMAL FLOW and at least one failure or error path',
      'Keep diagrams focused on the key mechanism — omit incidental details',
      'Use appropriate diagram type: sequence for time-ordered flows, flowchart for decisions',
      'Each node must be named after the real technical component (Router, Cache, DB)',
      'Add emojis and color styling so visual learners can parse the diagram at a glance',
      'Edge labels should use action verbs that explain WHY data moves ("validates", "caches", "rejects")',
      'For flowcharts: ALWAYS use TD (top-down) layout — NEVER LR',
    ],
  },

  logging: {
    logPrompts:    process.env.LOG_PROMPTS === 'true',
    logResponses:  process.env.LOG_RESPONSES === 'true',
    logMetrics:    true,
  },
};
