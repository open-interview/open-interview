/**
 * Art Studio — AI artwork & diagram generator
 * AI images via Pollinations.ai (FLUX, free, no API key)
 * Diagrams via Mermaid.js with GitHub-dark theme + syntax-highlighted editor
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'wouter';
import {
  Sparkles, GitBranch, Download, Copy, Check, RefreshCw,
  ChevronDown, ChevronRight, Palette, Wand2, Image as ImageIcon,
  ZoomIn, ZoomOut, RotateCcw, ExternalLink, Loader2, X,
  Play, Code2, Grid3X3, Layers, Layout, Share2, Home, Info,
  Maximize2, Database, Lock, Activity, GitMerge, Brain,
  Terminal, Zap, AlertCircle, Network, ToggleLeft, ToggleRight,
  Eye, EyeOff, Shuffle
} from 'lucide-react';
import { EnhancedMermaid } from '@/components/EnhancedMermaid';
import { AppLayout } from '@/components/layout/AppLayout';
import { SEOHead } from '@/components/SEOHead';
import { cn } from '@/lib/utils';

// ─── Pollinations.ai helpers ──────────────────────────────────────────────────

const POLLINATIONS_BASE = 'https://image.pollinations.ai/prompt';

function buildImageUrl(prompt: string, opts: ImageOptions): string {
  const encoded = encodeURIComponent(prompt);
  const params = new URLSearchParams({
    width: String(opts.width),
    height: String(opts.height),
    model: opts.model,
    seed: String(opts.seed),
    nologo: 'true',
    enhance: opts.enhance ? 'true' : 'false',
  });
  return `${POLLINATIONS_BASE}/${encoded}?${params}`;
}

interface ImageOptions {
  width: number;
  height: number;
  model: string;
  seed: number;
  enhance: boolean;
}

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  style: string;
  createdAt: number;
}

// ─── Debounce hook ─────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── Mermaid Syntax Highlighter ───────────────────────────────────────────────

const MERMAID_KW = new Set([
  'graph', 'flowchart', 'sequenceDiagram', 'erDiagram',
  'stateDiagram-v2', 'stateDiagram', 'gitGraph', 'mindmap',
  'timeline', 'journey', 'pie', 'gantt', 'quadrantChart',
]);
const MERMAID_CTRL = new Set([
  'subgraph', 'end', 'autonumber', 'loop', 'alt', 'else',
  'opt', 'par', 'break', 'rect', 'TB', 'BT', 'LR', 'RL', 'TD',
]);
const MERMAID_SPEC = new Set([
  'classDef', 'class', 'style', 'note', 'actor', 'participant',
  'activate', 'deactivate', 'commit', 'branch', 'merge', 'checkout',
  'click', 'link', 'direction', 'section',
]);

const COLORS = {
  keyword:  '#ff7b72', // red   — diagram type
  control:  '#ffa657', // orange — subgraph/end/directions
  special:  '#d2a8ff', // purple — classDef/actor/etc.
  arrow:    '#79c0ff', // blue   — arrows
  bracket:  '#3fb950', // green  — [node], (node)
  curly:    '#ffa657', // orange — {decision}
  string:   '#a5d6ff', // light blue — "labels"
  comment:  '#6e7681', // gray  — %% comments
  number:   '#f9a825', // amber — numbers
};

function highlightMermaid(code: string): string {
  return code.split('\n').map(line => highlightLine(line)).join('\n');
}

function highlightLine(line: string): string {
  // Full-line comment
  if (/^\s*%%/.test(line)) {
    return `<span style="color:${COLORS.comment};font-style:italic">${esc(line)}</span>`;
  }

  // Collect tokens with positions (non-overlapping, left-to-right priority)
  type Tok = { s: number; e: number; color: string; bold?: boolean };
  const toks: Tok[] = [];

  const tryAdd = (re: RegExp, color: string, bold?: boolean) => {
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(line)) !== null) {
      const s = m.index, e = s + m[0].length;
      if (!toks.some(t => s < t.e && e > t.s)) toks.push({ s, e, color, bold });
    }
  };

  // Inline comment tail
  const cmtI = line.indexOf('%%');
  if (cmtI >= 0) toks.push({ s: cmtI, e: line.length, color: COLORS.comment });

  // Strings (high priority)
  tryAdd(/"[^"]*"/g, COLORS.string);

  // Diagram type keyword at start of line
  const kwM = /^(\s*)(graph|flowchart|sequenceDiagram|erDiagram|stateDiagram(?:-v2)?|gitGraph|mindmap|timeline|journey|pie|gantt|quadrantChart)\b/.exec(line);
  if (kwM) {
    const s = kwM[1].length, e = kwM[0].length;
    if (!toks.some(t => s < t.e && e > t.s)) toks.push({ s, e, color: COLORS.keyword, bold: true });
  }

  // Control flow keywords
  tryAdd(/\b(subgraph|end|autonumber|loop|alt|else|opt|par|break|rect|TB|BT|LR|RL|TD)\b/g, COLORS.control, true);

  // Special declarations
  tryAdd(/\b(classDef|class|style|note|actor|participant|activate|deactivate|commit|branch|merge|checkout|direction|section|click|link)\b/g, COLORS.special);

  // Arrows (many variants)
  tryAdd(/(--?>?>?|==?>|\.->|-\.-|<-->|<->|~~~|o--|--o|x--|--x|\|>)/g, COLORS.arrow);

  // Square brackets [text] [[text]]
  tryAdd(/\[{1,2}[^\]]*?\]{1,2}/g, COLORS.bracket);

  // Round brackets (text) ((text))
  tryAdd(/\({1,2}[^)]*?\){1,2}/g, COLORS.bracket);

  // Curly {decision}
  tryAdd(/\{[^}]*?\}/g, COLORS.curly);

  // Numbers
  tryAdd(/\b\d+\b/g, COLORS.number);

  // Build output
  toks.sort((a, b) => a.s - b.s);
  let out = '', pos = 0;
  for (const t of toks) {
    if (t.s > pos) out += esc(line.slice(pos, t.s));
    if (t.s >= pos) {
      const text = esc(line.slice(t.s, t.e));
      out += `<span style="color:${t.color}${t.bold ? ';font-weight:600' : ''}">${text}</span>`;
      pos = t.e;
    }
  }
  if (pos < line.length) out += esc(line.slice(pos));
  return out;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ─── Syntax Editor (highlighted textarea) ─────────────────────────────────────

function SyntaxEditor({
  value, onChange, className, minHeight = 460
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  minHeight?: number;
}) {
  const preRef   = useRef<HTMLPreElement>(null);
  const taRef    = useRef<HTMLTextAreaElement>(null);

  const highlighted = useMemo(() => highlightMermaid(value) + '\n', [value]);

  const lines = value.split('\n');

  const syncScroll = () => {
    if (preRef.current && taRef.current) {
      preRef.current.scrollTop  = taRef.current.scrollTop;
      preRef.current.scrollLeft = taRef.current.scrollLeft;
    }
  };

  const sharedStyle: React.CSSProperties = {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize:   13,
    lineHeight: '1.65',
    padding:    '12px 16px',
    tabSize:    2,
    whiteSpace: 'pre',
    overflowWrap: 'normal',
  };

  return (
    <div className={cn('flex flex-1 overflow-hidden', className)}>
      {/* Line numbers */}
      <div
        style={{ ...sharedStyle, padding: '12px 8px' }}
        className="select-none text-right bg-[#0d1117] text-[#484f58] text-[12px] border-r border-[#21262d] min-w-[44px] overflow-hidden"
      >
        {lines.map((_, i) => (
          <div key={i} style={{ lineHeight: sharedStyle.lineHeight as string }}>{i + 1}</div>
        ))}
      </div>

      {/* Editor area */}
      <div className="relative flex-1 overflow-hidden" style={{ minHeight }}>
        {/* Highlighted backdrop */}
        <pre
          ref={preRef}
          aria-hidden="true"
          className="absolute inset-0 m-0 overflow-hidden pointer-events-none text-[#c9d1d9] bg-[#0d1117]"
          style={sharedStyle}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
        {/* Transparent textarea on top */}
        <textarea
          ref={taRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          onScroll={syncScroll}
          spellCheck={false}
          data-testid="input-diagram-code"
          className="absolute inset-0 w-full h-full m-0 bg-transparent resize-none focus:outline-none overflow-auto"
          style={{ ...sharedStyle, color: 'transparent', caretColor: '#c9d1d9' }}
        />
      </div>
    </div>
  );
}

// ─── Presets ──────────────────────────────────────────────────────────────────

const STYLE_PRESETS = [
  { id: 'flat-vector',    label: 'Flat Vector', dot: '#3b82f6', suffix: ', flat vector illustration, clean lines, bold colors, SVG style, modern design' },
  { id: 'isometric',      label: 'Isometric',   dot: '#22c55e', suffix: ', isometric 3D illustration, clean geometric, low-poly, flat shading, tech art' },
  { id: 'photorealistic', label: 'Photo-real',  dot: '#f59e0b', suffix: ', photorealistic, sharp detail, 8k uhd, studio lighting' },
  { id: 'cyberpunk',      label: 'Cyberpunk',   dot: '#a855f7', suffix: ', cyberpunk neon, dark background, glowing wireframes, sci-fi HUD, futuristic' },
  { id: 'pixel-art',      label: 'Pixel Art',   dot: '#ec4899', suffix: ', pixel art, 16-bit, retro game sprites, clean grid, bright palette' },
  { id: 'wireframe',      label: 'Wireframe',   dot: '#64748b', suffix: ', clean wireframe diagram, blueprint style, monochromatic, technical drawing, white lines on dark blue' },
  { id: 'watercolor',     label: 'Watercolor',  dot: '#06b6d4', suffix: ', watercolor illustration, soft washes, hand-painted, loose brushwork, artistic' },
  { id: 'minimal',        label: 'Minimal',     dot: '#e2e8f0', suffix: ', minimalist illustration, white background, simple shapes, two-color palette, clean modern' },
  { id: 'neon-glow',      label: 'Neon Glow',   dot: '#f43f5e', suffix: ', neon glow effect, dark background, bright luminescent colors, sci-fi aesthetic, electric' },
  { id: '3d-render',      label: '3D Render',   dot: '#f97316', suffix: ', 3D render, ambient occlusion, subsurface scattering, cinematic lighting, glossy materials' },
];

const TOPIC_PRESETS: { group: string; items: { label: string; prompt: string }[] }[] = [
  {
    group: 'Infrastructure',
    items: [
      { label: 'Cloud Architecture', prompt: 'cloud computing infrastructure, server nodes, network topology, AWS/Azure style architecture diagram' },
      { label: 'Kubernetes Cluster', prompt: 'kubernetes cluster with pods, services, ingress controller, namespaces, container orchestration' },
      { label: 'Microservices',      prompt: 'microservices architecture, API gateway, service mesh, distributed system components' },
      { label: 'Database Cluster',   prompt: 'distributed database cluster, primary replica nodes, sharding, partitioning, data flow' },
    ],
  },
  {
    group: 'DevOps / Security',
    items: [
      { label: 'CI/CD Pipeline',     prompt: 'CI/CD pipeline, build deploy stages, automated testing, GitOps workflow, DevOps process' },
      { label: 'Network Security',   prompt: 'network security diagram, firewall, VPN tunnels, DMZ, intrusion detection, secure zones' },
      { label: 'Monitoring Stack',   prompt: 'observability monitoring stack, metrics, logs, traces, dashboards, alerting system' },
      { label: 'Zero-Trust Network', prompt: 'zero trust network architecture, identity verification, encrypted tunnels, segmented access' },
    ],
  },
  {
    group: 'Software Design',
    items: [
      { label: 'API Design',         prompt: 'REST API design, endpoints, request-response flow, JSON payload, HTTP verbs, developer portal' },
      { label: 'Event Streaming',    prompt: 'event streaming architecture, Kafka topics, producers consumers, message queues, real-time data' },
      { label: 'Machine Learning',   prompt: 'machine learning pipeline, neural network layers, training data, model inference, gradient descent' },
      { label: 'Mobile App',         prompt: 'mobile app architecture, React Native, navigation stack, state management, API integration' },
    ],
  },
];

const SIZE_PRESETS = [
  { label: 'Widescreen 16:9', width: 1280, height: 720 },
  { label: 'Square 1:1',      width: 1024, height: 1024 },
  { label: 'Portrait 3:4',    width: 768,  height: 1024 },
  { label: 'Banner 3:1',      width: 1200, height: 400 },
  { label: 'Blog Cover',      width: 1600, height: 840 },
];

const MODEL_OPTIONS = [
  { id: 'flux',         label: 'FLUX (Best)' },
  { id: 'flux-realism', label: 'FLUX Realism' },
  { id: 'flux-anime',   label: 'FLUX Anime' },
  { id: 'flux-3d',      label: 'FLUX 3D' },
  { id: 'turbo',        label: 'Turbo (Fast)' },
];

// ─── Mermaid diagram templates ─────────────────────────────────────────────────

interface DiagramTemplate {
  id: string; label: string; description: string;
  icon: React.ElementType; color: string; code: string;
}

const DIAGRAM_TEMPLATES: DiagramTemplate[] = [
  {
    id: 'system-arch', label: 'System Arch', description: 'Distributed services overview',
    icon: Layers, color: '#388bfd',
    code: `graph TB
    Client([Browser / Mobile]) --> CDN[CloudFront CDN]
    CDN --> LB[Load Balancer]
    LB --> API1[API Server 1]
    LB --> API2[API Server 2]
    API1 & API2 --> Cache[(Redis Cache)]
    API1 & API2 --> DB[(PostgreSQL Primary)]
    DB --> DBR[(Read Replica)]
    API1 & API2 --> Queue[Message Queue]
    Queue --> Worker[Background Workers]
    Worker --> Storage[(Object Storage S3)]

    classDef client fill:#1e40af,stroke:#3b82f6,color:#fff
    classDef server fill:#166534,stroke:#22c55e,color:#fff
    classDef data   fill:#7c3aed,stroke:#a855f7,color:#fff
    classDef infra  fill:#92400e,stroke:#f59e0b,color:#fff
    class Client client
    class API1,API2,Worker server
    class DB,DBR,Cache,Storage data
    class CDN,LB,Queue infra`,
  },
  {
    id: 'sequence', label: 'Auth Flow', description: 'OAuth2 / JWT sequence',
    icon: Lock, color: '#3fb950',
    code: `sequenceDiagram
    autonumber
    actor User
    participant Client
    participant AuthServer as Auth Server
    participant API
    participant DB

    User->>Client: Enter credentials
    Client->>AuthServer: POST /oauth/token
    AuthServer->>DB: Validate user
    DB-->>AuthServer: User record
    AuthServer-->>Client: Access token + Refresh token
    Client->>API: GET /api/data (Bearer token)
    API->>AuthServer: Introspect token
    AuthServer-->>API: Token valid, user claims
    API->>DB: Query data
    DB-->>API: Result set
    API-->>Client: 200 OK (JSON)
    Client-->>User: Render UI`,
  },
  {
    id: 'er-diagram', label: 'ER Diagram', description: 'Database entity relations',
    icon: Database, color: '#d2a8ff',
    code: `erDiagram
    USER {
        uuid   id PK
        string email
        string username
        string password_hash
        timestamp created_at
    }
    POST {
        uuid   id PK
        uuid   author_id FK
        string title
        text   body
        string status
        timestamp published_at
    }
    TAG {
        uuid   id PK
        string name
        string slug
    }
    POST_TAG {
        uuid post_id FK
        uuid tag_id FK
    }
    COMMENT {
        uuid   id PK
        uuid   post_id FK
        uuid   user_id FK
        text   body
        timestamp created_at
    }

    USER ||--o{ POST : "writes"
    USER ||--o{ COMMENT : "makes"
    POST ||--o{ POST_TAG : "has"
    TAG  ||--o{ POST_TAG : "labels"
    POST ||--o{ COMMENT : "receives"`,
  },
  {
    id: 'cicd', label: 'CI/CD', description: 'Build, test, deploy flow',
    icon: Zap, color: '#ffa657',
    code: `flowchart LR
    Push([Git Push]) --> Trigger[Trigger Pipeline]
    Trigger --> Lint[Lint & Format]
    Lint --> Build[Build & Compile]
    Build --> Test[Unit Tests]
    Test --> IntTest[Integration Tests]
    IntTest --> Security[Security Scan]
    Security --> DockerBuild[Docker Build]
    DockerBuild --> Registry[(Container Registry)]
    Registry --> DeployStg[Deploy → Staging]
    DeployStg --> SmokeTest{Smoke Tests}
    SmokeTest -->|Pass| DeployProd[Deploy → Production]
    SmokeTest -->|Fail| Rollback[Auto Rollback]
    DeployProd --> Monitor[Monitor & Alert]

    style Push fill:#1e40af,color:#fff,stroke:#3b82f6
    style DeployProd fill:#166534,color:#fff,stroke:#22c55e
    style Rollback fill:#7f1d1d,color:#fff,stroke:#ef4444
    style Monitor fill:#7c3aed,color:#fff,stroke:#a855f7`,
  },
  {
    id: 'microservices', label: 'Microservices', description: 'Service mesh topology',
    icon: Network, color: '#56d364',
    code: `graph LR
    GW[API Gateway] --> US[User Service]
    GW --> PS[Product Service]
    GW --> OS[Order Service]
    GW --> NS[Notification Service]

    US --> UserDB[(User DB)]
    PS --> ProductDB[(Product DB)]
    OS --> OrderDB[(Order DB)]

    OS --> PS
    OS --> US
    OS --> NS

    US & PS & OS --> Kafka[[Event Bus Kafka]]
    Kafka --> Analytics[Analytics Service]
    Kafka --> NS

    subgraph Observability
        Jaeger[Tracing - Jaeger]
        Prometheus[Metrics - Prometheus]
        Loki[Logs - Loki]
    end

    classDef service fill:#1e3a5f,stroke:#3b82f6,color:#fff
    classDef db fill:#3b1d5f,stroke:#a855f7,color:#fff
    classDef infra fill:#1a3a2a,stroke:#22c55e,color:#fff
    class US,PS,OS,NS,Analytics service
    class UserDB,ProductDB,OrderDB db
    class Kafka,Jaeger,Prometheus,Loki infra`,
  },
  {
    id: 'state-machine', label: 'State Machine', description: 'Order lifecycle states',
    icon: Activity, color: '#f78166',
    code: `stateDiagram-v2
    [*] --> Draft

    Draft --> Pending : Submit Order
    Pending --> Processing : Payment Confirmed
    Pending --> Cancelled : Cancel / Timeout
    Processing --> Shipped : Fulfillment
    Processing --> Failed : Stock Error
    Shipped --> Delivered : Courier Scan
    Shipped --> Returned : Return Request
    Failed --> Pending : Retry
    Delivered --> [*]
    Cancelled --> [*]
    Returned --> Refunded : Refund Issued
    Refunded --> [*]

    note right of Processing : Inventory reserved\\nFulfillment queued
    note right of Shipped : Tracking number\\nassigned`,
  },
  {
    id: 'mindmap', label: 'Mind Map', description: 'System design mindmap',
    icon: Brain, color: '#79c0ff',
    code: `mindmap
  root((System Design))
    Scalability
      Horizontal Scaling
      Vertical Scaling
      Load Balancing
        Round Robin
        Least Connections
      Auto Scaling Groups
    Data Storage
      SQL Databases
        PostgreSQL
        MySQL
      NoSQL
        MongoDB
        DynamoDB
        Cassandra
      Caching
        Redis
        Memcached
    Networking
      CDN
      DNS
      API Gateway
      Service Mesh
    Reliability
      Replication
      Failover
      Circuit Breaker
      Retry Strategies
    Observability
      Metrics
      Logging
      Tracing
      Alerting`,
  },
  {
    id: 'git-flow', label: 'Git Flow', description: 'Branching strategy',
    icon: GitMerge, color: '#e3b341',
    code: `gitGraph
   commit id: "Initial commit"
   branch develop
   checkout develop
   commit id: "Setup project"
   branch feature/auth
   checkout feature/auth
   commit id: "Add JWT auth"
   commit id: "Add refresh tokens"
   checkout develop
   merge feature/auth id: "Merge auth"
   branch feature/api
   checkout feature/api
   commit id: "REST endpoints"
   commit id: "Add pagination"
   checkout develop
   merge feature/api id: "Merge API"
   branch release/1.0
   checkout release/1.0
   commit id: "Bump version"
   commit id: "Fix bugs"
   checkout main
   merge release/1.0 id: "Release v1.0" tag: "v1.0.0"
   checkout develop
   merge release/1.0`,
  },
];

// ─── AI Artwork Tab ───────────────────────────────────────────────────────────

function ArtworkTab() {
  const [prompt, setPrompt] = useState('');
  const [activeStyle, setActiveStyle] = useState(STYLE_PRESETS[0]);
  const [sizePreset, setSizePreset] = useState(SIZE_PRESETS[4]);
  const [model, setModel] = useState('flux');
  const [enhance, setEnhance] = useState(true);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 999999));
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [current, setCurrent] = useState<GeneratedImage | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>('Infrastructure');
  const imgRef = useRef<HTMLImageElement>(null);

  const generate = useCallback((randomSeed = true) => {
    if (!prompt.trim()) return;
    const finalPrompt = prompt.trim() + activeStyle.suffix;
    const newSeed = randomSeed ? Math.floor(Math.random() * 999999) : seed;
    if (randomSeed) setSeed(newSeed);
    setLoading(true);
    const url = buildImageUrl(finalPrompt, {
      width: sizePreset.width,
      height: sizePreset.height,
      model,
      seed: newSeed,
      enhance,
    });
    const entry: GeneratedImage = {
      id: crypto.randomUUID(),
      url,
      prompt: finalPrompt,
      style: activeStyle.label,
      createdAt: Date.now(),
    };
    setCurrent(entry);
    setHistory(h => [entry, ...h].slice(0, 12));
  }, [prompt, activeStyle, sizePreset, model, seed, enhance]);

  const handleImgLoad  = () => setLoading(false);
  const handleImgError = () => setLoading(false);

  const downloadImage = async (url: string, label: string) => {
    const filename = `artwork-${label.toLowerCase().replace(/\s+/g, '-')}.png`;
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl; a.download = filename;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 min-h-0">
      {/* ── Left panel: controls ── */}
      <div className="lg:w-[340px] flex-shrink-0 space-y-3">

        {/* Prompt */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-[#8b949e] uppercase tracking-wider">Prompt</label>
            <span className="text-[10px] text-[#484f58]">{prompt.length} chars</span>
          </div>
          <textarea
            data-testid="input-prompt"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) generate(); }}
            placeholder="Describe the artwork you want to create…"
            rows={4}
            className="w-full bg-[#0d1117] text-[#c9d1d9] placeholder-[#484f58] text-sm border border-[#30363d] rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:border-[#58a6ff] transition-colors"
          />
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-[#484f58]">⌘+Enter to generate</p>
            <div className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: activeStyle.dot }}
              />
              <span className="text-[10px] text-[#8b949e]">{activeStyle.label}</span>
            </div>
          </div>
        </div>

        {/* Style presets */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-3">
          <label className="text-[11px] font-semibold text-[#8b949e] uppercase tracking-wider">Art Style</label>
          <div className="flex flex-wrap gap-1.5">
            {STYLE_PRESETS.map(s => (
              <button
                key={s.id}
                data-testid={`style-${s.id}`}
                onClick={() => setActiveStyle(s)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium border transition-all duration-150',
                  activeStyle.id === s.id
                    ? 'bg-[#1f2a1f] text-white border-transparent shadow-sm'
                    : 'bg-[#0d1117] text-[#8b949e] border-[#21262d] hover:text-[#c9d1d9] hover:border-[#484f58]'
                )}
                style={activeStyle.id === s.id ? { borderColor: s.dot, backgroundColor: `${s.dot}18` } : {}}
              >
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.dot }} />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Topic presets */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-1.5">
          <label className="text-[11px] font-semibold text-[#8b949e] uppercase tracking-wider block mb-2">Topic Presets</label>
          {TOPIC_PRESETS.map(group => (
            <div key={group.group}>
              <button
                onClick={() => setExpandedGroup(expandedGroup === group.group ? null : group.group)}
                className="w-full flex items-center justify-between py-1 text-xs font-semibold text-[#c9d1d9] hover:text-white transition-colors"
              >
                {group.group}
                {expandedGroup === group.group
                  ? <ChevronDown className="w-3 h-3 text-[#58a6ff]" />
                  : <ChevronRight className="w-3 h-3 text-[#484f58]" />
                }
              </button>
              {expandedGroup === group.group && (
                <div className="grid grid-cols-2 gap-1 pb-1">
                  {group.items.map(item => (
                    <button
                      key={item.label}
                      data-testid={`topic-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={() => setPrompt(item.prompt)}
                      className="text-left px-2.5 py-1.5 rounded-md text-[11px] text-[#8b949e] hover:text-[#c9d1d9] bg-[#0d1117] hover:bg-[#21262d] border border-[#21262d] hover:border-[#388bfd] transition-all duration-150"
                    >{item.label}</button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Advanced */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-3">
          <button
            onClick={() => setShowAdvanced(v => !v)}
            className="flex items-center gap-2 text-[11px] font-semibold text-[#8b949e] hover:text-[#c9d1d9] transition-colors w-full"
          >
            <ChevronDown className={cn('w-3 h-3 transition-transform', showAdvanced && 'rotate-180')} />
            Advanced Options
          </button>
          {showAdvanced && (
            <div className="space-y-4 pt-1">
              <div>
                <label className="text-[11px] text-[#8b949e] mb-2 block">Canvas Size</label>
                <div className="space-y-1">
                  {SIZE_PRESETS.map(p => (
                    <button
                      key={p.label}
                      onClick={() => setSizePreset(p)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-1.5 rounded-md text-[11px] border transition-all',
                        sizePreset.label === p.label
                          ? 'bg-[#1f3d5c] text-[#58a6ff] border-[#388bfd]'
                          : 'bg-[#0d1117] text-[#8b949e] border-[#21262d] hover:text-[#c9d1d9] hover:border-[#484f58]'
                      )}
                    >
                      <span>{p.label}</span>
                      <span className="text-[#484f58] font-mono text-[10px]">{p.width}×{p.height}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[11px] text-[#8b949e] mb-2 block">AI Model</label>
                <div className="space-y-1">
                  {MODEL_OPTIONS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setModel(m.id)}
                      className={cn(
                        'w-full text-left px-3 py-1.5 rounded-md text-[11px] border transition-all',
                        model === m.id
                          ? 'bg-[#1f3d5c] text-[#58a6ff] border-[#388bfd]'
                          : 'bg-[#0d1117] text-[#8b949e] border-[#21262d] hover:text-[#c9d1d9] hover:border-[#484f58]'
                      )}
                    >{m.label}</button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <button
                  type="button"
                  onClick={() => setEnhance(v => !v)}
                  className={cn(
                    'relative w-8 h-4 rounded-full transition-colors flex-shrink-0',
                    enhance ? 'bg-[#238636]' : 'bg-[#30363d]'
                  )}
                >
                  <div className={cn(
                    'absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow-sm',
                    enhance ? 'translate-x-4' : 'translate-x-0.5'
                  )} />
                </button>
                <span className="text-[11px] text-[#8b949e]">AI prompt enhancement</span>
              </label>
            </div>
          )}
        </div>

        {/* Generate + Variation */}
        <div className="flex gap-2">
          <button
            data-testid="btn-generate-image"
            onClick={() => generate(true)}
            disabled={!prompt.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#238636] to-[#2ea043] hover:from-[#2ea043] hover:to-[#3fb950] text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-lg shadow-[#238636]/20"
          >
            <Wand2 className={cn('w-4 h-4', loading && 'animate-spin')} />
            {loading ? 'Generating…' : 'Generate'}
          </button>
          {current && (
            <button
              title="Generate a variation with different seed"
              onClick={() => generate(true)}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#21262d] text-[#8b949e] border border-[#30363d] hover:text-[#c9d1d9] hover:border-[#484f58] transition-all text-xs disabled:opacity-40"
            >
              <Shuffle className="w-3.5 h-3.5" /> Vary
            </button>
          )}
        </div>
      </div>

      {/* ── Right panel: preview ── */}
      <div className="flex-1 min-w-0 space-y-3">
        {/* Main preview */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#21262d]">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-3.5 h-3.5 text-[#58a6ff]" />
              <span className="text-[11px] font-semibold text-[#8b949e] uppercase tracking-wider">Preview</span>
              {current && (
                <span className="text-[10px] px-1.5 py-0.5 bg-[#1f3d5c] text-[#58a6ff] rounded font-medium border border-[#388bfd]/30">
                  {current.style}
                </span>
              )}
            </div>
            {current && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => { navigator.clipboard.writeText(current.url); }}
                  title="Copy image URL"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#21262d] text-[#8b949e] border border-[#30363d] hover:text-[#c9d1d9] hover:border-[#484f58] transition-all"
                >
                  <Copy className="w-3 h-3" /> Copy URL
                </button>
                <button
                  data-testid="btn-download-image"
                  onClick={() => downloadImage(current.url, current.style)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#21262d] text-[#8b949e] border border-[#30363d] hover:text-[#c9d1d9] hover:border-[#484f58] transition-all"
                >
                  <Download className="w-3 h-3" /> Download
                </button>
                <a
                  href={current.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#21262d] text-[#8b949e] border border-[#30363d] hover:text-[#c9d1d9] hover:border-[#484f58] transition-all"
                >
                  <ExternalLink className="w-3 h-3" /> Open
                </a>
              </div>
            )}
          </div>
          <div className="relative bg-[#0d1117] min-h-[320px] flex items-center justify-center">
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0d1117]/90 z-10">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-2 border-[#388bfd]/20" />
                  <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-t-[#388bfd] animate-spin" />
                </div>
                <p className="text-sm text-[#8b949e]">Generating with FLUX AI…</p>
                <p className="text-[10px] text-[#484f58]">Usually 5–15 seconds</p>
              </div>
            )}
            {current ? (
              <img
                ref={imgRef}
                src={current.url}
                alt={current.prompt}
                onLoad={handleImgLoad}
                onError={handleImgError}
                loading="lazy"
                className="w-full object-contain max-h-[520px]"
              />
            ) : (
              <div className="text-center py-16 px-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#58a6ff]/10 to-[#a371f7]/10 border border-[#30363d] flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-7 h-7 text-[#58a6ff]" />
                </div>
                <p className="text-[#8b949e] text-sm mb-1">
                  Enter a prompt and click <strong className="text-[#c9d1d9]">Generate</strong>
                </p>
                <p className="text-[#484f58] text-xs">Powered by Pollinations.ai (FLUX) — free, no API key</p>
              </div>
            )}
          </div>
          {current && (
            <div className="px-4 py-2 border-t border-[#21262d] bg-[#0d1117]">
              <p className="text-[10px] text-[#484f58] truncate">{current.prompt}</p>
            </div>
          )}
        </div>

        {/* History */}
        {history.length > 1 && (
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
            <p className="text-[11px] font-semibold text-[#8b949e] uppercase tracking-wider mb-3">History</p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {history.slice(1).map(img => (
                <div
                  key={img.id}
                  onClick={() => { setCurrent(img); setLoading(false); }}
                  className={cn(
                    'relative aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all hover:scale-105',
                    current?.id === img.id ? 'border-[#388bfd] shadow-md shadow-[#388bfd]/20' : 'border-transparent hover:border-[#30363d]'
                  )}
                >
                  <img src={img.url} alt={img.prompt} loading="lazy" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 py-1">
                    <p className="text-[8px] text-white/80 truncate leading-tight">{img.style}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Diagram Tab ──────────────────────────────────────────────────────────────

function DiagramTab() {
  const [activeTemplate, setActiveTemplate] = useState(DIAGRAM_TEMPLATES[0]);
  const [code, setCode]               = useState(DIAGRAM_TEMPLATES[0].code);
  const [committedCode, setCommittedCode] = useState(DIAGRAM_TEMPLATES[0].code);
  const [autoRender, setAutoRender]   = useState(true);
  const [diagramError, setDiagramError] = useState<string | null>(null);
  const [copied, setCopied]           = useState(false);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  const debouncedCode = useDebounce(code, 900);

  // Auto-render: commit debounced code when autoRender is on
  useEffect(() => {
    if (autoRender) setCommittedCode(debouncedCode);
  }, [debouncedCode, autoRender]);

  const handleTemplateSelect = (t: DiagramTemplate) => {
    setActiveTemplate(t);
    setCode(t.code);
    setCommittedCode(t.code);
    setDiagramError(null);
  };

  const handleRun = () => {
    setCommittedCode(code);
    setDiagramError(null);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadSvg = () => {
    const svgEl = svgContainerRef.current?.querySelector('svg');
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${activeTemplate.id}-diagram.svg`;
    a.click();
  };

  const isDirty = code !== committedCode;

  return (
    <div className="flex flex-col gap-5">
      {/* Template selector */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-semibold text-[#8b949e] uppercase tracking-wider">Templates</p>
          <span className="text-[10px] text-[#484f58]">{DIAGRAM_TEMPLATES.length} diagrams</span>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {DIAGRAM_TEMPLATES.map(t => {
            const Icon = t.icon;
            const isActive = activeTemplate.id === t.id;
            return (
              <button
                key={t.id}
                data-testid={`diagram-template-${t.id}`}
                onClick={() => handleTemplateSelect(t)}
                title={t.description}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-2.5 rounded-lg border text-center transition-all duration-150',
                  isActive
                    ? 'bg-[#0d1117] border-transparent'
                    : 'bg-[#0d1117] border-[#21262d] text-[#8b949e] hover:text-[#c9d1d9] hover:border-[#30363d]'
                )}
                style={isActive ? { borderColor: t.color, boxShadow: `0 0 0 1px ${t.color}30` } : {}}
              >
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: isActive ? `${t.color}20` : 'transparent' }}
                >
                  <Icon
                    className="w-3.5 h-3.5"
                    style={{ color: isActive ? t.color : undefined }}
                  />
                </div>
                <span
                  className="text-[9px] font-medium leading-tight"
                  style={{ color: isActive ? t.color : undefined }}
                >{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Editor + Preview */}
      <div className="grid lg:grid-cols-2 gap-4" style={{ minHeight: 520 }}>

        {/* ── Code editor ── */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#21262d] flex-shrink-0">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-[#58a6ff]" />
              <span className="text-[11px] font-semibold text-[#8b949e]">Mermaid Source</span>
              {isDirty && !autoRender && (
                <span className="text-[9px] px-1.5 py-0.5 bg-[#3a2000] text-[#ffa657] rounded border border-[#ffa657]/30">
                  unsaved
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {/* Auto-render toggle */}
              <button
                onClick={() => setAutoRender(v => !v)}
                title={autoRender ? 'Auto-render ON — click to disable' : 'Auto-render OFF — click to enable'}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded text-[10px] border transition-all',
                  autoRender
                    ? 'bg-[#1a3a2a] text-[#3fb950] border-[#238636]'
                    : 'bg-[#21262d] text-[#8b949e] border-[#30363d] hover:text-[#c9d1d9]'
                )}
              >
                {autoRender ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                Auto
              </button>
              <button
                onClick={handleCopy}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded text-[10px] border transition-all',
                  copied
                    ? 'bg-[#1a3a2a] text-[#3fb950] border-[#238636]'
                    : 'bg-[#21262d] text-[#8b949e] border-[#30363d] hover:text-[#c9d1d9]'
                )}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                data-testid="btn-run-diagram"
                onClick={handleRun}
                className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] bg-[#238636] text-white border border-[#2ea043] hover:bg-[#2ea043] transition-all font-medium"
              >
                <Play className="w-3 h-3" /> Run
              </button>
            </div>
          </div>

          {/* Syntax editor */}
          <div className="flex flex-1 overflow-hidden bg-[#0d1117]" style={{ minHeight: 460 }}>
            <SyntaxEditor
              value={code}
              onChange={setCode}
              className="flex-1"
              minHeight={460}
            />
          </div>
        </div>

        {/* ── Preview ── */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#21262d] flex-shrink-0">
            <div className="flex items-center gap-2">
              <Layout className="w-3.5 h-3.5 text-[#a371f7]" />
              <span className="text-[11px] font-semibold text-[#8b949e]">Live Preview</span>
              {diagramError ? (
                <span className="text-[9px] px-1.5 py-0.5 bg-[#3d1c1c] text-[#ff7b72] rounded border border-[#ff7b72]/30 flex items-center gap-1">
                  <AlertCircle className="w-2.5 h-2.5" /> Error
                </span>
              ) : (
                <span className="text-[9px] px-1.5 py-0.5 bg-[#1a3a2a] text-[#3fb950] rounded border border-[#238636]/30">
                  github-dark
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                data-testid="btn-download-svg"
                onClick={handleDownloadSvg}
                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-[#21262d] text-[#8b949e] border border-[#30363d] hover:text-[#c9d1d9] hover:border-[#484f58] transition-all"
              >
                <Download className="w-3 h-3" /> SVG
              </button>
            </div>
          </div>

          {/* Diagram area */}
          <div
            ref={svgContainerRef}
            className="flex-1 bg-[#0d1117] overflow-auto p-3 flex flex-col"
            style={{ minHeight: 460 }}
          >
            {diagramError ? (
              /* Error state */
              <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
                <div className="w-12 h-12 rounded-xl bg-[#3d1c1c] border border-[#ff7b72]/30 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-[#ff7b72]" />
                </div>
                <div className="text-center max-w-sm">
                  <p className="text-sm font-semibold text-[#ff7b72] mb-2">Diagram syntax error</p>
                  <p className="text-[11px] text-[#8b949e] leading-relaxed font-mono bg-[#161b22] rounded-lg px-3 py-2 border border-[#30363d] text-left break-all">
                    {diagramError}
                  </p>
                  <p className="text-[10px] text-[#484f58] mt-2">
                    Check your Mermaid syntax — or pick a template to start fresh.
                  </p>
                </div>
              </div>
            ) : (
              <EnhancedMermaid
                key={committedCode}
                chart={committedCode}
                themeOverride="github-dark"
                className="w-full flex-1"
                onRenderResult={(ok, msg) => setDiagramError(ok ? null : (msg ?? 'Render failed'))}
              />
            )}
          </div>
        </div>
      </div>

      {/* Info footer */}
      <div className="flex items-start gap-3 px-4 py-3 bg-[#161b22] border border-[#30363d] rounded-xl">
        <Info className="w-4 h-4 text-[#58a6ff] flex-shrink-0 mt-0.5" />
        <div className="text-[11px] text-[#8b949e] leading-relaxed">
          <strong className="text-[#c9d1d9]">Mermaid.js</strong> — open source, runs in your browser, no API key.{' '}
          Supports: flowchart, sequence, ER, state, gitGraph, mindmap, pie, gantt.
          {' '}<span className="text-[#484f58]">Scroll/pinch to zoom · drag to pan · hover diagram to expand.</span>
          {' '}<strong className="text-[#3fb950]">Auto-render</strong> re-renders after 0.9 s of no typing.
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Tab = 'artwork' | 'diagrams';

export default function ArtStudio() {
  const [tab, setTab] = useState<Tab>('artwork');

  return (
    <AppLayout fullWidth>
      <SEOHead
        title="Art Studio | Open Interview"
        description="Generate AI artwork with FLUX, create technical diagrams with Mermaid. Free, no API key required."
      />

      <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] pt-14 lg:pt-0">
        {/* Page header */}
        <div className="border-b border-[#21262d] bg-[#0d1117]/98 backdrop-blur-sm sticky top-0 lg:top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#a371f7] via-[#79c0ff] to-[#58a6ff] flex items-center justify-center flex-shrink-0 shadow-md shadow-[#a371f7]/20">
                  <Palette className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-white leading-tight tracking-tight">Art Studio</h1>
                  <p className="text-[10px] text-[#484f58] leading-tight hidden sm:block">AI images · Mermaid diagrams · Free</p>
                </div>
              </div>

              {/* Right side badges */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-1.5">
                  <span className="text-[9px] text-[#484f58] uppercase tracking-wider">powered by</span>
                  <span className="text-[10px] font-medium text-[#8b949e]">FLUX · Mermaid.js</span>
                </div>
                <Link href="/" className="flex items-center gap-1.5 text-[11px] text-[#8b949e] hover:text-[#c9d1d9] transition-colors">
                  <Home className="w-3.5 h-3.5" /> Home
                </Link>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-0 -mb-px">
              {[
                { id: 'artwork'  as Tab, icon: Sparkles,   label: 'AI Artwork',  desc: 'FLUX model' },
                { id: 'diagrams' as Tab, icon: GitBranch,  label: 'Diagrams',    desc: 'Mermaid.js' },
              ].map(t => (
                <button
                  key={t.id}
                  data-testid={`tab-${t.id}`}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all duration-150',
                    tab === t.id
                      ? 'border-[#388bfd] text-white'
                      : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9] hover:border-[#30363d]'
                  )}
                >
                  <t.icon className={cn('w-4 h-4', tab === t.id ? 'text-[#388bfd]' : '')} />
                  {t.label}
                  <span className={cn(
                    'hidden sm:inline text-[9px] px-1.5 py-0.5 rounded font-normal transition-colors',
                    tab === t.id ? 'bg-[#1f3d5c] text-[#58a6ff]' : 'bg-[#161b22] text-[#484f58]'
                  )}>{t.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          {/* Banner */}
          <div className="flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-[#161b22] to-[#0d1117] border border-[#30363d] rounded-xl mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#3fb950] flex-shrink-0 animate-pulse" />
            <p className="text-[11px] text-[#8b949e] leading-relaxed">
              <strong className="text-[#c9d1d9]">100% free, zero API keys.</strong>
              {' '}AI images via{' '}
              <a href="https://pollinations.ai" target="_blank" rel="noopener noreferrer" className="text-[#58a6ff] hover:underline">Pollinations.ai</a>
              {' '}(FLUX) · Technical diagrams via{' '}
              <a href="https://mermaid.js.org" target="_blank" rel="noopener noreferrer" className="text-[#58a6ff] hover:underline">Mermaid.js</a>
              {' '}· Everything runs in your browser.
            </p>
          </div>

          {tab === 'artwork'  && <ArtworkTab />}
          {tab === 'diagrams' && <DiagramTab />}
        </div>
      </div>
    </AppLayout>
  );
}
