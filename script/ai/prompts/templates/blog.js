/**
 * Blog Article Generation Prompt Template
 * Transforms Q&A content into engaging, story-driven blog articles
 */

import { jsonOutputRule, buildSystemContext } from './base.js';

export const schema = {
  title: "Compelling story-driven title that creates curiosity",
  introduction: "Opening hook that draws readers in with a story, problem, or provocative question (3-4 sentences)",
  sections: [
    {
      heading: "Hook — [compelling opening that grabs attention]",
      content: "Content establishing the stakes, context, and curiosity — draws reader in immediately"
    },
    {
      heading: "Problem — [core challenge or pain point]",
      content: "Deep exploration of the problem space — why it matters, who it affects, and what is at stake"
    },
    {
      heading: "Real-World Case — [company name]",
      content: "Documented real-world incident that illustrates the problem and its quantified impact"
    },
    {
      heading: "Deep Dive — [technical exploration]",
      content: "In-depth technical analysis of concepts, trade-offs, and underlying principles"
    },
    {
      heading: "Workflow — [step-by-step process or architecture]",
      content: "Step-by-step breakdown of the solution with the Mermaid diagram referenced inline"
    },
    {
      heading: "Code Example — [implementation walkthrough]",
      content: "Practical code example showing implementation with line-by-line explanations"
    },
    {
      heading: "Lessons Learned — [key takeaways]",
      content: "Summary of insights, best practices, pitfalls to avoid, and actionable advice"
    }
  ],
  realWorldCase: {
    company: "Company name",
    incident: "What happened — the incident, failure, or challenge they faced",
    year: "YYYY",
    impact: "Quantified impact — revenue lost, performance degraded, users affected, etc.",
    sourceUrl: "https://verified-url-to-public-postmortem-or-engineering-blog"
  },
  diagram: "Mermaid diagram code showing architecture/flow (without ```mermaid wrapper)",
  diagramType: "Type of diagram: flowchart|sequence|state|class|er|gantt|pie|mindmap|timeline|architecture",
  diagramLabel: "Human-readable label for the diagram (e.g., 'System Flow', 'Event Sequence', 'State Transitions')",
  images: [
    {
      url: "https://images.unsplash.com/photo-xxxxxxxxx?w=800",
      alt: "Descriptive alt text for accessibility",
      caption: "Caption explaining the image relevance to the content",
      placement: "after-intro|after-section-1|after-section-2|before-conclusion"
    }
  ],
  references: [
    {
      number: 1,
      title: "Reference title",
      url: "https://example.com",
      type: "documentation|blog|paper|video"
    }
  ],
  codeExample: {
    language: "python|javascript|go|rust|typescript|bash",
    code: "// actual code block with inline comments",
    explanation: "Walkthrough of what the code does, why it works, and key design decisions"
  },
  conclusion: "The moral of the story and what to do next — actionable call to action",
  metaDescription: "SEO meta description (150-160 chars)",
  socialSnippet: {
    hook: "Attention-grabbing first line with emoji (max 100 chars)",
    body: "3-4 punchy bullet points with insights/stats that create FOMO",
    cta: "Compelling call-to-action to read the full article",
    hashtags: "5-8 relevant hashtags for LinkedIn (e.g., #SoftwareEngineering #SystemDesign #TechCareers)"
  }
};

export const guidelines = [
  // CRITICAL VOICE RULE
  'NEVER write in first-person. Do NOT use "I", "my", "me", "we" (as author). Use "you", "your", "developers", "teams" instead.',
  
  // CRITICAL CITATION RULE FOR OPENING STORY
  'The introduction/opening paragraph MUST include a citation [1] linking to the source of the real-world story',
  'The FIRST reference in the references array MUST be the reference for the opening story/case study',
  'Example: "In 2017, Stripe faced a critical API failure that cost them millions [1]..." where [1] links to the source',
  
  // LOGICAL FLOW & COHERENCE - NEW CRITICAL REQUIREMENTS
  'Each section must LOGICALLY flow from the previous one - use transition words and phrases',
  'Start each section by connecting to what came before: "Building on this...", "However...", "This leads to..."',
  'Use transition words throughout: however, therefore, moreover, consequently, specifically, for example',
  'Each paragraph should have ONE main idea that connects to the overall narrative',
  'Avoid jumping between unrelated topics - maintain a clear thread throughout',
  'The conclusion must tie back to the introduction and summarize the journey',
  
  // STORYTELLING FOCUS
  'Write like youre telling a story to a friend over coffee, not writing documentation',
  'Start with a HOOK: a problem, a failure, a "picture this" moment, or a provocative question',
  'Example hooks: "It was 3am when the pager went off...", "Picture this: your CEO just tweeted about the new feature...", "Everyone told me this was the right approach. They were wrong."',
  'Build TENSION: what could go wrong? what are the stakes? why should they care?',
  'Use the "hero journey" structure: Problem → Struggle → Discovery → Solution → Transformation',
  'Include "plot twists" - counterintuitive insights that challenge assumptions',
  'End sections with cliffhangers or questions that pull readers forward',
  
  // VOICE & TONE
  'Write for a developer with ~3 years experience - they know the basics, show them the nuances',
  'NEVER use first-person ("I", "my", "me") - write in second-person ("you", "your") or third-person',
  'Be conversational but professional: address the reader directly with "you"',
  'Add personality through observations and insights, not personal anecdotes',
  'Use phrases like "Many developers discover..." or "You might think X, but actually Y"',
  'Use humor and wit naturally - dont force it, but dont be dry either',
  
  // REAL-WORLD GROUNDING
  'Every concept needs a "when would I actually use this?" answer',
  'Include a REAL company war story (Netflix, Uber, Stripe, etc.) - what broke, how they fixed it',
  'ATTRIBUTION RULE: Company war stories MUST be based on publicly documented incidents. Populate realWorldCase with: company, incident, year, impact, and a verified sourceUrl pointing to a post-mortem, engineering blog, or documentation. Do NOT fabricate incidents.',
  'Add "battle scars" - common mistakes and how to avoid them',
  'Include specific numbers: latency, throughput, cost savings, team size',
  
  // STRUCTURE & FORMAT
  'Sections should flow like chapters in a story, not disconnected topics',
  'FOLLOW the section order exactly: Hook → Problem → Real-World Case → Deep Dive → Workflow → Code Example → Lessons Learned',
  'Use bullet lists for "heres what you need to know" moments',
  'Use tables for comparisons: "Option A vs Option B - heres the real tradeoff"',
  'Include a Mermaid diagram that tells the visual story',
  'Use callouts strategically: 💡 Insight, ⚠️ Watch Out, 🔥 Hot Take, 🎯 Key Point',
  
  // REFERENCES & CREDIBILITY - CRITICAL
  'MUST include AT LEAST 8 references with REAL, WORKING URLs',
  'Each reference MUST have number (1-indexed), title, url, and type (documentation|blog|paper|video)',
  'USE ONLY these stable URL patterns that actually exist:',
  '  - Wikipedia: https://en.wikipedia.org/wiki/[Topic]',
  '  - MDN: https://developer.mozilla.org/en-US/docs/...',
  '  - GitHub repos: https://github.com/[org]/[repo]',
  '  - ArXiv papers: https://arxiv.org/abs/[paper-id]',
  '  - RFC docs: https://datatracker.ietf.org/doc/html/rfc[number]',
  '  - Python docs: https://docs.python.org/3/...',
  '  - AWS docs: https://docs.aws.amazon.com/...',
  '  - Kubernetes: https://kubernetes.io/docs/...',
  '  - DigitalOcean tutorials: https://www.digitalocean.com/community/tutorials/...',
  'DO NOT make up URLs - only use URLs you are confident exist',
  'DO NOT use company engineering blog URLs (netflix, uber, stripe blogs) - they frequently 404',
  
  // INLINE CITATIONS - CRITICAL FOR CREDIBILITY
  'ADD INLINE CITATIONS throughout the article content using [1], [2], [3] format',
  'Each citation number corresponds to the index in the references array (1-indexed)',
  'Place citations after key facts, statistics, or technical claims',
  'Example: "Kubernetes uses etcd for distributed consensus [1], which provides strong consistency guarantees [2]."',
  'Aim for at least 5-8 inline citations spread throughout the article',
  'Citations should feel natural, not forced - cite when making factual claims',
  
  // IMAGES - UNSPLASH PHOTOGRAPHY
  'Include AT LEAST 2 images with REAL Unsplash URLs',
  'USE only verified Unsplash photo URLs: https://images.unsplash.com/photo-[id]?w=800',
  'Each image MUST have: url (Unsplash), alt text, caption, and placement',
  'Placement options: after-intro, after-section-1, after-section-2, before-conclusion',
  'Choose images that reinforce the content visually — architecture diagrams, team collaboration, technical setups',
  'Provide descriptive alt text for accessibility (screen readers depend on this)',
  'Add captions that explain the image relevance to the surrounding content',
  
  // CODE EXAMPLE - REQUIRED
  'The codeExample field is REQUIRED — every blog MUST include a runnable or illustrative code snippet',
  'Set language to one of: python, javascript, go, rust, typescript, bash',
  'The code block must be syntactically valid for the declared language',
  'Include inline comments in the code to explain key lines',
  'The explanation field must walk through the code step by step — what each section does and why',
  'The code must directly relate to the blog topic and solve part of the Problem described earlier',
  'Prefer real production patterns over toy examples',

  // ENDING
  'Conclude with the "so what?" - what should they do differently tomorrow?',
  'Leave them with one memorable insight they can share with their team',
  
  // SOCIAL SNIPPET (for sharing)
  'Create a socialSnippet that is ready to copy-paste to LinkedIn/Twitter',
  'Hook: Use ONE of these varied patterns (DO NOT always use "Picture this"):',
  '  - Question: "Ever wondered why...?" or "What if I told you...?"',
  '  - Stat: "90% of engineers miss this..." or "This reduced latency by 50%..."',
  '  - Story: "It was 3am when..." or "The deploy looked fine. Then..."',
  '  - Contrarian: "Everyone says X. They\'re wrong." or "Stop doing X."',
  '  - Curiosity: "The hidden cost of..." or "What Netflix learned about..."',
  '  - Direct value: "How to X in Y time" or "5 lessons from debugging..."',
  'Body: 3-4 bullet points that create urgency/FOMO - use numbers, percentages, bold claims',
  'CTA: End with curiosity gap - hint at what they will learn without giving it away',
  'Use line breaks for readability, keep it under 300 words total',
  'Make it feel like insider knowledge being shared',
  'IMPORTANT: Vary your hooks! Do not start every post the same way.',
  'Hashtags: Include 5-8 relevant LinkedIn hashtags based on the topic, channel, and tags',
  'Common hashtags to consider: #SoftwareEngineering #SystemDesign #TechCareers #CodingInterview #BackendDevelopment #Frontend #DevOps #CloudComputing #DataEngineering #MachineLearning #AI #WebDevelopment #Programming #TechTips #CareerGrowth',
  
  // DIAGRAM TYPE DETECTION
  'Analyze the mermaid diagram syntax to determine diagramType:',
  '  - "flowchart" or "graph" → flowchart',
  '  - "sequenceDiagram" → sequence',
  '  - "stateDiagram" → state',
  '  - "classDiagram" → class',
  '  - "erDiagram" → er (entity relationship)',
  '  - "gantt" → gantt',
  '  - "pie" → pie',
  '  - "mindmap" → mindmap',
  '  - "timeline" → timeline',
  '  - Default to "architecture" if unclear',
  'Set diagramLabel to a human-friendly name like "System Flow", "Event Sequence", "State Machine", "Class Hierarchy", "Data Model", "Project Timeline", etc.',
  
  // HUMAN TOUCH - Make it feel authentic
  'Add touches that make the content feel human-written but NOT first-person:',
  '  - Use "Many developers think X until they learn Y" instead of "I used to think"',
  '  - Add relatable struggles: "We have all been there - staring at a 500 error at 2am"',
  '  - Use conversational transitions: "Here is the thing though...", "But wait, it gets better"',
  '  - Share insights objectively: "This pattern works well because..."',
  '  - Add empathy: "If this feels overwhelming, you are not alone"',
  '  - Use rhetorical questions: "Sound familiar?", "Ever wondered why...?"',
  '  - Include "pro tips": "After debugging this pattern many times, here is what works"',
  '  - Add humor where appropriate: light jokes, relatable dev memes references',
  '  - Use varied sentence lengths - mix short punchy sentences with longer explanations',
  '  - Avoid robotic phrases like "In this article we will explore" or "Let us delve into"',
  '  - NEVER use "I", "my", "me" - always use "you", "your", "developers", "teams"'
];

export function build(context) {
  const { question, answer, explanation, channel, difficulty, tags: rawTags, realWorldCase } = context;

  // Parse tags if it's a string (from database)
  let tags = rawTags;
  if (typeof tags === 'string') {
    try { tags = JSON.parse(tags); } catch { tags = []; }
  }
  tags = Array.isArray(tags) ? tags : [];

  // Build real-world case section if provided
  const realWorldCaseSection = realWorldCase ? `
REAL-WORLD CASE TO USE AS HOOK (REQUIRED):
Company: ${realWorldCase.company}
Incident: ${realWorldCase.incident || 'N/A'}
Year: ${realWorldCase.year || 'N/A'}
Impact: ${realWorldCase.impact || 'N/A'}
Source URL: ${realWorldCase.sourceUrl || 'N/A'}

IMPORTANT: 
- Start the blog with this real-world case! Use it as the opening hook to draw readers in.
- The introduction MUST reference ${realWorldCase.company}'s experience with this topic.
- The introduction MUST include citation [1] linking to the source.
- The FIRST item in your references array MUST be: { number: 1, title: "${realWorldCase.company} incident report", url: "${realWorldCase?.sourceUrl || ''}", type: "article" }
` : '';

  return `${buildSystemContext('blog')}

Transform this interview Q&A into an ENGAGING, STORY-DRIVEN blog article.

Your goal: Make the reader feel like theyre on a journey of discovery, not reading a textbook.
${realWorldCase ? '\nCRITICAL: Start with the real-world case provided below as your opening hook!' : ''}

ORIGINAL CONTENT:
Question: ${question}
Answer: ${answer || 'N/A'}
Explanation: ${explanation || 'N/A'}
Topic: ${channel}
Difficulty: ${difficulty}
Tags: ${tags.join(', ')}
${realWorldCaseSection}

STORYTELLING REQUIREMENTS:
${guidelines.map(g => `- ${g}`).join('\n')}

STRICT SECTION STRUCTURE — each section is required, in this exact order:
1. Hook — Opening hook that grabs attention and establishes stakes
2. Problem — Core challenge or pain point being addressed
3. Real-World Case — Documented incident showing real-world impact
4. Deep Dive — Technical analysis of concepts and trade-offs
5. Workflow — Step-by-step process with Mermaid diagram reference
6. Code Example — Implementation walkthrough with code
7. Lessons Learned — Key takeaways and actionable next steps

Output this exact JSON structure:
${JSON.stringify(schema, null, 2)}

${jsonOutputRule}`;
}

export default { schema, guidelines, build };
