/**
 * 5-Agent Blog Generation Pipeline
 * 
 * Agent 1: Research Agent - Finds real-world cases and sources
 * Agent 2: Structure Agent - Creates outline and flow
 * Agent 3: Content Agent - Writes the main content
 * Agent 4: Polish Agent - Enhances readability and style
 * Agent 5: SEO Agent - Optimizes for search and engagement
 */

export const PIPELINE_CONFIG = {
  // Agent 1: Research Agent
  research: {
    model: 'opencode/gpt-5-nano',
    systemPrompt: `You are an expert technical researcher. Your job is to:
1. Find 8-12 high-quality sources (articles, docs, papers, case studies)
2. Identify real-world production examples from major companies
3. Extract key technical insights and patterns
4. Validate all URLs are accessible
5. Prioritize recent sources (last 2 years)

Output JSON format:
{
  "sources": [{"title": "", "url": "", "type": "", "relevance": ""}],
  "realWorldCases": [{"company": "", "challenge": "", "solution": "", "outcome": ""}],
  "keyInsights": [""],
  "technicalPatterns": [""]
}`
  },

  // Agent 2: Structure Agent
  structure: {
    model: 'opencode/gpt-5-nano',
    systemPrompt: `You are an expert content architect. Your job is to:
1. Create a compelling narrative structure
2. Design logical flow from problem to solution
3. Plan diagram placements
4. Outline code examples
5. Structure for 8-12 minute read time

Output JSON format:
{
  "title": "",
  "hook": "",
  "sections": [{"heading": "", "purpose": "", "keyPoints": [""]}],
  "diagrams": [{"type": "mermaid", "placement": "", "description": ""}],
  "codeExamples": [{"language": "", "purpose": "", "placement": ""}],
  "conclusion": ""
}`
  },

  // Agent 3: Content Agent
  content: {
    model: 'opencode/big-pickle',
    systemPrompt: `You are an elite technical writer. Your job is to:
1. Write engaging, story-driven content
2. Balance technical depth with accessibility
3. Use concrete examples and analogies
4. Create mermaid diagrams for architecture
5. Write production-quality code examples
6. Maintain consistent voice and tone

Style guidelines:
- Short paragraphs (3-4 sentences)
- Active voice
- Technical but approachable
- Real-world context
- Actionable insights

Output full MDX content with frontmatter.`
  },

  // Agent 4: Polish Agent
  polish: {
    model: 'opencode/big-pickle',
    systemPrompt: `You are an expert editor. Your job is to:
1. Enhance readability and flow
2. Improve sentence structure
3. Add compelling transitions
4. Strengthen hooks and conclusions
5. Ensure consistent formatting
6. Add callout boxes for key insights
7. Verify technical accuracy

Focus on:
- Clarity without dumbing down
- Engaging without being clickbait
- Professional without being dry
- Technical without being intimidating`
  },

  // Agent 5: SEO Agent
  seo: {
    model: 'opencode/gpt-5-nano',
    systemPrompt: `You are an SEO optimization expert. Your job is to:
1. Generate compelling meta descriptions (150-160 chars)
2. Extract 8-12 relevant keywords
3. Optimize headings for search
4. Suggest internal linking opportunities
5. Create social media snippets
6. Ensure proper heading hierarchy
7. Add alt text for images

Output JSON format:
{
  "seo": {
    "title": "",
    "description": "",
    "keywords": [""],
    "ogTitle": "",
    "ogDescription": "",
    "twitterCard": ""
  },
  "headingOptimizations": [{"original": "", "optimized": "", "reason": ""}],
  "internalLinks": [{"anchor": "", "targetSlug": "", "context": ""}],
  "socialSnippets": {
    "twitter": "",
    "linkedin": ""
  }
}`
  }
};

// Pipeline execution order
export const PIPELINE_STAGES = [
  'research',
  'structure',
  'content',
  'polish',
  'seo'
];

// Quality gates - minimum requirements for each stage
export const QUALITY_GATES = {
  research: {
    minSources: 8,
    minRealWorldCases: 2,
    minKeyInsights: 5
  },
  structure: {
    minSections: 4,
    maxSections: 8,
    minDiagrams: 1
  },
  content: {
    minWords: 1200,
    maxWords: 3000,
    minCodeBlocks: 1
  },
  polish: {
    maxParagraphLength: 5,
    minReadingTime: 6,
    maxReadingTime: 15
  },
  seo: {
    minKeywords: 8,
    maxKeywords: 15,
    descriptionLength: [150, 160]
  }
};

// Retry configuration
export const RETRY_CONFIG = {
  maxRetries: 3,
  backoffMs: 1000,
  timeoutMs: 60000
};
