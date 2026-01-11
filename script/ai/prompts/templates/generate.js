/**
 * Question Generation Prompt Template
 */

import { jsonOutputRule, buildSystemContext, markdownFormattingRules } from './base.js';
import config from '../../config.js';

export const schema = {
  question: "Specific, practical interview question ending with ?",
  answer: "Comprehensive interview answer (150-500 chars) demonstrating expertise with specific details. Plain text only, NO markdown.",
  explanation: "Detailed explanation with sections",
  diagram: "flowchart TD\\n  A[Step] --> B[Step]",
  companies: ["Company1", "Company2"],
  sourceUrl: null,
  videos: { shortVideo: null, longVideo: null }
};

export const channelConfigs = {
  'system-design': [
    { subChannel: 'infrastructure', tags: ['infra', 'scale', 'distributed'] },
    { subChannel: 'distributed-systems', tags: ['dist-sys', 'cap-theorem', 'consensus'] },
    { subChannel: 'api-design', tags: ['api', 'rest', 'grpc', 'graphql'] },
    { subChannel: 'caching', tags: ['cache', 'redis', 'memcached', 'cdn'] },
    { subChannel: 'load-balancing', tags: ['lb', 'traffic', 'nginx', 'haproxy'] },
    { subChannel: 'message-queues', tags: ['kafka', 'rabbitmq', 'sqs', 'pubsub'] },
  ],
  'algorithms': [
    { subChannel: 'data-structures', tags: ['arrays', 'linkedlist', 'hashtable', 'heap'] },
    { subChannel: 'sorting', tags: ['quicksort', 'mergesort', 'complexity'] },
    { subChannel: 'dynamic-programming', tags: ['dp', 'memoization', 'tabulation'] },
    { subChannel: 'graphs', tags: ['bfs', 'dfs', 'dijkstra', 'topological'] },
    { subChannel: 'trees', tags: ['bst', 'avl', 'trie', 'segment-tree'] },
  ],
  'frontend': [
    { subChannel: 'react', tags: ['react', 'hooks', 'context', 'redux'] },
    { subChannel: 'javascript', tags: ['js', 'es6', 'closures', 'promises'] },
    { subChannel: 'css', tags: ['css', 'flexbox', 'grid', 'animations'] },
    { subChannel: 'performance', tags: ['lighthouse', 'bundle', 'lazy-loading'] },
    { subChannel: 'web-apis', tags: ['dom', 'fetch', 'websocket', 'service-worker'] },
  ],
  'backend': [
    { subChannel: 'apis', tags: ['rest', 'graphql', 'grpc', 'openapi'] },
    { subChannel: 'microservices', tags: ['saga', 'cqrs', 'event-sourcing'] },
    { subChannel: 'caching', tags: ['redis', 'memcached', 'cache-invalidation'] },
    { subChannel: 'authentication', tags: ['jwt', 'oauth2', 'oidc', 'saml'] },
    { subChannel: 'server-architecture', tags: ['scaling', 'sharding', 'replication'] },
  ],
  'database': [
    { subChannel: 'sql', tags: ['joins', 'indexes', 'normalization', 'postgres'] },
    { subChannel: 'nosql', tags: ['mongodb', 'dynamodb', 'cassandra', 'redis'] },
    { subChannel: 'indexing', tags: ['btree', 'hash-index', 'composite'] },
    { subChannel: 'transactions', tags: ['acid', 'isolation-levels', 'mvcc'] },
    { subChannel: 'query-optimization', tags: ['explain', 'query-plan', 'partitioning'] },
  ],
  'devops': [
    { subChannel: 'cicd', tags: ['github-actions', 'jenkins', 'gitlab-ci'] },
    { subChannel: 'docker', tags: ['dockerfile', 'compose', 'multi-stage'] },
    { subChannel: 'automation', tags: ['ansible', 'puppet', 'chef'] },
    { subChannel: 'gitops', tags: ['argocd', 'flux', 'declarative'] },
  ],
  'generative-ai': [
    { subChannel: 'llm-fundamentals', tags: ['transformer', 'attention', 'tokenization'] },
    { subChannel: 'fine-tuning', tags: ['lora', 'qlora', 'peft', 'adapter'] },
    { subChannel: 'rag', tags: ['retrieval', 'embeddings', 'vector-db', 'chunking'] },
    { subChannel: 'agents', tags: ['langchain', 'autogen', 'tool-use', 'planning'] },
    { subChannel: 'evaluation', tags: ['hallucination', 'faithfulness', 'relevance'] },
  ],
  'behavioral': [
    { subChannel: 'star-method', tags: ['situation', 'task', 'action', 'result'] },
    { subChannel: 'leadership-principles', tags: ['ownership', 'bias-for-action', 'customer-obsession'] },
    { subChannel: 'soft-skills', tags: ['communication', 'collaboration', 'influence'] },
    { subChannel: 'conflict-resolution', tags: ['negotiation', 'mediation', 'feedback'] },
  ],
};

export const topCompanies = [
  'Google', 'Amazon', 'Apple', 'Meta', 'Netflix', 'Microsoft',
  'Nvidia', 'Tesla', 'Salesforce', 'Adobe', 'Oracle', 'IBM',
  'Snowflake', 'Databricks', 'Cloudflare', 'MongoDB', 'HashiCorp',
  'Stripe', 'Square', 'PayPal', 'Plaid', 'Robinhood', 'Coinbase',
  'Uber', 'Lyft', 'Airbnb', 'DoorDash', 'Instacart',
  'LinkedIn', 'Twitter', 'Snap', 'Discord', 'Slack', 'Zoom',
  'OpenAI', 'Anthropic', 'Scale AI', 'Hugging Face',
  'Bloomberg', 'Goldman Sachs', 'Citadel', 'Two Sigma'
];

export const realScenarios = {
  'system-design': [
    { scenario: 'Design Twitter/X feed', scale: '500M users, 10K tweets/sec', focus: 'fan-out, caching, real-time' },
    { scenario: 'Design Uber ride matching', scale: '1M concurrent rides', focus: 'geospatial, real-time, matching' },
    { scenario: 'Design Netflix video streaming', scale: '200M subscribers', focus: 'CDN, encoding, recommendations' },
  ],
  'algorithms': [
    { problem: 'LRU Cache', pattern: 'HashMap + Doubly Linked List', complexity: 'O(1) get/put' },
    { problem: 'Merge K sorted lists', pattern: 'Min Heap', complexity: 'O(N log K)' },
  ],
};

export const systemDesignFormat = `## Functional Requirements

- Requirement 1
- Requirement 2

## Non-Functional Requirements (NFRs)

- Availability: Target
- Latency: Target
- Scalability: Target
- Consistency: Type

## Back-of-Envelope Calculations

### Users & Traffic

- DAU: Number
- Peak QPS: Number

### Storage

- Per user: Size
- Total: Size

## High-Level Design

Description of the architecture.

## Deep Dive: Key Components

### Component 1

Details about the component.

## Trade-offs & Considerations

- Trade-off 1
- Trade-off 2

## Failure Scenarios & Mitigations

- Scenario 1: Mitigation
- Scenario 2: Mitigation`;

export const standardFormat = `## Why This Is Asked

Interview context explanation.

## Key Concepts

- Concept 1
- Concept 2
- Concept 3

## Code Example

\`\`\`javascript
// Implementation code here
\`\`\`

## Follow-up Questions

- Follow-up question 1
- Follow-up question 2`;

// Use centralized guidelines from config, plus generate-specific rules
const { answer: answerThresholds } = config.qualityThresholds;

export const guidelines = [
  `Answer MUST be ${answerThresholds.minLength}-${answerThresholds.maxLength} characters`,
  ...config.guidelines.generate,
  ...config.guidelines.answer,
  ...config.guidelines.diagram.slice(0, 2)
];

export function build(context) {
  const { channel, subChannel, difficulty, tags: rawTags, targetCompanies: rawCompanies, scenarioHint, ragContext } = context;
  
  // Parse tags if it's a string (from database)
  let tags = rawTags;
  if (typeof tags === 'string') {
    try { tags = JSON.parse(tags); } catch { tags = []; }
  }
  tags = Array.isArray(tags) ? tags : [];

  // Parse targetCompanies if it's a string
  let targetCompanies = rawCompanies;
  if (typeof targetCompanies === 'string') {
    try { targetCompanies = JSON.parse(targetCompanies); } catch { targetCompanies = []; }
  }
  targetCompanies = Array.isArray(targetCompanies) ? targetCompanies : [];

  const isSystemDesign = channel === 'system-design';
  const explanationFormat = isSystemDesign ? systemDesignFormat : standardFormat;

  // Build RAG context section if available
  let ragSection = '';
  if (ragContext?.hasContext && ragContext.related?.length > 0) {
    const existingQuestions = ragContext.related
      .slice(0, 5)
      .map((r, i) => `${i + 1}. "${r.question}"`)
      .join('\n');
    const coveredConcepts = ragContext.concepts?.slice(0, 8).join(', ') || '';
    
    ragSection = `
EXISTING QUESTIONS IN THIS AREA (DO NOT DUPLICATE - generate something DIFFERENT):
${existingQuestions}

CONCEPTS ALREADY COVERED: ${coveredConcepts}

IMPORTANT: Your question MUST:
- Explore a NEW angle not covered by the existing questions above
- Avoid repeating the same concepts
- Fill gaps in the existing coverage
- Be unique and add value to the question bank
`;
  }

  return `${buildSystemContext('generate')}

Generate a REAL interview question that you would actually ask candidates.

CONTEXT:
- Channel: ${channel}/${subChannel}
- Difficulty: ${difficulty}
- Topics: ${tags.join(', ')}
- Target companies: ${targetCompanies.join(', ')}
${scenarioHint ? `- Example scenario for inspiration: ${scenarioHint}` : ''}
${ragSection}
REQUIREMENTS:
${guidelines.map(g => `- ${g}`).join('\n')}

For ${difficulty} level:
- beginner: Fundamental concepts, basic implementation
- intermediate: Real-world scenarios, trade-offs, debugging
- advanced: System design at scale, complex algorithms, production issues

${markdownFormattingRules}

FIELD-SPECIFIC RULES:
- "answer": Plain text ONLY. NO markdown, NO bold (**), NO code blocks. Just plain sentences.
- "explanation": Well-formatted markdown following the format below. Each section separated by blank lines.

${isSystemDesign ? 'SYSTEM DESIGN EXPLANATION FORMAT (MANDATORY):\n' + systemDesignFormat : 'EXPLANATION FORMAT:\n' + standardFormat}

Output this exact JSON structure:
${JSON.stringify(schema, null, 2)}

${jsonOutputRule}`;
}

export default { schema, channelConfigs, topCompanies, realScenarios, guidelines, build };
