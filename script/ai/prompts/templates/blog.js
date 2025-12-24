/**
 * Blog Article Generation Prompt Template
 * Transforms Q&A content into professional blog articles
 */

import { jsonOutputRule, buildSystemContext } from './base.js';

export const schema = {
  title: "Catchy, memorable title (not a question) - make it fun!",
  introduction: "Hook with a relatable real-world scenario or analogy (2-3 sentences)",
  sections: [
    {
      heading: "Section heading",
      content: "Section content in markdown with lists, tables, callouts, and real examples"
    }
  ],
  realWorldExample: {
    company: "Famous company name (Netflix, Uber, Spotify, etc.)",
    scenario: "How they use this concept in production",
    lesson: "Key takeaway from their approach"
  },
  diagram: "Mermaid diagram code showing architecture/flow/dependencies (without ```mermaid wrapper)",
  glossary: [
    { term: "Technical term used in article", definition: "Simple 1-line explanation for 3-year dev" }
  ],
  sources: [
    { title: "Source title or article name", url: "https://example.com/article", type: "documentation|blog|paper|video" }
  ],
  quickReference: ["Key point 1", "Key point 2", "Key point 3"],
  funFact: "Interesting trivia or surprising fact about this topic",
  conclusion: "Wrap-up with actionable next steps",
  metaDescription: "SEO meta description (150-160 chars)"
};

export const guidelines = [
  'Write for a developer with ~3 years experience - skip basics, dive into the good stuff',
  'Title should be catchy and memorable, maybe even a bit playful',
  'Start with a relatable scenario: "Ever had your API crash at 3am because..."',
  'Use analogies from everyday life to explain complex concepts',
  'Include a REAL company example (Netflix, Uber, Airbnb, Stripe, etc.) showing how they solved this',
  'Keep it concise - respect the readers time, no fluff',
  'Add humor where appropriate - tech doesnt have to be boring',
  'Use "you" and "we" to make it conversational',
  'Include gotchas and "things I wish I knew earlier" insights',
  'Add a fun fact or surprising trivia about the topic',
  'ALWAYS use bullet lists for complex concepts',
  'ALWAYS include comparison tables when comparing approaches',
  'ALWAYS add a Mermaid diagram for visual learners',
  'Generate glossary terms for technical jargon used in the article',
  'ALWAYS include 2-4 credible sources (official docs, engineering blogs, research papers)',
  'Prefer sources from: official documentation, company engineering blogs (Netflix, Uber, etc.), academic papers, reputable tech blogs',
  'Use callouts: 💡 Pro Tip, ⚠️ Gotcha, 🔥 Hot Take, 🎯 Key Insight',
  'End with concrete next steps the reader can take TODAY',
  'For system design: include scale numbers (requests/sec, data size)',
  'For algorithms: include Big O and when to actually use it',
  'Make the reader feel smarter after reading, not overwhelmed'
];

export function build(context) {
  const { question, answer, explanation, channel, difficulty, tags } = context;

  return `${buildSystemContext('blog')}

Transform this interview Q&A into a professional blog article.

ORIGINAL CONTENT:
Question: ${question}
Answer: ${answer || 'N/A'}
Explanation: ${explanation || 'N/A'}
Topic: ${channel}
Difficulty: ${difficulty}
Tags: ${(tags || []).join(', ')}

REQUIREMENTS:
${guidelines.map(g => `- ${g}`).join('\n')}

Output this exact JSON structure:
${JSON.stringify(schema, null, 2)}

${jsonOutputRule}`;
}

export default { schema, guidelines, build };
