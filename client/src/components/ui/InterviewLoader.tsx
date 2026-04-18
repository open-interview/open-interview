/**
 * InterviewLoader — ambient knowledge orb + channel-aware learning facts
 * Matches app: dark OLED, violet/cyan, glassmorphism, smooth bezier
 */

import { useState, useEffect, useRef } from 'react';
import { useUserPreferences } from '../../context/UserPreferencesContext';

// ── Facts per channel ────────────────────────────────────────────────────────
const CHANNEL_FACTS: Record<string, string[]> = {
  'data-structures':      ['A hash table lookup is O(1) on average — but worst case is O(n) due to collisions.', 'Red-Black trees guarantee O(log n) insert/delete by maintaining balance through color rules.', 'A deque (double-ended queue) supports O(1) push/pop from both ends.'],
  'complexity-analysis':  ['P vs NP is one of the Millennium Prize Problems — worth $1M unsolved since 1971.', 'Amortized O(1) means the average cost per operation over a sequence is constant, even if some are expensive.', 'Space complexity counts auxiliary space — not the input itself.'],
  'dynamic-programming':  ['Memoization turns exponential recursion into polynomial time by caching subproblems.', 'The Fibonacci sequence computed naively is O(2ⁿ) — DP makes it O(n).', 'Optimal substructure + overlapping subproblems = DP candidate.'],
  'system-design':        ['Netflix uses consistent hashing to distribute load across cache nodes.', 'A single Redis instance can handle ~100k ops/sec — but it\'s single-threaded.', 'CAP theorem: you can only guarantee 2 of Consistency, Availability, Partition tolerance.'],
  'aws':                  ['S3 has 99.999999999% (11 nines) durability — achieved by storing data across 3+ AZs.', 'Lambda cold starts are typically 100ms–1s depending on runtime and package size.', 'DynamoDB can handle 10 trillion requests per day at peak.'],
  'kubernetes':           ['A Pod is the smallest deployable unit in Kubernetes — not a container.', 'etcd stores the entire cluster state — losing it without backup means losing the cluster.', 'Kubernetes scheduler considers resource requests, not limits, when placing pods.'],
  'machine-learning':     ['Gradient descent finds local minima — not guaranteed global. Adam optimizer adapts learning rates per parameter.', 'Overfitting means your model memorized training data. Dropout randomly zeros neurons to prevent it.', 'A confusion matrix diagonal = correct predictions. Off-diagonal = errors.'],
  'python':               ['Python\'s GIL prevents true multi-threading for CPU-bound tasks — use multiprocessing instead.', 'List comprehensions are ~35% faster than equivalent for-loops in CPython.', 'Generators are lazy — they yield one item at a time, saving memory for large datasets.'],
  'frontend':             ['CSS `contain: layout` tells the browser a subtree won\'t affect outside layout — huge perf win.', 'React\'s reconciler uses a fiber architecture to split rendering into interruptible chunks.', 'Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1 for a "Good" score.'],
  'backend':              ['Connection pooling reuses DB connections — creating a new TCP connection costs ~50ms.', 'Idempotency means calling an API multiple times has the same effect as calling it once.', 'N+1 query problem: fetching 100 users then 100 separate queries for their posts = 101 queries.'],
  'database':             ['B-tree indexes are balanced — every leaf is at the same depth, guaranteeing O(log n) lookup.', 'MVCC (Multi-Version Concurrency Control) lets readers never block writers in PostgreSQL.', 'A covering index includes all columns a query needs — zero table lookups required.'],
  'devops':               ['Blue-green deployment keeps two identical environments — switch traffic instantly, rollback in seconds.', 'A Dockerfile COPY layer is cached until the source files change — order matters for build speed.', 'Prometheus scrapes metrics every 15s by default — alerting rules evaluate on the same interval.'],
  'security':             ['SQL injection is still the #1 web vulnerability — parameterized queries prevent it entirely.', 'JWT tokens are signed, not encrypted — anyone can decode the payload. Never store secrets in them.', 'HTTPS prevents MITM attacks but not XSS — those are separate threat models.'],
  'networking':           ['TCP\'s 3-way handshake (SYN→SYN-ACK→ACK) adds ~1 RTT before any data flows.', 'DNS TTL controls how long resolvers cache a record — lowering it before a migration is best practice.', 'HTTP/2 multiplexes multiple requests over one TCP connection — eliminating head-of-line blocking.'],
  'behavioral':           ['STAR method: Situation, Task, Action, Result — keep each section concise and specific.', 'Interviewers weight "Action" most heavily — what YOU did, not the team.', 'Quantify results: "reduced latency by 40%" beats "made it faster".'],
  'terraform':            ['`terraform plan` is idempotent — running it multiple times shows the same diff until you apply.', 'Remote state in S3 + DynamoDB locking prevents two engineers from applying simultaneously.', 'Modules are reusable Terraform configurations — treat them like functions.'],
  'linux':                ['`strace` traces system calls — invaluable for debugging mysterious process failures.', 'The Linux OOM killer scores processes by memory usage × oom_score_adj and kills the highest scorer.', 'inode exhaustion can fill a disk even when `df` shows space — check with `df -i`.'],
  'generative-ai':        ['Transformer attention is O(n²) in sequence length — the main bottleneck for long contexts.', 'Temperature 0 = deterministic (greedy). Temperature 1 = full distribution sampling.', 'RAG (Retrieval-Augmented Generation) grounds LLM responses in real documents, reducing hallucination.'],
  'default':              ['The average technical interview has 5–7 rounds at top companies.', 'Interviewers spend ~6 seconds on an initial resume scan before deciding to read further.', 'Explaining your thought process matters as much as the correct answer in system design.', 'Most coding interviews test 5 core patterns: sliding window, two pointers, BFS/DFS, DP, binary search.'],
};

function getFactsForChannels(channelIds: string[]): { fact: string; channel: string }[] {
  const results: { fact: string; channel: string }[] = [];
  for (const id of channelIds) {
    const facts = CHANNEL_FACTS[id] ?? [];
    facts.forEach(f => results.push({ fact: f, channel: id.replace(/-/g, ' ') }));
  }
  if (results.length === 0) {
    CHANNEL_FACTS['default'].forEach(f => results.push({ fact: f, channel: 'interview prep' }));
  }
  // shuffle
  return results.sort(() => Math.random() - 0.5);
}

interface InterviewLoaderProps {
  message?: string;
  showTip?: boolean;
}

export function InterviewLoader({ message = 'Loading...', showTip = true }: InterviewLoaderProps) {
  // Try to get subscribed channels — gracefully falls back if context unavailable
  let channelIds: string[] = [];
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { getSubscribedChannels } = useUserPreferences();
    channelIds = getSubscribedChannels().map((c: { id: string }) => c.id);
  } catch {
    // context not available (e.g. Suspense fallback outside provider)
  }

  const [facts] = useState(() => getFactsForChannels(channelIds));
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!showTip || facts.length === 0) return;
    const cycle = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % facts.length);
        setVisible(true);
      }, 400);
    }, 4000);
    return () => clearInterval(cycle);
  }, [facts, showTip]);

  const current = facts[idx];

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-5" role="status" aria-label={message}>
      <OrbCanvas />
      <div className="text-center space-y-2" style={{ minHeight: 64 }}>
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{message}</p>
        {showTip && current && (
          <div
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(6px)',
              transition: 'opacity 0.35s ease, transform 0.35s ease',
              maxWidth: 300,
              margin: '0 auto',
            }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--color-accent-violet-light)' }}>
              {current.channel}
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
              {current.fact}
            </p>
          </div>
        )}
      </div>
      <span className="sr-only">{message}</span>
    </div>
  );
}

// ── Canvas-based orb — smooth, on-brand, performant ──────────────────────────

interface Particle {
  angle: number;       // current orbit angle (radians)
  radius: number;      // orbit radius
  speed: number;       // radians per frame
  size: number;        // dot radius
  opacity: number;
  color: string;       // violet or cyan
  trail: { x: number; y: number }[];
}

const VIOLET = '#7c3aed';
const CYAN   = '#06b6d4';
const VIOLET_GLOW = 'rgba(124,58,237,';
const CYAN_GLOW   = 'rgba(6,182,212,';

function OrbCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const tRef      = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 160, H = 160;
    canvas.width  = W;
    canvas.height = H;
    const cx = W / 2, cy = H / 2;

    // ── Particles ──
    const particles: Particle[] = Array.from({ length: 18 }, (_, i) => ({
      angle:  (i / 18) * Math.PI * 2,
      radius: 28 + (i % 3) * 14,          // 3 orbit rings: 28, 42, 56
      speed:  (0.012 + (i % 3) * 0.006) * (i % 2 === 0 ? 1 : -1),
      size:   1.2 + (i % 3) * 0.6,
      opacity: 0.5 + Math.random() * 0.5,
      color:  i % 3 === 1 ? CYAN : VIOLET,
      trail:  [],
    }));

    // ── Floating knowledge symbols ──
    const symbols = ['?', '{ }', '<>', '∑', '⚡', '★'];
    const floaters = symbols.map((s, i) => ({
      sym: s,
      x: cx + Math.cos((i / symbols.length) * Math.PI * 2) * 62,
      y: cy + Math.sin((i / symbols.length) * Math.PI * 2) * 62,
      baseAngle: (i / symbols.length) * Math.PI * 2,
      opacity: 0,
    }));

    function draw(t: number) {
      tRef.current = t;
      ctx!.clearRect(0, 0, W, H);

      // ── Ambient background glow ──
      const bg = ctx!.createRadialGradient(cx, cy, 0, cx, cy, 72);
      bg.addColorStop(0,   'rgba(124,58,237,0.12)');
      bg.addColorStop(0.5, 'rgba(6,182,212,0.05)');
      bg.addColorStop(1,   'rgba(0,0,0,0)');
      ctx!.fillStyle = bg;
      ctx!.fillRect(0, 0, W, H);

      // ── Orbit rings (subtle) ──
      [28, 42, 56].forEach((r, i) => {
        ctx!.beginPath();
        ctx!.arc(cx, cy, r, 0, Math.PI * 2);
        ctx!.strokeStyle = i === 1
          ? `rgba(6,182,212,0.08)`
          : `rgba(124,58,237,0.08)`;
        ctx!.lineWidth = 0.5;
        ctx!.stroke();
      });

      // ── Particles ──
      particles.forEach(p => {
        p.angle += p.speed;
        const x = cx + Math.cos(p.angle) * p.radius;
        const y = cy + Math.sin(p.angle) * p.radius;

        // trail
        p.trail.push({ x, y });
        if (p.trail.length > 8) p.trail.shift();

        // draw trail
        p.trail.forEach((pt, ti) => {
          const alpha = (ti / p.trail.length) * 0.3 * p.opacity;
          const glow = p.color === CYAN ? CYAN_GLOW : VIOLET_GLOW;
          ctx!.beginPath();
          ctx!.arc(pt.x, pt.y, p.size * 0.6, 0, Math.PI * 2);
          ctx!.fillStyle = `${glow}${alpha})`;
          ctx!.fill();
        });

        // dot glow
        const grad = ctx!.createRadialGradient(x, y, 0, x, y, p.size * 3);
        const glow = p.color === CYAN ? CYAN_GLOW : VIOLET_GLOW;
        grad.addColorStop(0, `${glow}${p.opacity})`);
        grad.addColorStop(1, `${glow}0)`);
        ctx!.beginPath();
        ctx!.arc(x, y, p.size * 3, 0, Math.PI * 2);
        ctx!.fillStyle = grad;
        ctx!.fill();

        // dot core
        ctx!.beginPath();
        ctx!.arc(x, y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = p.color;
        ctx!.globalAlpha = p.opacity;
        ctx!.fill();
        ctx!.globalAlpha = 1;
      });

      // ── Floating symbols (fade in slowly, orbit gently) ──
      const elapsed = t / 1000;
      floaters.forEach((f, i) => {
        f.opacity = Math.min(0.35, f.opacity + 0.003);
        const wobble = Math.sin(elapsed * 0.8 + i) * 4;
        const fx = cx + Math.cos(f.baseAngle + elapsed * 0.15) * (62 + wobble);
        const fy = cy + Math.sin(f.baseAngle + elapsed * 0.15) * (62 + wobble);

        ctx!.font = '8px monospace';
        ctx!.textAlign = 'center';
        ctx!.textBaseline = 'middle';
        ctx!.fillStyle = i % 2 === 0
          ? `rgba(124,58,237,${f.opacity})`
          : `rgba(6,182,212,${f.opacity})`;
        ctx!.fillText(f.sym, fx, fy);
      });

      // ── Core orb ──
      const pulse = 0.85 + Math.sin(elapsed * 2.4) * 0.15;
      const coreR = 14 * pulse;

      // outer glow
      const outerGlow = ctx!.createRadialGradient(cx, cy, 0, cx, cy, coreR * 2.5);
      outerGlow.addColorStop(0,   `rgba(124,58,237,0.4)`);
      outerGlow.addColorStop(0.5, `rgba(6,182,212,0.15)`);
      outerGlow.addColorStop(1,   `rgba(0,0,0,0)`);
      ctx!.beginPath();
      ctx!.arc(cx, cy, coreR * 2.5, 0, Math.PI * 2);
      ctx!.fillStyle = outerGlow;
      ctx!.fill();

      // core fill
      const coreGrad = ctx!.createRadialGradient(cx - 3, cy - 3, 0, cx, cy, coreR);
      coreGrad.addColorStop(0,   'rgba(167,139,250,0.95)');  // violet-light
      coreGrad.addColorStop(0.6, 'rgba(124,58,237,0.9)');
      coreGrad.addColorStop(1,   'rgba(6,182,212,0.7)');
      ctx!.beginPath();
      ctx!.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx!.fillStyle = coreGrad;
      ctx!.fill();

      // core inner highlight
      const highlight = ctx!.createRadialGradient(cx - 4, cy - 4, 0, cx, cy, coreR);
      highlight.addColorStop(0,   'rgba(255,255,255,0.4)');
      highlight.addColorStop(0.4, 'rgba(255,255,255,0)');
      ctx!.beginPath();
      ctx!.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx!.fillStyle = highlight;
      ctx!.fill();

      // ── Connecting lines: core → nearest particles ──
      particles.slice(0, 6).forEach(p => {
        const x = cx + Math.cos(p.angle) * p.radius;
        const y = cy + Math.sin(p.angle) * p.radius;
        const dist = Math.hypot(x - cx, y - cy);
        const alpha = Math.max(0, 0.15 - dist / 400);
        ctx!.beginPath();
        ctx!.moveTo(cx, cy);
        ctx!.lineTo(x, y);
        ctx!.strokeStyle = `rgba(124,58,237,${alpha})`;
        ctx!.lineWidth = 0.5;
        ctx!.stroke();
      });

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: 160, height: 160 }}
      aria-hidden="true"
    />
  );
}
