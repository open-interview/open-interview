/**
 * Mermaid Diagram Prompt Template
 * Optimized for ~450px wide panel display
 */

import { jsonOutputRule, qualityRules, buildSystemContext } from './base.js';
import config from '../../config.js';

export const schema = {
  diagram: "flowchart TD\\n  A[Step 1] --> B[Step 2]",
  diagramType: "flowchart|sequence|class|state",
  confidence: "high|medium|low"
};

export const examples = [
  {
    input: { question: "How does DNS resolution work?", tags: ["networking", "dns"] },
    output: {
      diagram: `flowchart TD
  A["🌐 Browser"] -->|query| B["💾 Local Cache"]
  B -->|miss| C["🔄 Resolver"]
  C -->|ask| D["🌍 Root DNS"]
  D -->|refer| E["📍 TLD Server"]
  E -->|refer| F["✅ Auth Server"]
  F -->|IP address| C
  C -->|response| A
  
  style A fill:#e3f2fd,stroke:#1565c0
  style F fill:#e8f5e9,stroke:#2e7d32`,
      diagramType: "flowchart",
      confidence: "high"
    }
  },
  {
    input: { question: "Explain OAuth 2.0 flow", tags: ["security", "authentication"] },
    output: {
      diagram: `sequenceDiagram
  participant U as 👤 User
  participant C as 📱 App
  participant A as 🔐 Auth
  participant R as 🗄️ API
  
  U->>C: Login click
  C->>A: Auth request
  A->>U: Login form
  U->>A: Credentials
  A->>C: Auth code
  C->>A: Exchange code
  A->>C: Access token
  C->>R: API + token
  R->>C: Data`,
      diagramType: "sequence",
      confidence: "high"
    }
  },
  {
    input: { question: "Explain microservices architecture", tags: ["architecture", "distributed-systems"] },
    output: {
      diagram: `flowchart TD
  GW["🚪 API Gateway"]
  
  GW --> US["👤 Users"]
  GW --> OS["📦 Orders"]
  GW --> PS["💳 Payments"]
  
  US --> DB1[("🗄️ DB")]
  OS --> DB2[("🗄️ DB")]
  OS --> MQ["📨 Queue"]
  PS --> MQ
  
  style GW fill:#e3f2fd,stroke:#1565c0
  style MQ fill:#fff3e0,stroke:#ef6c00
  style DB1 fill:#e8f5e9,stroke:#2e7d32
  style DB2 fill:#e8f5e9,stroke:#2e7d32`,
      diagramType: "flowchart",
      confidence: "high"
    }
  }
];

export const badExamples = [
  'A[Start] --> B[End]',
  'A[Input] --> B[Process] --> C[Output]',
  'Diagrams with very long node labels',
  'LR (left-right) layouts - too wide for panel',
  'More than 12 nodes - too complex',
  'Deeply nested subgraphs',
  'YAML code examples (name:, hosts:, tasks:)',
  'Code snippets in any language',
  'JSON or configuration examples',
  'Markdown with code blocks'
];

// Use centralized guidelines from config
export const guidelines = [
  `Create a diagram with ${config.qualityThresholds.diagram.minNodes}-10 nodes (sweet spot: 6-8)`,
  ...config.guidelines.diagram,
  'DO NOT create trivial diagrams like "Start -> End"',
  'DO NOT use generic labels like "Step 1", "Concept", "Implementation"',
  'ALWAYS add visual styling with colors'
];

export function build(context) {
  const { question, answer, tags } = context;
  
  return `${buildSystemContext('diagram')}

Create a COMPACT, visually appealing Mermaid diagram optimized for a ~450px wide panel.

Question: "${question}"
Answer: "${(answer || '').substring(0, 300)}"
Tags: ${(tags || []).slice(0, 4).join(', ') || 'technical'}

CRITICAL: OUTPUT MUST BE VALID MERMAID SYNTAX ONLY
- Start with: flowchart TD, sequenceDiagram, classDiagram, stateDiagram, etc.
- Use Mermaid node/edge syntax: A[Label] --> B[Label]
- DO NOT output code examples (YAML, JSON, Python, JavaScript, etc.)
- DO NOT output configuration files or playbooks
- DO NOT include markdown code blocks (\`\`\`)
- The diagram field must contain ONLY valid Mermaid diagram syntax

DISPLAY CONSTRAINTS (CRITICAL):
- Panel width: ~450px - diagram must fit without horizontal scroll
- ALWAYS use TD (top-down) layout - NEVER use LR (left-right)
- Keep node labels SHORT: max 15-20 characters
- Use abbreviations: "Auth" not "Authentication", "DB" not "Database"
- 6-10 nodes maximum - focus on KEY components only
- Avoid subgraphs unless essential (they add width)
- Single emoji per label is fine, but keep text short

STYLING REQUIREMENTS:
- Add emojis to make nodes visually distinct (🔒 🌐 💾 📦 ⚙️ 🔄 ✅ 📨)
- Use cylinder [()] for databases only
- Add 2-4 style lines for key nodes with colors
- Keep edge labels to 1-2 words max

COLOR PALETTE:
- Blue (#e3f2fd, #1565c0) - entry points, APIs
- Green (#e8f5e9, #2e7d32) - databases, success
- Orange (#fff3e0, #ef6c00) - queues, async
- Purple (#f3e5f5, #7b1fa2) - services

COMPACT LABEL EXAMPLES:
✅ Good: "🔐 Auth", "📦 Orders", "💾 Cache", "🌐 Gateway"
❌ Bad: "Authentication Service", "Order Management System"

${guidelines.map(g => `- ${g}`).join('\n')}

EXAMPLES OF BAD OUTPUT (DO NOT CREATE):
${badExamples.map(e => `- ${e}`).join('\n')}

${qualityRules.technical}

Output this exact JSON structure:
${JSON.stringify(schema, null, 2)}

${jsonOutputRule}`;
}

export default { schema, examples, badExamples, guidelines, build };
