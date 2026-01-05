/**
 * Citation-Based Blog Generation Template
 * Creates blog posts from real, fetched source content
 */

import { jsonOutputRule, buildSystemContext } from './base.js';

export const schema = {
  title: "Compelling, SEO-friendly title",
  introduction: "Hook that draws readers in, explains why this matters",
  sections: [
    {
      heading: "Section title",
      content: "Markdown content with inline citations [1], [2]"
    }
  ],
  diagram: "Mermaid diagram code (without ```mermaid wrapper)",
  diagramType: "flowchart|sequence|architecture",
  diagramLabel: "Diagram description",
  quickReference: ["Key takeaway 1", "Key takeaway 2", "Key takeaway 3"],
  glossary: [{ term: "Term", definition: "Definition" }],
  funFact: "Interesting fact related to the topic",
  conclusion: "Summary and call to action",
  metaDescription: "SEO meta description (150-160 chars)",
  difficulty: "beginner|intermediate|advanced",
  tags: ["tag1", "tag2", "tag3"],
  socialSnippet: {
    hook: "Attention-grabbing first line",
    body: "Key points",
    cta: "Call to action",
    hashtags: "#Engineering #Tech"
  }
};

export const guidelines = [
  'Use ONLY information from the provided sources',
  'Every major claim should have a citation [n]',
  'Synthesize information across multiple sources',
  'Provide practical, actionable insights',
  'Include code examples where relevant',
  'Create a clear structure with logical flow',
  'Make it educational and engaging',
  'NEVER use first person - write in third person or address reader as "you"'
];

export function build(context) {
  const { topic, sources } = context;
  
  // Prepare source summaries
  const sourceSummaries = sources.map((s, i) => 
    `[${i + 1}] ${s.title}\nURL: ${s.url}\nContent excerpt: ${s.content.substring(0, 1500)}...`
  ).join('\n\n---\n\n');
  
  return `${buildSystemContext('citationBlog')}

Create a comprehensive, engaging blog post about: "${topic}"

REAL SOURCES (use these for content and citations):
${sourceSummaries}

REQUIREMENTS:
${guidelines.map(g => `- ${g}`).join('\n')}

STRUCTURE:
1. Introduction - Hook the reader, explain why this matters
2. Core Concepts - Explain the fundamentals with citations
3. Implementation/Patterns - Practical details and examples
4. Best Practices - Key recommendations from sources
5. Common Pitfalls - What to avoid
6. Conclusion - Summary and next steps

CITATION RULES:
- Use inline citations [1], [2], etc. referencing source numbers
- Cite specific claims and statistics
- Cross-reference multiple sources when possible

Output this exact JSON structure:
${JSON.stringify(schema, null, 2)}

${jsonOutputRule}`;
}

export default { schema, guidelines, build };
