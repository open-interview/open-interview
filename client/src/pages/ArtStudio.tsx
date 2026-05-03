/**
 * Art Studio — Sophisticated AI artwork & diagram generator
 * Uses Pollinations.ai (free, zero API key) for AI images
 * Uses Mermaid.js for technical diagrams
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'wouter';
import {
  Sparkles, GitBranch, Download, Copy, Check, RefreshCw,
  ChevronDown, ChevronRight, Palette, Wand2, Image as ImageIcon,
  ZoomIn, ZoomOut, RotateCcw, ExternalLink, Loader2, X,
  Play, Code2, Grid3X3, Layers, Layout, Share2, Home, Info
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

// ─── Presets ──────────────────────────────────────────────────────────────────

const STYLE_PRESETS = [
  { id: 'photorealistic', label: 'Photo-real',  suffix: ', photorealistic, sharp detail, 8k uhd, studio lighting' },
  { id: 'flat-vector',    label: 'Flat Vector', suffix: ', flat vector illustration, clean lines, bold colors, SVG style, modern design' },
  { id: 'isometric',      label: 'Isometric',   suffix: ', isometric 3D illustration, clean geometric, low-poly, flat shading, tech art' },
  { id: 'cyberpunk',      label: 'Cyberpunk',   suffix: ', cyberpunk neon, dark background, glowing wireframes, sci-fi HUD, futuristic' },
  { id: 'pixel-art',      label: 'Pixel Art',   suffix: ', pixel art, 16-bit, retro game sprites, clean grid, bright palette' },
  { id: 'wireframe',      label: 'Wireframe',   suffix: ', clean wireframe diagram, blueprint style, monochromatic, technical drawing, white lines on dark blue' },
  { id: 'watercolor',     label: 'Watercolor',  suffix: ', watercolor illustration, soft washes, hand-painted, loose brushwork, artistic' },
  { id: 'minimal',        label: 'Minimal',     suffix: ', minimalist illustration, white background, simple shapes, two-color palette, clean modern' },
  { id: 'neon-glow',      label: 'Neon Glow',   suffix: ', neon glow effect, dark background, bright luminescent colors, sci-fi aesthetic, electric' },
  { id: '3d-render',      label: '3D Render',   suffix: ', 3D render, ambient occlusion, subsurface scattering, cinematic lighting, glossy materials' },
];

const TOPIC_PRESETS: { group: string; items: { label: string; prompt: string }[] }[] = [
  {
    group: 'Infrastructure',
    items: [
      { label: 'Cloud Architecture', prompt: 'cloud computing infrastructure, server nodes, network topology, AWS/Azure style architecture diagram' },
      { label: 'Kubernetes Cluster', prompt: 'kubernetes cluster with pods, services, ingress controller, namespaces, container orchestration' },
      { label: 'Microservices', prompt: 'microservices architecture, API gateway, service mesh, distributed system components' },
      { label: 'Database Cluster', prompt: 'distributed database cluster, primary replica nodes, sharding, partitioning, data flow' },
    ],
  },
  {
    group: 'DevOps / Security',
    items: [
      { label: 'CI/CD Pipeline', prompt: 'CI/CD pipeline, build deploy stages, automated testing, GitOps workflow, DevOps process' },
      { label: 'Network Security', prompt: 'network security diagram, firewall, VPN tunnels, DMZ, intrusion detection, secure zones' },
      { label: 'Monitoring Stack', prompt: 'observability monitoring stack, metrics, logs, traces, dashboards, alerting system' },
      { label: 'Zero-Trust Network', prompt: 'zero trust network architecture, identity verification, encrypted tunnels, segmented access' },
    ],
  },
  {
    group: 'Software Design',
    items: [
      { label: 'API Design', prompt: 'REST API design, endpoints, request-response flow, JSON payload, HTTP verbs, developer portal' },
      { label: 'Event Streaming', prompt: 'event streaming architecture, Kafka topics, producers consumers, message queues, real-time data' },
      { label: 'Machine Learning', prompt: 'machine learning pipeline, neural network layers, training data, model inference, gradient descent' },
      { label: 'Mobile App', prompt: 'mobile app architecture, React Native, navigation stack, state management, API integration' },
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
  { id: 'flux',           label: 'FLUX (Best)' },
  { id: 'flux-realism',   label: 'FLUX Realism' },
  { id: 'flux-anime',     label: 'FLUX Anime' },
  { id: 'flux-3d',        label: 'FLUX 3D' },
  { id: 'turbo',          label: 'Turbo (Fast)' },
];

// ─── Mermaid diagram templates ────────────────────────────────────────────────

const DIAGRAM_TEMPLATES: { id: string; label: string; description: string; code: string }[] = [
  {
    id: 'system-arch',
    label: 'System Architecture',
    description: 'Distributed services overview',
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
    id: 'sequence',
    label: 'Auth Sequence',
    description: 'OAuth2 / JWT auth flow',
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
    id: 'er-diagram',
    label: 'ER Diagram',
    description: 'Database entity relations',
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
    id: 'cicd',
    label: 'CI/CD Pipeline',
    description: 'Build, test, deploy flow',
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
    id: 'microservices',
    label: 'Microservices',
    description: 'Service mesh topology',
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
    id: 'state-machine',
    label: 'State Machine',
    description: 'Order lifecycle states',
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

    note right of Processing : Inventory reserved\nFulfillment queued
    note right of Shipped : Tracking number\nassigned`,
  },
  {
    id: 'mindmap',
    label: 'System Design',
    description: 'System design mindmap',
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
    id: 'git-flow',
    label: 'Git Flow',
    description: 'Branching strategy',
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function TabButton({ active, onClick, icon: Icon, label }: {
  active: boolean; onClick: () => void; icon: React.ElementType; label: string;
}) {
  return (
    <button
      onClick={onClick}
      data-testid={`tab-${label.toLowerCase().replace(/\s+/g, '-')}`}
      className={cn(
        'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
        active
          ? 'bg-[#21262d] text-white border border-[#30363d] shadow-sm'
          : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#161b22]'
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      data-testid="btn-copy-url"
      title="Copy URL"
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all duration-150',
        copied
          ? 'bg-[#1a3a2a] text-[#3fb950] border-[#238636]'
          : 'bg-[#21262d] text-[#8b949e] border-[#30363d] hover:text-[#c9d1d9] hover:border-[#484f58]',
        className
      )}
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied!' : 'Copy URL'}
    </button>
  );
}

// ─── AI Artwork Tab ───────────────────────────────────────────────────────────

function ArtworkTab() {
  const [prompt, setPrompt] = useState('');
  const [activeStyle, setActiveStyle] = useState(STYLE_PRESETS[1]); // flat vector default
  const [sizePreset, setSizePreset] = useState(SIZE_PRESETS[4]);    // blog cover default
  const [model, setModel] = useState('flux');
  const [enhance, setEnhance] = useState(true);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 999999));
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [current, setCurrent] = useState<GeneratedImage | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>('Infrastructure');
  const imgRef = useRef<HTMLImageElement>(null);

  const generate = useCallback(() => {
    if (!prompt.trim()) return;
    const finalPrompt = prompt.trim() + activeStyle.suffix;
    const newSeed = Math.floor(Math.random() * 999999);
    setSeed(newSeed);
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
    setHistory(h => [entry, ...h].slice(0, 9));
  }, [prompt, activeStyle, sizePreset, model, enhance]);

  const handleImgLoad  = () => setLoading(false);
  const handleImgError = () => setLoading(false);

  const downloadImage = async (url: string, label: string) => {
    const filename = `artwork-${label.toLowerCase().replace(/\s+/g, '-')}.png`;
    try {
      // Direct CORS fetch — Pollinations serves images with Access-Control-Allow-Origin: *
      // so this works as a pure static/GitHub-Pages deployment with no backend needed.
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
    } catch {
      // Fallback: open in new tab so user can right-click → Save As
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-0">
      {/* Left panel — controls */}
      <div className="lg:w-[360px] flex-shrink-0 space-y-4">

        {/* Prompt */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-3">
          <label className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">Prompt</label>
          <textarea
            data-testid="input-prompt"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) generate(); }}
            placeholder="Describe the artwork you want to create…"
            rows={4}
            className="w-full bg-[#0d1117] text-[#c9d1d9] placeholder-[#484f58] text-sm border border-[#30363d] rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:border-[#58a6ff] transition-colors"
          />
          <p className="text-[10px] text-[#484f58]">⌘+Enter to generate</p>
        </div>

        {/* Style presets */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-3">
          <label className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">Art Style</label>
          <div className="flex flex-wrap gap-2">
            {STYLE_PRESETS.map(s => (
              <button
                key={s.id}
                data-testid={`style-${s.id}`}
                onClick={() => setActiveStyle(s)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150',
                  activeStyle.id === s.id
                    ? 'bg-[#1f3d5c] text-[#58a6ff] border-[#388bfd]'
                    : 'bg-[#0d1117] text-[#8b949e] border-[#21262d] hover:text-[#c9d1d9] hover:border-[#484f58]'
                )}
              >{s.label}</button>
            ))}
          </div>
        </div>

        {/* Topic presets */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-2">
          <label className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">Topic Presets</label>
          {TOPIC_PRESETS.map(group => (
            <div key={group.group}>
              <button
                onClick={() => setExpandedGroup(expandedGroup === group.group ? null : group.group)}
                className="w-full flex items-center justify-between py-1.5 text-xs font-semibold text-[#c9d1d9] hover:text-white transition-colors"
              >
                {group.group}
                {expandedGroup === group.group ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>
              {expandedGroup === group.group && (
                <div className="grid grid-cols-2 gap-1.5 pb-1">
                  {group.items.map(item => (
                    <button
                      key={item.label}
                      data-testid={`topic-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={() => setPrompt(item.prompt)}
                      className="text-left px-2.5 py-1.5 rounded-md text-xs text-[#8b949e] hover:text-[#c9d1d9] bg-[#0d1117] hover:bg-[#21262d] border border-[#21262d] hover:border-[#30363d] transition-all duration-150"
                    >{item.label}</button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Size + model */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-3">
          <button
            onClick={() => setShowAdvanced(v => !v)}
            className="flex items-center gap-2 text-xs font-semibold text-[#8b949e] hover:text-[#c9d1d9] transition-colors"
          >
            <ChevronDown className={cn('w-3 h-3 transition-transform', showAdvanced && 'rotate-180')} />
            Advanced Options
          </button>
          {showAdvanced && (
            <div className="space-y-3 pt-1">
              <div>
                <label className="text-xs text-[#8b949e] mb-1.5 block">Canvas Size</label>
                <div className="grid grid-cols-1 gap-1">
                  {SIZE_PRESETS.map(p => (
                    <button
                      key={p.label}
                      onClick={() => setSizePreset(p)}
                      className={cn(
                        'flex items-center justify-between px-3 py-1.5 rounded-md text-xs border transition-all',
                        sizePreset.label === p.label
                          ? 'bg-[#1f3d5c] text-[#58a6ff] border-[#388bfd]'
                          : 'bg-[#0d1117] text-[#8b949e] border-[#21262d] hover:text-[#c9d1d9] hover:border-[#484f58]'
                      )}
                    >
                      <span>{p.label}</span>
                      <span className="text-[#484f58]">{p.width}×{p.height}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#8b949e] mb-1.5 block">AI Model</label>
                <div className="grid grid-cols-1 gap-1">
                  {MODEL_OPTIONS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setModel(m.id)}
                      className={cn(
                        'text-left px-3 py-1.5 rounded-md text-xs border transition-all',
                        model === m.id
                          ? 'bg-[#1f3d5c] text-[#58a6ff] border-[#388bfd]'
                          : 'bg-[#0d1117] text-[#8b949e] border-[#21262d] hover:text-[#c9d1d9] hover:border-[#484f58]'
                      )}
                    >{m.label}</button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setEnhance(v => !v)}
                  className={cn(
                    'w-8 h-4 rounded-full transition-colors relative',
                    enhance ? 'bg-[#238636]' : 'bg-[#30363d]'
                  )}
                >
                  <div className={cn('absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform', enhance ? 'translate-x-4' : 'translate-x-0.5')} />
                </div>
                <span className="text-xs text-[#8b949e]">AI prompt enhancement</span>
              </label>
            </div>
          )}
        </div>

        {/* Generate */}
        <button
          data-testid="btn-generate-image"
          onClick={generate}
          disabled={!prompt.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#238636] to-[#2ea043] hover:from-[#2ea043] hover:to-[#3fb950] text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-lg shadow-[#238636]/20"
        >
          <Wand2 className="w-4 h-4" />
          Generate Artwork
        </button>
      </div>

      {/* Right panel — preview */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Main preview */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#21262d]">
            <span className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">Preview</span>
            {current && (
              <div className="flex items-center gap-2">
                <CopyButton text={current.url} />
                <button
                  data-testid="btn-download-image"
                  onClick={() => downloadImage(current.url, current.style)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#21262d] text-[#8b949e] border border-[#30363d] hover:text-[#c9d1d9] hover:border-[#484f58] transition-all"
                >
                  <Download className="w-3 h-3" /> Download
                </button>
                <a href={current.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#21262d] text-[#8b949e] border border-[#30363d] hover:text-[#c9d1d9] hover:border-[#484f58] transition-all">
                  <ExternalLink className="w-3 h-3" /> Open
                </a>
              </div>
            )}
          </div>
          <div className="relative bg-[#0d1117] min-h-[300px] flex items-center justify-center">
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0d1117]/90 z-10">
                <Loader2 className="w-8 h-8 text-[#58a6ff] animate-spin" />
                <p className="text-sm text-[#8b949e]">Generating with FLUX AI…</p>
              </div>
            )}
            {current ? (
              <img
                ref={imgRef}
                src={current.url}
                alt={current.prompt}
                onLoad={handleImgLoad}
                onError={handleImgError}
                className="w-full object-contain max-h-[520px]"
              />
            ) : (
              <div className="text-center py-16 px-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#58a6ff]/20 to-[#a371f7]/20 border border-[#30363d] flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-7 h-7 text-[#58a6ff]" />
                </div>
                <p className="text-[#8b949e] text-sm">Enter a prompt and click <strong className="text-[#c9d1d9]">Generate Artwork</strong></p>
                <p className="text-[#484f58] text-xs mt-1">Powered by Pollinations.ai (FLUX model) — free, no API key</p>
              </div>
            )}
          </div>
          {current && (
            <div className="px-4 py-2.5 border-t border-[#21262d] bg-[#0d1117]">
              <p className="text-xs text-[#484f58] truncate">{current.prompt}</p>
            </div>
          )}
        </div>

        {/* History grid */}
        {history.length > 1 && (
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
            <p className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-3">History</p>
            <div className="grid grid-cols-3 gap-2">
              {history.slice(1).map(img => (
                <div
                  key={img.id}
                  onClick={() => { setCurrent(img); setLoading(false); }}
                  className={cn(
                    'relative aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all',
                    current?.id === img.id ? 'border-[#388bfd]' : 'border-transparent hover:border-[#30363d]'
                  )}
                >
                  <img src={img.url} alt={img.prompt} className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1">
                    <p className="text-[9px] text-white/80 truncate">{img.style}</p>
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
  const [code, setCode] = useState(DIAGRAM_TEMPLATES[0].code);
  const [renderKey, setRenderKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  const handleTemplateSelect = (t: typeof DIAGRAM_TEMPLATES[0]) => {
    setActiveTemplate(t);
    setCode(t.code);
    setRenderKey(k => k + 1);
  };

  const handleRun = () => setRenderKey(k => k + 1);

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

  return (
    <div className="flex flex-col gap-6">
      {/* Template selector */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
        <p className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-3">Templates</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {DIAGRAM_TEMPLATES.map(t => (
            <button
              key={t.id}
              data-testid={`diagram-template-${t.id}`}
              onClick={() => handleTemplateSelect(t)}
              title={t.description}
              className={cn(
                'flex flex-col items-center gap-1.5 p-2.5 rounded-lg border text-center transition-all duration-150',
                activeTemplate.id === t.id
                  ? 'bg-[#1f3d5c] border-[#388bfd] text-[#58a6ff]'
                  : 'bg-[#0d1117] border-[#21262d] text-[#8b949e] hover:text-[#c9d1d9] hover:border-[#30363d]'
              )}
            >
              <GitBranch className="w-4 h-4 flex-shrink-0" />
              <span className="text-[10px] font-medium leading-tight">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Editor + Preview */}
      <div className="grid lg:grid-cols-2 gap-4 min-h-[500px]">
        {/* Code editor */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#21262d]">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-[#58a6ff]" />
              <span className="text-xs font-semibold text-[#8b949e]">Mermaid Source</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border transition-all',
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
                className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-[#238636] text-white border border-[#2ea043] hover:bg-[#2ea043] transition-all"
              >
                <Play className="w-3 h-3" /> Run
              </button>
            </div>
          </div>
          <textarea
            data-testid="input-diagram-code"
            value={code}
            onChange={e => setCode(e.target.value)}
            spellCheck={false}
            className="flex-1 bg-[#0d1117] text-[#c9d1d9] text-sm font-mono px-4 py-3 resize-none focus:outline-none min-h-[460px]"
          />
        </div>

        {/* Preview */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#21262d]">
            <div className="flex items-center gap-2">
              <Layout className="w-4 h-4 text-[#a371f7]" />
              <span className="text-xs font-semibold text-[#8b949e]">Live Preview</span>
            </div>
            <button
              data-testid="btn-download-svg"
              onClick={handleDownloadSvg}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-[#21262d] text-[#8b949e] border border-[#30363d] hover:text-[#c9d1d9] transition-all"
            >
              <Download className="w-3 h-3" /> Export SVG
            </button>
          </div>
          <div ref={svgContainerRef} className="flex-1 bg-[#0d1117] overflow-auto p-2 min-h-[460px]">
            <EnhancedMermaid
              key={renderKey}
              chart={code}
              className="w-full h-full"
            />
          </div>
        </div>
      </div>

      {/* Info footer */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[#161b22] border border-[#30363d] rounded-xl">
        <Info className="w-4 h-4 text-[#58a6ff] flex-shrink-0" />
        <p className="text-xs text-[#8b949e]">
          Diagrams use <strong className="text-[#c9d1d9]">Mermaid.js</strong> — fully open-source, no API key.
          Supports flowchart, sequence, ER, state, gitGraph, mindmap, and more.
          The preview is interactive: pinch/scroll to zoom, drag to pan.
        </p>
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
        <div className="border-b border-[#21262d] bg-[#0d1117]/95 backdrop-blur-sm sticky top-0 lg:top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#a371f7] to-[#58a6ff] flex items-center justify-center flex-shrink-0">
                  <Palette className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-white leading-tight">Art Studio</h1>
                  <p className="text-[10px] text-[#484f58] leading-tight hidden sm:block">AI artwork & diagram generator</p>
                </div>
              </div>
              <Link href="/" className="flex items-center gap-1.5 text-xs text-[#8b949e] hover:text-[#c9d1d9] transition-colors">
                <Home className="w-3.5 h-3.5" /> Home
              </Link>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 pb-0 -mb-px">
              {[
                { id: 'artwork'  as Tab, icon: Sparkles,  label: 'AI Artwork'  },
                { id: 'diagrams' as Tab, icon: GitBranch, label: 'Diagrams'    },
              ].map(t => (
                <button
                  key={t.id}
                  data-testid={`tab-${t.id}`}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-150',
                    tab === t.id
                      ? 'border-[#f78166] text-white'
                      : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9] hover:border-[#30363d]'
                  )}
                >
                  <t.icon className="w-4 h-4" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {/* Banner */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[#1f2d3e] to-[#1a1f2e] border border-[#30363d] rounded-xl mb-6">
            <Sparkles className="w-4 h-4 text-[#58a6ff] flex-shrink-0" />
            <p className="text-xs text-[#8b949e]">
              <strong className="text-[#c9d1d9]">100% Free, zero API keys.</strong>
              {' '}AI images via{' '}
              <a href="https://pollinations.ai" target="_blank" rel="noopener noreferrer" className="text-[#58a6ff] hover:underline">Pollinations.ai</a>
              {' '}(FLUX model) · Diagrams via{' '}
              <a href="https://mermaid.js.org" target="_blank" rel="noopener noreferrer" className="text-[#58a6ff] hover:underline">Mermaid.js</a>
              {' '}· Open source, runs entirely in your browser.
            </p>
          </div>

          {tab === 'artwork'  && <ArtworkTab />}
          {tab === 'diagrams' && <DiagramTab />}
        </div>
      </div>
    </AppLayout>
  );
}
