import config from '../../config.js';

export {
  ANSWER_RULES,
  EXPLANATION_RULES,
  EXPLANATION_FORMATS,
  ISSUE_SEVERITY,
  auditAnswer,
  buildAnswerStandardSection,
} from './answer-standard.js';

const { tldr: tldrT, eli5: eli5T, diagram: diagT } = config.qualityThresholds;

// ─── Audit helpers ────────────────────────────────────────────────────────────

function auditTldr(v) {
  if (!v?.tldr) return ['TLDR_MISSING'];
  const issues = [];
  if (v.tldr.length < tldrT.minLength) issues.push('TLDR_TOO_SHORT');
  if (v.tldr.length > tldrT.maxLength) issues.push('TLDR_TOO_LONG');
  if (/[*_`#\[]/.test(v.tldr)) issues.push('TLDR_HAS_MARKDOWN');
  return issues;
}

function auditEli5(v) {
  if (!v?.eli5) return ['ELI5_MISSING'];
  const issues = [];
  if (v.eli5.length < eli5T.minLength) issues.push('ELI5_TOO_SHORT');
  if (v.eli5.length > eli5T.maxLength) issues.push('ELI5_TOO_LONG');
  if (!/\blike\b|imagine|think of/i.test(v.eli5)) issues.push('ELI5_JARGON_NO_ANALOGY');
  return issues;
}

function auditDiagram(v) {
  if (!v?.diagram) return ['DIAGRAM_MISSING'];
  const issues = [];
  if (v.diagram.length < diagT.minLength) issues.push('DIAGRAM_TOO_SHORT');
  const arrows = (v.diagram.match(/-->/g) || []).length;
  if (arrows < diagT.minNodes) issues.push('DIAGRAM_TOO_FEW_NODES');
  if (!/style\s/i.test(v.diagram)) issues.push('DIAGRAM_NO_STYLE_LINES');
  if (/\bStart\b|\bEnd\b/i.test(v.diagram) && arrows < 2) issues.push('DIAGRAM_TRIVIAL');
  return issues;
}

function auditFlashcard(v) {
  const issues = [];
  if (!v?.front) issues.push('FLASHCARD_MISSING_FRONT');
  else if (v.front.length > 100) issues.push('FLASHCARD_FRONT_TOO_LONG');
  if (!v?.back) issues.push('FLASHCARD_MISSING_BACK');
  else if (v.back.length > 300) issues.push('FLASHCARD_BACK_TOO_LONG');
  if (!v?.hint) issues.push('FLASHCARD_MISSING_HINT');
  if (!v?.mnemonic) issues.push('FLASHCARD_MISSING_MNEMONIC');
  return issues;
}

function auditCodingChallenge(v) {
  const issues = [];
  if (!v?.title) issues.push('CHALLENGE_MISSING_TITLE');
  if (!v?.description) issues.push('CHALLENGE_MISSING_DESCRIPTION');
  if (!v?.testCases) issues.push('CHALLENGE_MISSING_TEST_CASES');
  else if (v.testCases.length < 2) issues.push('CHALLENGE_TOO_FEW_TEST_CASES');
  if (!v?.sampleSolution) issues.push('CHALLENGE_MISSING_SAMPLE_SOLUTION');
  return issues;
}

function auditBlog(v) {
  const issues = [];
  if (!v?.title) issues.push('BLOG_MISSING_TITLE');
  if (!v?.introduction) issues.push('BLOG_MISSING_INTRODUCTION');
  if (!v?.sections) issues.push('BLOG_MISSING_SECTIONS');
  else if (!Array.isArray(v.sections) || v.sections.length < 2) issues.push('BLOG_SECTIONS_EMPTY');
  if (!v?.conclusion) issues.push('BLOG_MISSING_CONCLUSION');
  if (!Array.isArray(v?.sources) || !v.sources.some(s => s?.url)) issues.push('BLOG_MISSING_SOURCES');
  return issues;
}

function auditRealWorldCase(v) {
  const issues = [];
  for (const f of ['company', 'scenario', 'solution', 'outcome', 'sourceUrl']) {
    if (!v?.[f]) issues.push(`RWC_MISSING_${f.toUpperCase()}`);
  }
  if (v?.sourceUrl && !v.sourceUrl.startsWith('http')) issues.push('RWC_INVALID_SOURCE_URL');
  return issues;
}

function auditClassify(v) {
  const issues = [];
  if (!Array.isArray(v?.classifications) || v.classifications.length < 1) {
    issues.push('CLASSIFY_MISSING_CLASSIFICATIONS');
  } else {
    for (const c of v.classifications) {
      if (!c.channel) issues.push('CLASSIFY_MISSING_CHANNEL');
      if (!c.subChannel) issues.push('CLASSIFY_MISSING_SUBCHANNEL');
      if (c.isPrimary === undefined) issues.push('CLASSIFY_MISSING_IS_PRIMARY');
    }
    if (!v.classifications.some(c => c.isPrimary)) issues.push('CLASSIFY_NO_PRIMARY');
  }
  return issues;
}

const RELEVANCE_SCORE_FIELDS = [
  'interviewFrequency', 'practicalRelevance', 'conceptDepth',
  'industryDemand', 'difficultyAppropriate', 'questionClarity', 'answerQuality',
];

function auditRelevance(v) {
  const issues = [];
  for (const f of RELEVANCE_SCORE_FIELDS) {
    if (v?.[f] == null) issues.push(`RELEVANCE_MISSING_${f.toUpperCase()}`);
    else if (v[f] < 1 || v[f] > 10) issues.push(`RELEVANCE_INVALID_${f.toUpperCase()}`);
  }
  if (!['keep', 'improve', 'retire'].includes(v?.recommendation)) {
    issues.push('RELEVANCE_INVALID_RECOMMENDATION');
  }
  return issues;
}

function auditCompany(v) {
  const issues = [];
  if (!Array.isArray(v?.companies) || v.companies.length < 4 || v.companies.length > 6) {
    issues.push('COMPANY_INVALID_COUNT');
  }
  if (!v?.confidence) issues.push('COMPANY_MISSING_CONFIDENCE');
  return issues;
}

function auditLinkedinPoll(v) {
  const issues = [];
  if (!v?.pollQuestion) issues.push('POLL_MISSING_QUESTION');
  else if (v.pollQuestion.length > 130) issues.push('POLL_QUESTION_TOO_LONG');
  if (!Array.isArray(v?.options) || v.options.length !== 4) issues.push('POLL_INVALID_OPTIONS_COUNT');
  else if (v.options.some(o => o.length > 30)) issues.push('POLL_OPTION_TOO_LONG');
  return issues;
}

function auditLinkedinStory(v) {
  const issues = [];
  if (!v?.story) issues.push('STORY_MISSING_STORY');
  else if (v.story.length < 200) issues.push('STORY_TOO_SHORT');
  else if (v.story.length > 1200) issues.push('STORY_TOO_LONG');
  return issues;
}

function auditVideo(v) {
  const issues = [];
  if (!('shortVideo' in (v ?? {}))) issues.push('VIDEO_MISSING_SHORT_VIDEO');
  if (!('longVideo' in (v ?? {}))) issues.push('VIDEO_MISSING_LONG_VIDEO');
  return issues;
}

function auditIntake(v) {
  const issues = [];
  for (const f of ['question', 'channel', 'difficulty']) {
    if (!v?.[f]) issues.push(`INTAKE_MISSING_${f.toUpperCase()}`);
  }
  return issues;
}

// ─── Standards map ────────────────────────────────────────────────────────────

export const STANDARDS = {
  tldr: {
    rules: [
      `Plain text only — no markdown`,
      `Length: ${tldrT.minLength}–${tldrT.maxLength} characters`,
      'Start with a verb or key concept',
      'Be direct and actionable',
      'No filler words like "basically", "essentially", "simply"',
      'Capture the single most important takeaway',
    ],
    schema: { type: 'object', properties: { tldr: { type: 'string' } } },
    audit: auditTldr,
  },

  eli5: {
    rules: [
      `Plain text only — no markdown`,
      `Length: ${eli5T.minLength}–${eli5T.maxLength} characters`,
      'Must contain an analogy — use "like", "imagine", or "think of"',
      'No technical jargon',
      'Use concrete examples over abstract concepts',
      'Keep sentences short and simple',
    ],
    schema: { type: 'object', properties: { eli5: { type: 'string' } } },
    audit: auditEli5,
  },

  diagram: {
    rules: [
      'Valid Mermaid syntax only — no markdown code fences',
      'ALWAYS use TD (top-down) layout — NEVER LR',
      `Minimum ${diagT.minNodes} nodes (-->) — target 6-8`,
      'Must include at least 2-4 style lines for key nodes',
      'No trivial diagrams (Start → End only)',
      'No generic labels (Step 1, Concept, Implementation)',
      'Add emojis and color styling to nodes',
    ],
    schema: {
      type: 'object',
      properties: {
        diagram: { type: 'string' },
        diagramType: { type: 'string' },
        confidence: { type: 'string' },
      },
    },
    audit: auditDiagram,
  },

  flashcard: {
    rules: [
      'front: core term/concept being tested, max 100 chars',
      'back: clear, self-contained explanation, max 300 chars',
      'hint: one-line clue that nudges recall without giving it away',
      'mnemonic: memory trick, acronym, or analogy to make it stick',
    ],
    schema: {
      type: 'object',
      properties: {
        front: { type: 'string' },
        back: { type: 'string' },
        hint: { type: 'string' },
        mnemonic: { type: 'string' },
      },
    },
    audit: auditFlashcard,
  },

  codingChallenge: {
    rules: [
      'title, description, testCases, and sampleSolution are required',
      'Minimum 2 test cases covering normal AND edge cases',
      'Test case inputs/outputs MUST be valid JSON',
      'Function names: camelCase for JS, snake_case for Python',
      'Problems must be solvable in 10-20 minutes',
      'Starter code has function signature only with "// Your code here"',
    ],
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        testCases: { type: 'array' },
        sampleSolution: { type: 'object' },
      },
    },
    audit: auditCodingChallenge,
  },

  blog: {
    rules: [
      'title, introduction, sections (≥2), and conclusion are required',
      'At least 1 source with a url field',
      'NEVER write in first-person ("I", "my", "me", "we")',
      'Introduction MUST include a citation [1] for the opening story',
      'Write like a story: Hook → Struggle → Discovery → Solution → Transformation',
    ],
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        introduction: { type: 'string' },
        sections: { type: 'array' },
        conclusion: { type: 'string' },
        sources: { type: 'array' },
      },
    },
    audit: auditBlog,
  },

  realWorldCase: {
    rules: [
      'company, scenario, solution, outcome, and sourceUrl are required',
      'sourceUrl must start with http',
      'Real, well-known companies only — no hypothetical scenarios',
      'Prioritize cases with specific, measurable outcomes',
      'Return null for company if only hypothetical examples exist',
    ],
    schema: {
      type: 'object',
      properties: {
        company: { type: 'string' },
        scenario: { type: 'string' },
        solution: { type: 'string' },
        outcome: { type: 'string' },
        sourceUrl: { type: 'string' },
      },
    },
    audit: auditRealWorldCase,
  },

  classify: {
    rules: [
      'classifications array with ≥1 item required',
      'Each item must have channel, subChannel, and isPrimary',
      'Exactly one classification must have isPrimary: true',
      'A question can belong to MULTIPLE channels (multi-label)',
      'confidence must be: high | medium | low',
    ],
    schema: {
      type: 'object',
      properties: {
        classifications: { type: 'array' },
        confidence: { type: 'string' },
      },
    },
    audit: auditClassify,
  },

  relevance: {
    rules: [
      'All 7 score fields required (1-10): interviewFrequency, practicalRelevance, conceptDepth, industryDemand, difficultyAppropriate, questionClarity, answerQuality',
      'recommendation must be: keep | improve | retire',
      'keep = weighted score ≥80, improve = 40-79, retire = <40',
      'Provide specific improvement suggestions if score < 80',
    ],
    schema: {
      type: 'object',
      properties: Object.fromEntries(
        [...RELEVANCE_SCORE_FIELDS, 'recommendation', 'reasoning'].map(f => [f, { type: f === 'recommendation' || f === 'reasoning' ? 'string' : 'number' }])
      ),
    },
    audit: auditRelevance,
  },

  company: {
    rules: [
      'companies array with 4-6 real company name strings',
      'confidence must be: high | medium | low',
      'Prioritize FAANG and top-tier tech companies',
      'Only include companies that conduct technical interviews',
    ],
    schema: {
      type: 'object',
      properties: {
        companies: { type: 'array' },
        confidence: { type: 'string' },
      },
    },
    audit: auditCompany,
  },

  linkedinPoll: {
    rules: [
      'question ≤130 chars, must end with ?',
      'Exactly 4 options, each ≤30 chars, plain text, no labels/markdown',
      'correctIndex: 0-based, randomize position (not always 0)',
      'Do NOT reveal the answer in introText',
      'No fabricated statistics or unverified percentages',
    ],
    schema: {
      type: 'object',
      properties: {
        pollQuestion: { type: 'string' },
        options: { type: 'array' },
        correctIndex: { type: 'number' },
      },
    },
    audit: auditLinkedinPoll,
  },

  linkedinStory: {
    rules: [
      'story field required — single string with \\n\\n between paragraphs',
      'Prioritize recent tech trends (2024-2025) when topic matches',
      '600-900 characters total',
      'No markdown, no hashtags (added separately), no section headers',
    ],
    schema: {
      type: 'object',
      properties: {
        story: { type: 'string' },
      },
    },
    audit: auditLinkedinStory,
  },

  video: {
    rules: [
      'shortVideo and longVideo fields required (can be null)',
      'Video IDs must be exactly 11 characters',
      'Do NOT fabricate video IDs — use null if unsure',
      'confidence: high | medium | low',
    ],
    schema: {
      type: 'object',
      properties: {
        shortVideo: {},
        longVideo: {},
        confidence: { type: 'string' },
      },
    },
    audit: auditVideo,
  },

  intake: {
    rules: [
      'question, channel, and difficulty are required',
      'question: refined, professional, ends with ?',
      'difficulty: beginner | intermediate | advanced',
      'answer: plain text only, no markdown, under 150 chars',
      'channel must match CHANNEL_STRUCTURE keys',
    ],
    schema: {
      type: 'object',
      properties: {
        question: { type: 'string' },
        channel: { type: 'string' },
        difficulty: { type: 'string' },
      },
    },
    audit: auditIntake,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function buildStandardSection(contentType) {
  const standard = STANDARDS[contentType];
  if (!standard) return '';
  const rules = standard.rules.map(r => `- ${r}`).join('\n');
  return `${contentType.toUpperCase()} STANDARD (MANDATORY):\n${rules}`;
}

export function validate(contentType, value) {
  const audit = STANDARDS[contentType]?.audit;
  if (!audit) return { valid: false, issues: [`No audit function for "${contentType}"`] };
  const issues = audit(value);
  return { valid: issues.length === 0, issues };
}
