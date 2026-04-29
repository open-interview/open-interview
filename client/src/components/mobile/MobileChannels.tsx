/**
 * Mobile Channels — Material Design 3
 * Persistent search · Filter chips · Elevated cards · Progress rings · Sticky headers
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { allChannelsConfig, categories, ChannelConfig } from '../../lib/channels-config';
import { useUserPreferences } from '../../context/UserPreferencesContext';
import { useChannelStats } from '../../hooks/use-stats';
import { useProgress } from '../../hooks/use-progress';
import {
  Search, Mic, X, Check, Plus,
  Cpu, Terminal, Layout, Database, Activity, GitBranch, Server,
  Layers, Smartphone, Shield, Brain, Box, Cloud, Code,
  Network, MessageCircle, Users, Sparkles, Eye, FileText, CheckCircle,
  Monitor, Zap, Gauge, BookOpen, Award,
} from 'lucide-react';

// ─── Icon map ────────────────────────────────────────────────────────────────

const iconMap: Record<string, React.ElementType> = {
  'cpu': Cpu, 'terminal': Terminal, 'layout': Layout, 'database': Database,
  'activity': Activity, 'infinity': GitBranch, 'server': Server, 'layers': Layers,
  'smartphone': Smartphone, 'shield': Shield, 'brain': Brain, 'workflow': Layers,
  'box': Box, 'boxes': Box, 'cloud': Cloud, 'code': Code, 'network': Network,
  'message-circle': MessageCircle, 'users': Users, 'sparkles': Sparkles,
  'eye': Eye, 'file-text': FileText, 'check-circle': CheckCircle,
  'monitor': Monitor, 'zap': Zap, 'gauge': Gauge, 'award': Award,
  'book-open': BookOpen, 'chart-line': Activity, 'git-branch': GitBranch,
  'binary': Cpu, 'puzzle': Layers, 'git-merge': Network, 'calculator': Brain,
};

// ─── Category metadata ───────────────────────────────────────────────────────

const categoryMeta: Record<string, { emoji: string }> = {
  fundamentals:  { emoji: '🧮' },
  engineering:   { emoji: '🏗️' },
  cloud:         { emoji: '☁️' },
  data:          { emoji: '📊' },
  ai:            { emoji: '🤖' },
  security:      { emoji: '🔒' },
  testing:       { emoji: '🧪' },
  mobile:        { emoji: '📱' },
  management:    { emoji: '👥' },
  certification: { emoji: '🏆' },
};

// ─── Progress ring ───────────────────────────────────────────────────────────

function ProgressRing({ pct, size = 52, stroke = 3 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="hsl(var(--muted))" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="hsl(var(--primary))" strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={circ - (pct / 100) * circ}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease-out' }} />
    </svg>
  );
}

// ─── Skeleton card ───────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-3xl p-4 bg-card shadow-sm animate-pulse space-y-3">
      <div className="flex items-start justify-between">
        <div className="w-12 h-12 rounded-2xl bg-muted" />
        <div className="min-w-[48px] w-8 min-h-[48px] h-8 rounded-full bg-muted" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-3 w-full rounded bg-muted" />
      </div>
      <div className="h-3 w-1/3 rounded bg-muted" />
    </div>
  );
}

// ─── Filter chip ─────────────────────────────────────────────────────────────

function FilterChip({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-1 px-4 min-h-[48px] h-8 rounded-full text-sm font-medium
        whitespace-nowrap transition-all duration-200 flex-shrink-0 border
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
        ${active
          ? 'bg-[hsl(var(--primary-container,var(--primary)))] text-[hsl(var(--on-primary-container,var(--primary-foreground)))] border-transparent'
          : 'bg-transparent border-[hsl(var(--outline,var(--border)))] text-[hsl(var(--on-surface-variant,var(--muted-foreground)))] hover:bg-muted/60'
        }
      `}
    >
      {active && <Check className="w-3 h-3" />}
      {children}
    </button>
  );
}

// ─── Channel card (M3 elevated) ───────────────────────────────────────────────

function ChannelCard({ channel, questionCount, isSubscribed, onToggle, onNavigate, index }: {
  channel: ChannelConfig;
  questionCount: number;
  isSubscribed: boolean;
  onToggle: () => void;
  onNavigate: () => void;
  index: number;
}) {
  const { completed } = useProgress(channel.id);
  const pct = questionCount > 0 ? Math.min(100, Math.round((completed.length / questionCount) * 100)) : 0;
  const hasProgress = pct > 0;
  const Icon = iconMap[channel.icon] || BookOpen;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.025, 0.25) }}
      onClick={onNavigate}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onNavigate()}
      aria-label={`${channel.name}, ${questionCount} questions${hasProgress ? `, ${pct}% complete` : ''}`}
      className={`
        group relative rounded-3xl p-4 cursor-pointer transition-all duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
        ${hasProgress
          ? 'bg-[hsl(var(--primary-container,var(--primary)/0.12))] shadow-md'
          : 'bg-card shadow-[0_1px_3px_hsl(0_0%_0%/0.12)] active:shadow-sm'
        }
      `}
    >
      <div className="space-y-3">
        {/* Header: 48dp tonal icon + subscribe toggle */}
        <div className="flex items-start justify-between">
          <div className="relative w-12 h-12 flex-shrink-0">
            {hasProgress && (
              <div className="absolute -inset-1 flex items-center justify-center pointer-events-none">
                <ProgressRing pct={pct} size={56} stroke={3} />
              </div>
            )}
            <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-[hsl(var(--secondary-container,var(--primary)/0.15))]">
              <Icon className="w-5 h-5 text-[hsl(var(--on-secondary-container,var(--primary)))]" />
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.82 }}
            onClick={e => { e.stopPropagation(); onToggle(); }}
            aria-label={isSubscribed ? `Unsubscribe from ${channel.name}` : `Subscribe to ${channel.name}`}
            className={`
              min-w-[48px] w-8 min-h-[48px] h-8 rounded-full flex items-center justify-center transition-all
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
              ${isSubscribed
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-primary/15 hover:text-primary'
              }
            `}
          >
            {isSubscribed ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </motion.button>
        </div>

        {/* Title Medium */}
        <div>
          <h3 className="text-sm font-medium leading-snug line-clamp-2 group-active:text-primary transition-colors">
            {channel.name}
          </h3>
        </div>

        {/* Body Small: question count */}
        <p className="text-xs text-[hsl(var(--on-surface-variant,var(--muted-foreground)))]">
          {questionCount} questions
          {hasProgress && (
            <span className="ml-1.5 font-medium text-primary">{pct}%</span>
          )}
        </p>

        {/* Progress bar */}
        {hasProgress && (
          <div className="h-1 rounded-full overflow-hidden bg-[hsl(var(--primary)/0.2)]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full rounded-full bg-primary"
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Sticky category header ───────────────────────────────────────────────────

function CategoryHeader({ id, name, count }: { id: string; name: string; count: number }) {
  const meta = categoryMeta[id] ?? { emoji: '📋' };
  return (
    <div className="sticky top-[calc(var(--mobile-search-height,112px))] z-10 -mx-4 px-4 py-2 bg-background/90 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span className="text-sm" aria-hidden>{meta.emoji}</span>
        <h2 className="text-sm font-medium text-[hsl(var(--on-surface-variant,var(--muted-foreground)))]">
          {name}
        </h2>
        <span className="text-xs text-[hsl(var(--on-surface-variant,var(--muted-foreground)))]">
          · {count}
        </span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MobileChannels() {
  const [, setLocation] = useLocation();
  const { isSubscribed, toggleSubscription } = useUserPreferences();
  const { stats } = useChannelStats();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const questionCounts: Record<string, number> = {};
  stats.forEach(s => { questionCounts[s.id] = s.total; });

  const filtered = allChannelsConfig.filter(ch => {
    const q = searchQuery.trim().toLowerCase();
    const matchSearch = q.length < 2 ||
      ch.name.toLowerCase().includes(q) ||
      ch.description.toLowerCase().includes(q);
    const matchCat = !selectedCategory || ch.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const grouped = categories
    .map(cat => ({ ...cat, channels: filtered.filter(c => c.category === cat.id) }))
    .filter(g => g.channels.length > 0);

  return (
    <div className="pb-24">

      {/* ── Persistent M3 Search Bar ── */}
      <div className="sticky top-14 z-30 bg-background px-4 pt-3 pb-2 border-b border-border/40">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--on-surface-variant,var(--muted-foreground)))] pointer-events-none" />
          <input
            type="search"
            placeholder="Search channels…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            aria-label="Search channels"
            className="
              w-full h-12 rounded-full pl-12 pr-20 text-sm
              bg-[hsl(var(--surface-variant,var(--muted)))]
              text-[hsl(var(--on-surface,var(--foreground)))]
              placeholder:text-[hsl(var(--on-surface-variant,var(--muted-foreground)))]
              focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
              shadow-[0_1px_3px_hsl(0_0%_0%/0.08)]
            "
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4 text-[hsl(var(--on-surface-variant,var(--muted-foreground)))]" />
              </button>
            )}
            <button aria-label="Voice search" className="p-2 rounded-full hover:bg-muted transition-colors">
              <Mic className="w-5 h-5 text-[hsl(var(--on-surface-variant,var(--muted-foreground)))]" />
            </button>
          </div>
        </div>

        {/* ── Filter chips ── */}
        <div
          className="flex gap-2 mt-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          role="group"
          aria-label="Filter by category"
        >
          <FilterChip active={!selectedCategory} onClick={() => setSelectedCategory(null)}>
            All
          </FilterChip>
          {categories.map(cat => (
            <FilterChip
              key={cat.id}
              active={selectedCategory === cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
            >
              {categoryMeta[cat.id]?.emoji} {cat.name.split(' ')[0]}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* ── Skeleton ── */}
      {loading && (
        <div className="grid grid-cols-2 gap-3 px-4 pt-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center py-16 px-6"
        >
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <Search className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-medium mb-1">
            No results for "{searchQuery}"
          </h3>
          <p className="text-sm text-[hsl(var(--on-surface-variant,var(--muted-foreground)))] mb-5">
            Try a different keyword or browse all categories
          </p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}
            className="px-5 h-9 rounded-full bg-primary text-primary-foreground text-sm font-medium"
          >
            Clear filters
          </button>
        </motion.div>
      )}

      {/* ── Content ── */}
      {!loading && filtered.length > 0 && (
        selectedCategory ? (
          /* Flat 2-col grid for filtered view */
          <div className="grid grid-cols-2 gap-3 px-4 pt-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((ch, i) => (
                <ChannelCard
                  key={ch.id}
                  channel={ch}
                  questionCount={questionCounts[ch.id] ?? 0}
                  isSubscribed={isSubscribed(ch.id)}
                  onToggle={() => toggleSubscription(ch.id)}
                  onNavigate={() => setLocation(`/channel/${ch.id}`)}
                  index={i}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          /* Grouped with sticky category headers */
          <div className="px-4 pt-2 space-y-6">
            {grouped.map(group => (
              <section key={group.id}>
                <CategoryHeader id={group.id} name={group.name} count={group.channels.length} />
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <AnimatePresence mode="popLayout">
                    {group.channels.map((ch, i) => (
                      <ChannelCard
                        key={ch.id}
                        channel={ch}
                        questionCount={questionCounts[ch.id] ?? 0}
                        isSubscribed={isSubscribed(ch.id)}
                        onToggle={() => toggleSubscription(ch.id)}
                        onNavigate={() => setLocation(`/channel/${ch.id}`)}
                        index={i}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            ))}
          </div>
        )
      )}
    </div>
  );
}
