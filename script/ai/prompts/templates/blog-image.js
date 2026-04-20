/**
 * Blog Image Generation Prompt Template
 * Generates contextual comic-style images with text for blog posts
 */

import { jsonOutputRule, buildSystemContext } from './base.js';

export const schema = {
  images: [
    {
      placement: "after-intro|after-section-1|after-section-2|before-conclusion",
      description: "Detailed description of what the image should show",
      text: "Text to overlay on the image (speech bubble, caption, etc.)",
      style: "comic|diagram|infographic",
      alt: "Accessibility alt text",
      caption: "Caption to display below the image"
    }
  ]
};

export const guidelines = [
  // IMAGE STYLE
  'Generate 2-3 contextual images that enhance the blog content',
  'Each image should be comic/illustration style - NOT stock photos',
  'Images should match the dark theme (dark backgrounds with bright accents)',
  
  // PLACEMENT STRATEGY
  'after-intro: Hero image that captures the main theme, draws readers in',
  'after-section-1: Usually illustrates the problem or challenge',
  'after-section-2: Shows the solution or key concept',
  'before-conclusion: Celebrates success or shows the outcome',
  
  // TEXT ON IMAGES
  'Include relevant text overlays when it adds value:',
  '  - Speech bubbles for character dialogue',
  '  - Labels for diagram components',
  '  - Key statistics or facts',
  '  - Memorable quotes from the article',
  
  // COMIC STYLE SPECIFICS
  'For comic style images:',
  '  - Use cartoon developer/engineer characters',
  '  - Show relatable scenarios (debugging, deploying, celebrating)',
  '  - Include humor when appropriate',
  '  - Use expressive faces and body language',
  
  // DIAGRAM STYLE SPECIFICS
  'For diagram style images:',
  '  - Clean, simple shapes with clear connections',
  '  - Color-coded components',
  '  - Labeled parts',
  '  - Flow arrows where appropriate',
  
  // CONTEXT RELEVANCE
  'Images MUST be directly relevant to the blog content',
  'Reference specific concepts, companies, or scenarios from the article',
  'Make images memorable and shareable',
  
  // TECHNICAL REQUIREMENTS
  'Descriptions should be detailed enough for image generation',
  'Include color preferences (blues, purples, greens on dark background)',
  'Specify character poses and expressions',
  'Mention any specific tech icons or symbols to include'
];

export function build(context) {
  const { title, introduction, sections, channel, realWorldExample, difficulty } = context;
  
  // Extract key themes from sections
  const sectionSummaries = (sections || []).map((s, i) => 
    `Section ${i + 1}: "${s.heading}" - ${(s.content || '').substring(0, 150)}...`
  ).join('\n');
  
  const realWorldSection = realWorldExample ? `
Real-World Example:
- Company: ${realWorldExample.company}
- Scenario: ${realWorldExample.scenario}
- Lesson: ${realWorldExample.lesson}
` : '';

  return `${buildSystemContext('blog-image')}

Generate 2-3 contextual comic-style images for this blog post.

BLOG CONTENT:
Title: ${title}
Channel: ${channel}
Difficulty: ${difficulty}

Introduction:
${introduction || 'N/A'}

Sections:
${sectionSummaries}
${realWorldSection}

IMAGE REQUIREMENTS:
${guidelines.map(g => `- ${g}`).join('\n')}

STYLE GUIDE:
- Dark theme background (#0d1117 or similar dark navy)
- Accent colors: Blue (#58a6ff), Purple (#a371f7), Green (#3fb950), Pink (#f778ba)
- Comic/cartoon style characters - friendly, approachable
- Bold outlines, vibrant colors
- Professional but fun aesthetic

For each image, provide:
1. Placement (where in the article)
2. Detailed description (what to draw)
3. Text overlay (if any)
4. Style (comic, diagram, or infographic)
5. Alt text (for accessibility)
6. Caption (to display below)

Output this exact JSON structure:
${JSON.stringify(schema, null, 2)}

${jsonOutputRule}`;
}

export default { schema, guidelines, build };
