/**
 * All Channels — Browse & subscribe to topics
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '../components/layout/AppLayout';
import { allChannelsConfig, categories } from '../lib/channels-config';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { useChannelStats } from '../hooks/use-stats';
import { useProgress } from '../hooks/use-progress';
import { SEOHead } from '../components/SEOHead';
import { PageHeader, SearchBar, FilterPills } from '@/components/ui/page';
import {
  Search, Plus, Sparkles, TrendingUp, ChevronRight, X,
  Box, Terminal, Layout, Server, Database, Infinity, Activity, Cloud, Layers,
  Brain, Eye, FileText, Code, Shield, Network, Monitor, Smartphone, CheckCircle,
  Zap, Gauge, Users, MessageCircle, Calculator, Cpu, GitBranch, Binary, Puzzle,
  GitMerge, Workflow, Award,
} from 'lucide-react';

const iconMap: Record<string, any> = {
  'boxes': Box, 'chart-line': TrendingUp, 'git-branch': GitBranch, 'binary': Binary,
  'puzzle': Puzzle, 'git-merge': GitMerge, 'calculator': Calculator, 'cpu': Cpu,
  'terminal': Terminal, 'layout': Layout, 'server': Server, 'database': Database,
  'infinity': Infinity, 'activity': Activity, 'box': Box, 'cloud': Cloud,
  'layers': Layers, 'workflow': Workflow, 'brain': Brain, 'sparkles': Sparkles,
  'message-circle': MessageCircle, 'eye': Eye, 'file-text': FileText, 'code': Code,
  'shield': Shield, 'network': Network, 'monitor': Monitor, 'smartphone': Smartphone,
  'check-circle': CheckCircle, 'zap': Zap, 'gauge': Gauge, 'users': Users, 'award': Award,
};

// Category → accent color
const categoryColors: Record<string, string> = {
  engineering: 'var(--color-accent-violet)',
  cloud:       'var(--color-accent-cyan)',
  security:    'var(--color-error)',
  ai:          'var(--color-accent-pink)',
  testing:     'var(--color-success)',
  soft:        'var(--accent-gold)',
};

// Difficulty per channel (fallback to category)
const difficultyMap: Record<string, string> = {};

function ProgressRing({ progress, size = 44, stroke = 3 }: { progress: number; size?: number; stroke?: number }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (progress / 100) * circ;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--surface-4)" strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke="var(--color-accent-violet)" strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s var(--ease-spring)' }}
      />
    </svg>
  );
}

// Determine if a channel is "new" (added in last 30 days — approximated by index for demo)
const NEW_THRESHOLD_IDX = 5;

type SortKey = 'az' | 'progress' | 'count';

const CATEGORY_TABS = [
  { id: '', label: 'All' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'cloud', label: 'Cloud' },
  { id: 'security', label: 'Security' },
  { id: 'ai', label: 'AI' },
];

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 16, scale: 0.97 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] } } };

// ── Channel Card (uses hooks at top level via parent map) ──────────────────
function ChannelCard({ channel, index, questionCount, navigate, isSubscribed, toggleSubscription }: {
  channel: any; index: number; questionCount: number;
  navigate: (path: string) => void;
  isSubscribed: (id: string) => boolean;
  toggleSubscription: (id: string) => void;
}) {
  const subscribed = isSubscribed(channel.id);
  const { completed } = useProgress(channel.id);
  const progress = questionCount > 0 ? Math.round((completed.length / questionCount) * 100) : 0;
  const Icon = iconMap[channel.icon] || Box;
  const accent = categoryColors[channel.category] || 'var(--color-accent-violet)';
  const isNew = index < NEW_THRESHOLD_IDX;

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -4, boxShadow: `0 0 32px ${accent}33` }}
      className="relative rounded-2xl border overflow-hidden group transition-all"
      style={{ background: 'var(--surface-2)', borderColor: subscribed ? `${accent}55` : 'var(--color-border)' }}
    >
      {/* Top accent line */}
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />

      {/* New badge */}
      {isNew && (
        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold z-10"
          style={{ background: 'var(--color-accent-cyan)', color: '#000' }}>
          NEW
        </div>
      )}

      <div className="p-4">
        {/* Icon + name row */}
        <div className="flex items-start gap-3 mb-3">
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${accent}18`, border: `1px solid ${accent}33` }}>
              <Icon className="w-6 h-6" style={{ color: accent }} strokeWidth={2} />
            </div>
            {/* Progress ring overlay */}
            {subscribed && progress > 0 && (
              <div className="absolute -inset-1 flex items-center justify-center pointer-events-none">
                <ProgressRing progress={progress} size={56} stroke={3} />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm leading-tight mb-1 truncate">{channel.name}</h3>
            <p className="text-xs line-clamp-2" style={{ color: 'var(--text-tertiary)' }}>{channel.description}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" style={{ color: accent }} />
            {questionCount} questions
          </span>

        </div>

        {/* Progress bar */}
        {subscribed && (
          <div className="h-1 rounded-full mb-3 overflow-hidden" style={{ background: 'var(--surface-4)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${accent}, var(--color-accent-cyan))` }}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {subscribed ? (
            <>
              <button
                onClick={() => navigate(`/channel/${channel.id}`)}
                className="flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                style={{ background: `linear-gradient(135deg, ${accent}, var(--color-accent-cyan))`, color: '#fff' }}
              >
                Continue <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => toggleSubscription(channel.id)}
                className="px-3 py-2 rounded-xl transition-all hover:bg-white/10"
                style={{ background: 'var(--surface-3)', border: '1px solid var(--color-border)', color: 'var(--text-secondary)' }}
                title="Unsubscribe"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <button
              onClick={() => toggleSubscription(channel.id)}
              className="flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              style={{ background: `linear-gradient(135deg, ${accent}, var(--color-accent-cyan))`, color: '#fff' }}
            >
              <Plus className="w-3.5 h-3.5" />Subscribe
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function AllChannels() {
  const [, navigate] = useLocation();
  const { isSubscribed, toggleSubscription, preferences } = useUserPreferences();
  const { stats } = useChannelStats();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>('');
  const [sortKey, setSortKey] = useState<SortKey>('az');
  const [progressFilter, setProgressFilter] = useState<'all' | 'not-started' | 'in-progress' | 'completed'>('all');
  const [subscribedOnly, setSubscribedOnly] = useState(true);

  const subscribedIds = new Set(preferences.subscribedChannels);
  const hasSubscriptions = subscribedIds.size > 0;

  const questionCounts: Record<string, number> = {};
  stats.forEach(s => { questionCounts[s.id] = s.total; });

  // Read completed counts from localStorage for progress filtering
  const getCompletedCount = (channelId: string): number => {
    try {
      const raw = localStorage.getItem(`progress_${channelId}`);
      return raw ? (JSON.parse(raw) as string[]).length : 0;
    } catch { return 0; }
  };

  const channels = allChannelsConfig.filter(ch => {
    if (subscribedOnly && hasSubscriptions && !subscribedIds.has(ch.id)) return false;
    const matchSearch = ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        ch.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = !selectedCategory || ch.category === selectedCategory;
    const total = questionCounts[ch.id] || 0;
    const done = getCompletedCount(ch.id);
    const matchProgress =
      progressFilter === 'all' ? true :
      progressFilter === 'not-started' ? done === 0 :
      progressFilter === 'in-progress' ? done > 0 && done < total :
      done > 0 && done >= total;
    return matchSearch && matchCat && matchProgress;
  }).sort((a, b) => {
    if (sortKey === 'az') return a.name.localeCompare(b.name);
    if (sortKey === 'count') return (questionCounts[b.id] || 0) - (questionCounts[a.id] || 0);
    return 0;
  });

  return (
    <>
      <SEOHead
        title="Browse Channels - Level Up Your Skills"
        description="Explore all topics and start learning. Frontend, backend, DevOps, and more."
        canonical="https://open-interview.github.io/channels"
      />
      <AppLayout>
        <div className="min-h-screen bg-background text-foreground">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

            {/* Page Header */}
            <PageHeader title="Channels" subtitle={`${channels.length} ${subscribedOnly && hasSubscriptions ? 'subscribed' : ''} channels`}>
              {hasSubscriptions && (
                <button
                  onClick={() => setSubscribedOnly(s => !s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    subscribedOnly
                      ? 'bg-[var(--color-accent-violet)]/15 border-[var(--color-accent-violet)] text-[var(--color-accent-violet-light)]'
                      : 'bg-muted/50 border-border text-muted-foreground'
                  }`}
                >
                  {subscribedOnly ? '★ My Topics' : 'All Topics'}
                </button>
              )}
            </PageHeader>

            {/* Filter Bar */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6 space-y-3">
              {/* Search + Sort + Progress filter */}
              <div className="flex gap-3 flex-wrap">
                <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search channels…" />
                <select
                  value={progressFilter}
                  onChange={(e) => setProgressFilter(e.target.value as typeof progressFilter)}
                  className="px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                  style={{ background: 'var(--surface-3)', border: '1px solid var(--color-border)', color: 'var(--text-primary)' }}
                >
                  <option value="all">All Progress</option>
                  <option value="not-started">Not Started</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
                  className="px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                  style={{ background: 'var(--surface-3)', border: '1px solid var(--color-border)', color: 'var(--text-primary)' }}
                >
                  <option value="az">A–Z</option>
                  <option value="count">Most Questions</option>
                  <option value="progress">Progress</option>
                </select>
              </div>

              <FilterPills options={[{id:'',label:'All'}, ...categories.map(c=>({id:c.id,label:c.name}))]} active={selectedCategory||''} onChange={id => setSelectedCategory(id||null)} />
            </motion.div>

            {/* Grid — grouped by category when no filter active */}
            {(() => {
              const categoryMeta: Record<string, { label: string; icon: any; color: string }> = {
                engineering: { label: 'Engineering', icon: Code, color: 'var(--color-accent-violet)' },
                cloud:       { label: 'Cloud', icon: Cloud, color: 'var(--color-accent-cyan)' },
                security:    { label: 'Security', icon: Shield, color: 'var(--color-error)' },
                ai:          { label: 'AI / ML', icon: Brain, color: 'var(--color-accent-pink)' },
                testing:     { label: 'Testing', icon: CheckCircle, color: 'var(--color-success)' },
                soft:        { label: 'Soft Skills', icon: Users, color: 'var(--accent-gold)' },
                data:        { label: 'Data', icon: Database, color: 'var(--color-accent-cyan)' },
                mobile:      { label: 'Mobile', icon: Smartphone, color: 'var(--color-accent-violet)' },
                fundamentals:{ label: 'Fundamentals', icon: Layers, color: 'var(--text-secondary)' },
                management:  { label: 'Management', icon: Users, color: 'var(--accent-gold)' },
                certification:{ label: 'Certification', icon: Award, color: 'var(--accent-gold)' },
              };

              // When a category is selected or search active, show flat grid
              if (selectedCategory || searchQuery || progressFilter !== 'all') {
                return (
                  <motion.div variants={stagger} initial="hidden" animate="visible"
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                    {channels.map((channel, i) => (
                      <ChannelCard key={channel.id} channel={channel} index={i}
                        questionCount={questionCounts[channel.id] || 0}
                        navigate={navigate} isSubscribed={isSubscribed} toggleSubscription={toggleSubscription} />
                    ))}
                  </motion.div>
                );
              }

              // Group by category
              const grouped: Record<string, typeof channels> = {};
              channels.forEach(ch => {
                const cat = ch.category || 'other';
                if (!grouped[cat]) grouped[cat] = [];
                grouped[cat].push(ch);
              });

              return (
                <div className="space-y-10">
                  {Object.entries(grouped).map(([cat, catChannels]) => {
                    const meta = categoryMeta[cat] || { label: cat, icon: Layers, color: 'var(--text-secondary)' };
                    const CatIcon = meta.icon;
                    return (
                      <div key={cat}>
                        <div className="flex items-center gap-2 mb-4">
                          <CatIcon className="w-5 h-5" style={{ color: meta.color }} />
                          <h2 className="text-lg font-bold">{meta.label}</h2>
                          <span className="text-xs px-2 py-0.5 rounded-full ml-1" style={{ background: `${meta.color}18`, color: meta.color }}>
                            {catChannels.length}
                          </span>
                        </div>
                        {/* Horizontal scroll on mobile, grid on desktop */}
                        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide md:grid md:grid-cols-3 lg:grid-cols-4 md:overflow-visible md:pb-0">
                          {catChannels.map((channel, i) => (
                            <div key={channel.id} className="flex-shrink-0 w-56 md:w-auto">
                              <ChannelCard channel={channel} index={i}
                                questionCount={questionCounts[channel.id] || 0}
                                navigate={navigate} isSubscribed={isSubscribed} toggleSubscription={toggleSubscription} />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Empty state */}
            {channels.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                <Search className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
                <h3 className="text-xl font-bold mb-2">
                  {subscribedOnly && hasSubscriptions ? 'No subscribed channels match' : 'No channels found'}
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  {subscribedOnly && hasSubscriptions
                    ? 'Try clearing filters or browse all topics'
                    : 'Try a different search or category'}
                </p>
                {subscribedOnly && hasSubscriptions && (
                  <button
                    onClick={() => setSubscribedOnly(false)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-[var(--color-accent-violet)] to-[var(--color-accent-cyan)] text-white"
                  >
                    Browse All Channels
                  </button>
                )}
              </motion.div>
            )}

          </div>
        </div>
      </AppLayout>
    </>
  );
}
