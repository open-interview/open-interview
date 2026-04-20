/**
 * Citation Search Template
 * Finds URLs for a given topic
 */

import { jsonOutputRule, buildSystemContext } from './base.js';

export const schema = {
  urls: [
    {
      url: "https://example.com/article",
      title: "Article title",
      source: "Source name (e.g., Netflix Engineering, AWS Docs)"
    }
  ]
};

export const guidelines = [
  'Find URLs from reputable engineering blogs and documentation',
  'Prioritize official documentation and well-known engineering blogs',
  'Include a mix of tutorials, deep-dives, and reference material',
  'Ensure URLs are from real, existing websites',
  'Include sources from major tech companies when relevant'
];

export function build(context) {
  const { topic } = context;
  
  return `${buildSystemContext('citationSearch')}

Find high-quality technical articles, documentation, and engineering blog posts about: "${topic}"

REQUIREMENTS:
- Find 15-20 URLs to ensure we get 10+ valid ones after validation
- Prioritize these source types:
  * Engineering blogs (Netflix, Uber, Airbnb, Stripe, Cloudflare, etc.)
  * Official documentation (AWS, Google Cloud, Kubernetes, etc.)
  * Technical publications (Martin Fowler, InfoQ, DZone, etc.)
  * GitHub repositories with good documentation
  * Conference talks and papers

GUIDELINES:
${guidelines.map(g => `- ${g}`).join('\n')}

Output this exact JSON structure:
${JSON.stringify(schema, null, 2)}

${jsonOutputRule}`;
}

export default { schema, guidelines, build };
