/**
 * Mermaid Diagram Prompt Template
 * Optimised for ~450px wide panel display
 *
 * Learning science principles applied:
 * - Dual coding: diagram + text explanation together are retained ~65% better than text alone
 * - Failure path learning: showing what breaks is as important as showing what works —
 *   error paths anchor the concept by revealing the REASON the design exists
 * - Story structure: effective diagrams have a narrative arc (entry → process → outcome/error)
 *   not just a list of components
 * - Edge labels as WHY: "validates", "caches miss", "rejects" teach the mechanism;
 *   unlabelled arrows teach nothing
 */

import { jsonOutputRule, qualityRules, buildSystemContext } from './base.js';
import config from '../../config.js';
import { buildStandardSection } from './content-standards.js';

export const schema = {
  diagram:     "flowchart TD\\n  A[Step 1] --> B[Step 2]",
  diagramType: "flowchart|sequence|class|state",
  confidence:  "high|medium|low"
};

export const examples = [
  {
    input: { question: "How does DNS resolution work?", tags: ["networking", "dns"] },
    output: {
      diagram: `flowchart TD
  A["🌐 Browser"] -->|"check"| B["💾 Local Cache"]
  B -->|"hit → IP"| A
  B -->|"miss"| C["🔄 Resolver"]
  C -->|"ask"| D["🌍 Root DNS"]
  D -->|"refer to TLD"| E["📍 .com Server"]
  E -->|"refer to auth"| F["✅ Auth Server"]
  F -->|"IP address"| C
  C -->|"cache + return"| A
  B -->|"expired"| C

  style A fill:#e3f2fd,stroke:#1565c0
  style F fill:#e8f5e9,stroke:#2e7d32
  style B fill:#fff3e0,stroke:#ef6c00`,
      diagramType: "flowchart",
      confidence:  "high"
    }
  },
  {
    input: { question: "Explain OAuth 2.0 authorization code flow", tags: ["security", "authentication"] },
    output: {
      diagram: `sequenceDiagram
  participant U as 👤 User
  participant C as 📱 App
  participant A as 🔐 Auth Server
  participant R as 🗄️ Resource API

  U->>C: Login click
  C->>A: Auth request + scope
  A->>U: Login form
  U->>A: Credentials
  A-->>U: ❌ Wrong password → retry
  A->>C: Auth code (short-lived)
  C->>A: Exchange code + secret
  A->>C: Access token + refresh
  C->>R: Request + token
  R-->>C: ❌ 401 if expired
  C->>A: Refresh token
  A->>C: New access token
  C->>R: Retry request`,
      diagramType: "sequence",
      confidence:  "high"
    }
  },
  {
    input: { question: "Explain microservices architecture", tags: ["architecture", "distributed-systems"] },
    output: {
      diagram: `flowchart TD
  GW["🚪 API Gateway"]

  GW -->|"route"| US["👤 User Svc"]
  GW -->|"route"| OS["📦 Order Svc"]
  GW -->|"route"| PS["💳 Payment Svc"]

  OS -->|"write"| DB2[("🗄️ Orders DB")]
  OS -->|"publish event"| MQ["📨 Message Bus"]
  PS -->|"subscribe"| MQ
  PS -->|"write"| DB3[("🗄️ Payments DB")]

  GW -->|"❌ svc down"| CB["🚧 Circuit Breaker"]
  CB -->|"fallback"| GW

  style GW fill:#e3f2fd,stroke:#1565c0
  style MQ fill:#fff3e0,stroke:#ef6c00
  style CB fill:#fce4ec,stroke:#c62828`,
      diagramType: "flowchart",
      confidence:  "high"
    }
  }
];

export const badExamples = [
  'A[Start] --> B[End]  (trivial — no real content)',
  'A[Input] --> B[Process] --> C[Output]  (generic labels)',
  'Diagrams with very long node labels (> 20 chars)',
  'LR (left-right) layout — too wide for the panel',
  'More than 12 nodes — too complex to scan',
  'No failure/error path — shows only the happy path',
  'No edge labels — arrows with no explanation of WHY data flows',
  'YAML, JSON, or code snippets in any form',
  'Markdown code blocks (```)',
  'Diagrams where every node is a vague step ("Process", "Validate", "Handle")',
];

export const guidelines = [
  `Create a diagram with ${config.qualityThresholds.diagram.minNodes}-10 nodes (sweet spot: 6-8)`,
  ...config.guidelines.diagram,
  'ALWAYS show at least one failure or error path (❌, -->> dashed, or explicit error node)',
  'Edge labels MUST explain WHY data moves: "validates", "caches", "rejects", "retries"',
  'DO NOT create trivial diagrams like "Start → End"',
  'DO NOT use generic labels like "Step 1", "Process", "Handle"',
  'ALWAYS add visual styling with colors and emojis',
];

export function build(context) {
  const { question, answer, tags } = context;

  return `${buildSystemContext('diagram')}

Create a COMPACT, insight-driven Mermaid diagram optimised for a ~450px wide panel.
The diagram must tell a story: show the NORMAL FLOW and at least one FAILURE or ERROR PATH.
A learner should understand both HOW it works and WHAT BREAKS from your diagram alone.

Question: "${question}"
Answer: "${(answer || '').substring(0, 300)}"
Tags: ${(tags || []).slice(0, 4).join(', ') || 'technical'}

CRITICAL: OUTPUT MUST BE VALID MERMAID SYNTAX ONLY
- Start with: flowchart TD, sequenceDiagram, classDiagram, stateDiagram, etc.
- Use Mermaid node/edge syntax: A[Label] --> B[Label]
- DO NOT output code, YAML, JSON, or configuration examples
- DO NOT include markdown code blocks (\`\`\`)

DISPLAY CONSTRAINTS (CRITICAL):
- Panel width: ~450px — ALWAYS use TD (top-down), NEVER LR (left-right)
- Node labels: max 15-20 characters — use abbreviations ("Auth", "DB", "Cache")
- 6-10 nodes maximum — focus on KEY components only
- Single emoji per label is fine, but keep text short
- Avoid subgraphs unless essential (they add width)

NARRATIVE REQUIREMENTS (for retention):
- Show the HAPPY PATH as the main flow (2/3 of nodes)
- Show at least ONE FAILURE PATH — use ❌ emoji, dashed arrows (-->>, -->>), or an error node
- Edge labels must be ACTION VERBS that explain WHY: "validates", "caches", "rejects", "retries"
- Error paths should be styled red/pink: style E fill:#fce4ec,stroke:#c62828

STYLING REQUIREMENTS:
- Add emojis: 🔒 🌐 💾 📦 ⚙️ 🔄 ✅ 📨 ❌ 🚧
- Use cylinder [()] for databases only
- Add 3-5 style lines for key nodes

COLOR PALETTE:
- Blue  (#e3f2fd, #1565c0) — entry points, APIs, gateways
- Green (#e8f5e9, #2e7d32) — databases, success states
- Orange (#fff3e0, #ef6c00) — queues, async, caches
- Purple (#f3e5f5, #7b1fa2) — services, processors
- Red   (#fce4ec, #c62828) — errors, circuit breakers, failures

LABEL EXAMPLES:
✅ "🔐 Auth", "💾 Cache", "🌐 Gateway", "❌ 401 Error"
❌ "Authentication Service", "Data Store", "Step 3", "Process"

${buildStandardSection('diagram')}

EXAMPLES OF BAD OUTPUT (DO NOT CREATE):
${badExamples.map(e => `- ${e}`).join('\n')}

${qualityRules.technical}

Output this exact JSON structure:
${JSON.stringify(schema, null, 2)}

${jsonOutputRule}`;
}

export default { schema, examples, badExamples, guidelines, build };
