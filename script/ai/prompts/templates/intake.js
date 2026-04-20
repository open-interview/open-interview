/**
 * Intake Bot Prompt Template
 * Maps input questions to channels and generates complete Q&A content
 */

import { jsonOutputRule, markdownFormattingRules } from './base.js';

export const schema = {
  channel: "channel-id",
  subChannel: "subchannel-id",
  question: "refined professional interview question ending with ?",
  answer: "concise answer under 150 chars, plain text, no markdown",
  explanation: "## Why Asked\nInterview context\n\n## Key Concepts\n\n- Point 1\n- Point 2\n\n## Code Example\n\n```javascript\n// code here\n```\n\n## Follow-up Questions\n\n- Follow-up 1\n- Follow-up 2",
  diagram: "flowchart TD\n  A[Start] --> B[End]",
  companies: ["Google", "Amazon", "Meta"],
  difficulty: "beginner|intermediate|advanced",
  tags: ["tag1", "tag2", "tag3"],
  sourceUrl: null,
  videos: { shortVideo: null, longVideo: null },
  relatedChannels: ["other-channel-1", "other-channel-2"]
};

export const CHANNEL_STRUCTURE = {
  'system-design': ['infrastructure', 'distributed-systems', 'api-design', 'caching', 'load-balancing', 'message-queues'],
  'algorithms': ['data-structures', 'sorting', 'dynamic-programming', 'graphs', 'trees'],
  'frontend': ['react', 'javascript', 'css', 'performance', 'web-apis'],
  'backend': ['apis', 'microservices', 'caching', 'authentication', 'server-architecture'],
  'database': ['sql', 'nosql', 'indexing', 'transactions', 'query-optimization'],
  'devops': ['cicd', 'docker', 'automation', 'gitops'],
  'sre': ['observability', 'reliability', 'incident-management', 'chaos-engineering', 'capacity-planning'],
  'kubernetes': ['pods', 'services', 'deployments', 'helm', 'operators'],
  'aws': ['compute', 'storage', 'serverless', 'database', 'networking'],
  'generative-ai': ['llm-fundamentals', 'fine-tuning', 'rag', 'agents', 'evaluation'],
  'machine-learning': ['algorithms', 'model-training', 'deployment', 'deep-learning', 'evaluation'],
  'security': ['application-security', 'owasp', 'encryption', 'authentication'],
  'testing': ['unit-testing', 'integration-testing', 'tdd', 'test-strategies'],
  'behavioral': ['star-method', 'leadership-principles', 'soft-skills', 'conflict-resolution']
};

export function build(context) {
  const { inputQuestion, channelStats, underservedChannels } = context;
  
  const channelList = Object.entries(CHANNEL_STRUCTURE)
    .map(([ch, subs]) => `${ch} (${channelStats[ch] || 0} questions): [${subs.join(', ')}]`)
    .join('\n');
  
  const priorityChannels = underservedChannels?.length > 0 
    ? `\n\nPRIORITY: These channels need more questions: ${underservedChannels.join(', ')}`
    : '';

  return `You are a JSON generator. Output ONLY valid JSON, no explanations, no markdown, no text before or after.

Analyze this interview question and map it to the best channel/subchannel, refine it, and generate a complete answer.

Input Question: "${inputQuestion}"

Available channels and subchannels (with current question counts):
${channelList}${priorityChannels}

${markdownFormattingRules}

FIELD-SPECIFIC RULES:
- "answer": Plain text only, NO markdown, NO bold, under 150 characters
- "explanation": Well-formatted markdown with proper headings (##), lists (- ), and code blocks (\`\`\`)
- Each section in explanation must be separated by blank lines
- Code blocks must specify language and be on their own lines

Output this exact JSON structure:
${JSON.stringify(schema, null, 2).replace(/\\n/g, '\\n')}

${jsonOutputRule}`;
}

export default { schema, CHANNEL_STRUCTURE, build };
