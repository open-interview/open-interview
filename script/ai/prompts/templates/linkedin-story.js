/**
 * LinkedIn Story Generation Template
 * Creates engaging story-style posts for LinkedIn with proper formatting
 * Prioritizes recent technology updates, tools, and patterns
 */

// Simple schema format expected by validator: { fieldName: 'type' }
export const schema = {
  story: 'string'
};

// Recent tech trends to prioritize (updated regularly)
const RECENT_TECH_TRENDS = [
  // AI/ML (2024-2025)
  { keyword: 'ai', trend: 'AI agents, RAG patterns, LangGraph, Claude 3.5, GPT-4o, Gemini 2.0' },
  { keyword: 'llm', trend: 'Fine-tuning, prompt engineering, AI coding assistants, Cursor, Copilot' },
  { keyword: 'ml', trend: 'MLOps maturity, feature stores, model monitoring, LLMOps' },
  
  // Cloud & Infrastructure
  { keyword: 'kubernetes', trend: 'Gateway API GA, Karpenter, cilium, eBPF networking' },
  { keyword: 'aws', trend: 'Bedrock agents, Aurora Limitless, EKS Auto Mode' },
  { keyword: 'terraform', trend: 'OpenTofu adoption, Terraform stacks, CDK for Terraform' },
  { keyword: 'docker', trend: 'Docker Build Cloud, Wasm support, Docker Scout' },
  
  // Languages & Frameworks
  { keyword: 'react', trend: 'React 19, Server Components, React Compiler' },
  { keyword: 'node', trend: 'Node.js 22, native TypeScript support, built-in test runner' },
  { keyword: 'python', trend: 'Python 3.13, free-threading, JIT compiler' },
  { keyword: 'rust', trend: 'Rust in Linux kernel, async improvements, embedded growth' },
  { keyword: 'typescript', trend: 'TypeScript 5.5+, isolated declarations, config improvements' },
  
  // Databases
  { keyword: 'database', trend: 'Vector databases, pgvector, Turso, PlanetScale, Neon' },
  { keyword: 'postgres', trend: 'PostgreSQL 17, pgvector for AI, logical replication improvements' },
  
  // DevOps & Platform
  { keyword: 'devops', trend: 'Platform engineering, Internal Developer Platforms, Backstage' },
  { keyword: 'observability', trend: 'OpenTelemetry maturity, eBPF tracing, AI-powered observability' },
  { keyword: 'security', trend: 'Zero trust, SBOM requirements, supply chain security' },
  
  // Architecture
  { keyword: 'microservice', trend: 'Service mesh simplification, modular monoliths comeback' },
  { keyword: 'system-design', trend: 'Event-driven architecture, CQRS patterns, edge computing' },
  { keyword: 'api', trend: 'GraphQL federation, tRPC, API-first design' }
];

// Diverse hook patterns to avoid repetition
const HOOK_PATTERNS = [
  'question', // Start with a thought-provoking question
  'statistic', // Lead with a surprising number or fact
  'contrarian', // Challenge common assumptions
  'story', // Brief narrative (not always 2am!)
  'problem', // State a common pain point
  'insight', // Share a key realization
  'trend', // Highlight what's changing in 2025
  'mistake' // Common error engineers make
];

export function build(context) {
  const { title, excerpt, channel, tags: rawTags } = context;

  // Parse tags if it's a string
  let tags = rawTags;
  if (typeof tags === 'string') {
    try {
      tags = JSON.parse(tags);
    } catch {
      tags = tags.includes(',') ? tags.split(',').map(t => t.trim()) : [tags];
    }
  }
  tags = Array.isArray(tags) ? tags : [];

  // Find relevant recent trends
  const contentText = `${title} ${excerpt} ${channel} ${tags.join(' ')}`.toLowerCase();
  const relevantTrends = RECENT_TECH_TRENDS.filter(t => contentText.includes(t.keyword));

  const trendLines = relevantTrends.map(t => `- ${t.trend}`).join('\n');
  const trendContext = relevantTrends.length > 0
    ? `\nRelevant 2025 context you can weave in naturally:\n${trendLines}`
    : '';

  // Select a random hook style to ensure variety
  const hookStyle = HOOK_PATTERNS[Math.floor(Math.random() * HOOK_PATTERNS.length)];
  const jsonFormat = String.raw`{"story": "your post text here with \n\n between paragraphs and \n between bullet points"}`;

  return `You are a senior SRE/DevOps engineer with 10+ years of experience writing on LinkedIn. Write a post about the article below in your own voice — like you're sharing a genuine insight with peers, not filling in a template.

Article: ${title}
Topic: ${channel || 'tech'}
Summary: ${excerpt || 'Technical interview preparation content'}
${trendContext}

Hook style to use: "${hookStyle}"
Examples of each style (these are patterns, NOT templates to copy):
- question: "Why do 90% of engineers get X wrong?"
- statistic: "73% of production outages trace back to this one thing."
- contrarian: "Everyone optimizes for X. The real bottleneck is Y."
- story: "Our deploy took down prod last week. Cause? One missing label."
- problem: "You've seen this error. Here's what it actually means."
- insight: "After reviewing 100+ PRs, I keep seeing the same gap."
- trend: "The way teams handle X in 2025 is completely different."
- mistake: "Spent 3 days chasing this bug. The fix was 4 characters."

WRITE THE POST AS FLOWING TEXT — no headers, no labels, no "Section 1", no structure markers of any kind. Just write it naturally like a human would.

The post should:
- Open with the hook style above (1-2 punchy lines)
- Briefly explain the concept in plain language (what it is, why it matters)
- Share 4-5 specific insights as emoji bullet points on separate lines
- Close with one memorable line that sticks

GOOD EXAMPLE:
---
67% of Kubernetes clusters are misconfigured in production.

Most teams nail the deployment but skip resource limits. These tell the scheduler how much CPU/memory a pod actually needs. Without them, one noisy neighbour pod can starve everything else.

What actually matters:

🔍 Requests = minimum guarantee — set too low and pods get evicted under pressure
⚡ Limits = hard cap — too high wastes money, too low causes silent CPU throttling
🎯 Use Vertical Pod Autoscaler to learn real usage before setting hard numbers
🛡️ Always set memory limits — OOM kills are silent and brutal to debug
💡 Start conservative, then tune from P95 metrics after a week of real traffic

Resource management is not optional. It's the difference between a stable cluster and 3am pages.
---

ANOTHER GOOD EXAMPLE:
---
Why do senior engineers obsess over idempotency?

Because networks lie. Requests time out, retries happen, and the same message can arrive twice. Idempotency means your system produces the same result whether the operation runs once or ten times — which is everything in distributed systems.

Core ideas:

🔍 Use unique request IDs so duplicates are detected and silently skipped
⚡ Design endpoints so POST /order with the same ID returns the existing order, not an error
🎯 Database upserts (INSERT ... ON CONFLICT UPDATE) are your best friend here
🛡️ Never increment a counter directly — derive state from events instead
💡 Write explicit retry tests — if you haven't tested it, it will break in production

The systems that survive are the ones built assuming failure will happen.
---

RULES:
- No section headers or labels whatsoever
- No markdown (no **, no ##)
- No hashtags or URLs (added separately)
- Short paragraphs, blank lines between them
- 600-900 characters total
- Emoji bullets on their own lines only

Output ONLY valid JSON:
${jsonFormat}`;
}

export default { schema, build };
