/**
 * LinkedIn Story Generation Template
 * Creates engaging story-style posts for LinkedIn with emoji-based visuals
 * Prioritizes recent technology updates, tools, and patterns (last 6 months)
 */

// Simple schema format expected by validator: { fieldName: 'type' }
export const schema = {
  story: 'string'
};

// Recent tech trends to prioritize (updated regularly)
// These represent major updates/releases in the last 6 months
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

// Dynamic hook starters - rotated based on content type
const HOOK_PATTERNS = [
  // Question hooks
  'Ever wondered why {topic}?',
  'What if I told you {insight}?',
  'Why do top engineers {action}?',
  
  // Stat/number hooks
  '{percentage}% of {subject} fail because of this one thing.',
  'This single change reduced {metric} by {number}%.',
  '{company} saved ${amount} by doing this differently.',
  
  // Story hooks
  'It was 3am when the pager went off...',
  'The deploy looked fine. Then everything broke.',
  'A senior engineer once told me: "{quote}"',
  
  // Contrarian hooks
  'Everyone says {common_belief}. They\'re wrong.',
  'Stop doing {bad_practice}. Here\'s why.',
  'The "best practice" that\'s actually hurting you.',
  
  // Curiosity hooks
  'The hidden cost of {topic} nobody talks about.',
  'What {company} learned the hard way about {topic}.',
  'The counterintuitive truth about {topic}.',
  
  // Direct value hooks
  'How to {benefit} in {timeframe}.',
  '{number} lessons from debugging {topic} at scale.',
  'The {topic} playbook top teams use.',
  
  // NEW/TRENDING hooks (prioritize recent updates)
  '🆕 {tool/pattern} just changed everything about {topic}.',
  'The 2025 way to handle {topic} (hint: it\'s not what you think).',
  '{technology} got a major update. Here\'s what matters.',
  'Why everyone\'s switching to {new_approach} in 2025.'
];

export function build(context) {
  const { title, excerpt, channel, tags } = context;
  
  // Find relevant recent trends based on channel and content
  const contentText = `${title} ${excerpt} ${channel} ${(tags || []).join(' ')}`.toLowerCase();
  const relevantTrends = RECENT_TECH_TRENDS.filter(t => contentText.includes(t.keyword));
  
  const trendContext = relevantTrends.length > 0 
    ? `\nRECENT TECH CONTEXT (prioritize mentioning these if relevant):
${relevantTrends.map(t => `- ${t.keyword.toUpperCase()}: ${t.trend}`).join('\n')}

⚡ IMPORTANT: If the article relates to any recent updates/releases above, 
LEAD with that angle! Engineers love staying current. Use hooks like:
- "🆕 [Tool] just shipped [feature]..."
- "The 2025 approach to [topic]..."
- "Why [new pattern] is replacing [old pattern]..."
`
    : '';
  
  return `Create an ENGAGING LinkedIn post for a technical blog article.

Article Title: ${title}
Topic/Channel: ${channel || 'tech'}
Summary: ${excerpt || 'Technical interview preparation content'}
${trendContext}
HOOK VARIETY - Use ONE of these patterns (DO NOT always use "Picture this"):
${HOOK_PATTERNS.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Choose the hook pattern that BEST fits the article content. Vary your approach!

FORMAT REQUIREMENTS:
1. Start with a HOOK using one of the patterns above (NOT "Picture this" every time!)
2. Add 2-3 sentences explaining the key insight with real impact
3. Use an EMOJI FLOW to visualize the concept (see examples below)
4. End with a curiosity gap like "The full breakdown reveals..." or "Read on to see how..."

EMOJI FLOW EXAMPLES (use these patterns, they render well on LinkedIn):

Before → After pattern:
❌ Old way: Manual → Slow → Error-prone
✅ New way: Automated → Fast → Reliable

Flow pattern:
📥 Input → ⚙️ Process → 📤 Output → ✅ Result

Problem → Solution pattern:
🔥 Problem → 💡 Solution → 🚀 Impact

Numbered steps:
1️⃣ Detect → 2️⃣ Isolate → 3️⃣ Fix → 4️⃣ Deploy

Comparison pattern:
Junior: 🐢 Debug for hours
Senior: 🚀 Fix in minutes

RULES:
- Total length: 400-600 characters
- Use 3-5 emojis strategically (🚀 💡 ⚡ 🔥 💰 🎯 ✅ ❌ 📈 🔧)
- NO hashtags (added separately)
- NO links (added separately)
- NO ASCII box diagrams (they break on LinkedIn)
- Make it feel like a senior engineer sharing insider knowledge
- The emoji flow should visualize the KEY transformation or process
- VARY your hooks - don't start every post the same way!

HOOK SELECTION GUIDE:
- For incident/outage stories → Use story hooks ("It was 3am...")
- For performance improvements → Use stat hooks ("Reduced latency by 90%...")
- For best practices → Use contrarian hooks ("Stop doing X...")
- For tutorials/how-tos → Use direct value hooks ("How to...")
- For architecture topics → Use curiosity hooks ("The hidden cost of...")
- For NEW tools/updates/releases → Use trending hooks ("🆕 X just changed..." or "The 2025 way...")

RECENCY PRIORITY:
If the topic involves a technology that had updates in the last 6 months:
1. LEAD with the "what's new" angle
2. Mention specific version numbers or release names when relevant
3. Compare old vs new approach
4. Create urgency: "If you're still doing X, you're missing out on Y"

Output JSON format:
{
  "story": "Your engaging story with emoji flow here..."
}

Output ONLY valid JSON.`;
}

export default { schema, build };
