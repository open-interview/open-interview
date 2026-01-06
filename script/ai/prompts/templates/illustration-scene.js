/**
 * Illustration Scene Generation Prompt Template
 * Uses AI to generate contextually relevant illustration scene specifications
 */

import { jsonOutputRule, buildSystemContext } from './base.js';

export const schema = {
  sceneType: "string - one of: debugging, deployment, scaling, database, security, performance, testing, success, error, mobile, frontend, api, monitoring, architecture",
  title: "string - short title for the scene (max 30 chars)",
  primaryColor: "string - main accent color: blue, purple, green, pink, cyan, orange",
  elements: {
    servers: [{ label: "string", status: "ok|warn|error", cpu: "number 0-100", position: "left|center|right" }],
    databases: [{ label: "string", position: "left|center|right" }],
    clouds: [{ label: "string", position: "left|center|right" }],
    codePanel: { show: "boolean", lines: [{ text: "string", highlight: "boolean" }] },
    terminal: { show: "boolean", lines: [{ text: "string", type: "command|success|error|info" }] },
    metrics: [{ label: "string", value: "string", unit: "string", trend: "up|down|stable" }],
    statusItems: [{ state: "ok|warn|error|info", text: "string" }],
    connections: [{ from: "string", to: "string", label: "string" }],
    icons: [{ type: "checkmark|xmark|lightning|shield|gear", position: "string" }]
  },
  bottomLabel: "string - descriptive label at bottom of scene"
};

export const guidelines = [
  'Analyze the blog content to determine the most relevant scene type',
  'Choose elements that directly relate to the technical concepts discussed',
  'Use realistic metrics and values that match the article context',
  'Code snippets should be relevant to the technology discussed',
  'Terminal output should show realistic commands and responses',
  'Status items should reflect the narrative (problem → solution → success)',
  'Keep text concise - labels max 20 chars, terminal lines max 35 chars',
  'For mobile/iOS topics: focus on performance metrics, frame rates, memory',
  'For frontend topics: show component trees, render cycles, bundle sizes',
  'For API topics: show request/response flows, latency metrics',
  'For database topics: show queries, replication, cache hit rates',
  'Match the scene mood to the placement (intro=problem, conclusion=success)'
];

export function build(context) {
  const { title, content, placement, channel, realWorldExample } = context;
  
  const placementHint = {
    'after-intro': 'This is the opening image - set up the problem or challenge',
    'after-section-1': 'Mid-article - show the technical details or solution approach',
    'after-section-2': 'Later in article - show implementation or progress',
    'before-conclusion': 'Final image - show success, results, or key takeaway'
  }[placement] || 'General illustration for the topic';

  const companyContext = realWorldExample 
    ? `Real-world case: ${realWorldExample.company} - ${realWorldExample.scenario}` 
    : '';

  return `${buildSystemContext('svg-scene')}

Generate an SVG scene specification for a tech blog illustration.

BLOG CONTEXT:
Title: ${title}
Channel: ${channel}
Placement: ${placement}
Hint: ${placementHint}
${companyContext}

CONTENT EXCERPT:
${(content || '').substring(0, 800)}

REQUIREMENTS:
${guidelines.map(g => `- ${g}`).join('\n')}

SCENE TYPES:
- debugging: Code errors, stack traces, bug fixing
- deployment: CI/CD, pipelines, production releases
- scaling: Load balancing, auto-scaling, distributed systems
- database: SQL queries, replication, caching
- security: Auth, encryption, firewalls, tokens
- performance: Optimization, latency, profiling, FPS
- testing: Unit tests, coverage, CI results
- success: Deployment complete, metrics green
- error: Outages, failures, incidents
- mobile: iOS/Android, frame rates, memory, UI
- frontend: React, components, rendering, bundle size
- api: REST/GraphQL, endpoints, request flows
- monitoring: Dashboards, alerts, observability
- architecture: System design, microservices, data flow

COLOR OPTIONS: blue, purple, green, pink, cyan, orange

Output this exact JSON structure:
${JSON.stringify(schema, null, 2)}

${jsonOutputRule}`;
}

export default { schema, guidelines, build };
