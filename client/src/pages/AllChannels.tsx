/**
 * All Channels — Browse & subscribe to topics
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '../components/layout/AppLayout';
import { allChannelsConfig, categories } from '../lib/channels-config';
import type { ChannelConfig } from '../lib/channels-config';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { useChannelStats } from '../hooks/use-stats';
import { useProgress } from '../hooks/use-progress';
import { SEOHead } from '../components/SEOHead';
import { PageHeader, SearchBar, FilterPills } from '@/components/ui/page';
import {
  Plus, Sparkles, TrendingUp, ChevronRight, ChevronDown, X, Check,
  BookOpen, BarChart2,
  Box, Terminal, Layout, Server, Database, Infinity, Activity, Cloud, Layers,
  Brain, Eye, FileText, Code, Shield, Network, Monitor, Smartphone, CheckCircle,
  Zap, Gauge, Users, MessageCircle, Calculator, Cpu, GitBranch, Binary, Puzzle,
  GitMerge, Workflow, Award, Search,
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  'boxes': Box, 'chart-line': TrendingUp, 'git-branch': GitBranch, 'binary': Binary,
  'puzzle': Puzzle, 'git-merge': GitMerge, 'calculator': Calculator, 'cpu': Cpu,
  'terminal': Terminal, 'layout': Layout, 'server': Server, 'database': Database,
  'infinity': Infinity, 'activity': Activity, 'box': Box, 'cloud': Cloud,
  'layers': Layers, 'workflow': Workflow, 'brain': Brain, 'sparkles': Sparkles,
  'message-circle': MessageCircle, 'eye': Eye, 'file-text': FileText, 'code': Code,
  'shield': Shield, 'network': Network, 'monitor': Monitor, 'smartphone': Smartphone,
  'check-circle': CheckCircle, 'zap': Zap, 'gauge': Gauge, 'users': Users, 'award': Award,
};

const categoryColors: Record<string, string> = {
  engineering:   'var(--color-accent-violet)',
  cloud:         'var(--color-accent-cyan)',
  security:      'var(--color-error)',
  ai:            'var(--color-accent-pink)',
  testing:       'var(--color-success)',
  soft:          'var(--accent-gold)',
  certification: 'var(--accent-gold)',
};

const CERT_PROVIDER_META: Record<string, { label: string; emoji: string; order: number }> = {
  AWS:        { label: 'Amazon Web Services', emoji: '☁️',  order: 1 },
  Kubernetes: { label: 'Kubernetes',          emoji: '⚙️',  order: 2 },
  HashiCorp:  { label: 'HashiCorp',           emoji: '🔷', order: 3 },
  GCP:        { label: 'Google Cloud',        emoji: '🌐', order: 4 },
  Azure:      { label: 'Microsoft Azure',     emoji: '🔵', order: 5 },
  Linux:      { label: 'Linux / Docker',      emoji: '🐧', order: 6 },
  Data:       { label: 'Data & Analytics',    emoji: '📊', order: 7 },
  Security:   { label: 'Security',            emoji: '🛡️',  order: 8 },
  AI:         { label: 'AI / ML',             emoji: '🤖', order: 9 },
};

function getChannelProvider(channelId: string): string {
  if (channelId.startsWith('aws-')) return 'AWS';
  if (channelId.startsWith('gcp-')) return 'GCP';
  if (channelId.startsWith('azure-')) return 'Azure';
  if (['cka','ckad','cks','kcna','kcsa','ckne','capa','cgoa','cca','ica','kca','otca','pca','cba','cnpa','cnf-certification'].includes(channelId)) return 'Kubernetes';
  if (channelId.startsWith('terraform-') || channelId.startsWith('vault-') || channelId.startsWith('consul-')) return 'HashiCorp';
  if (channelId.startsWith('linux-') || channelId === 'rhcsa' || channelId === 'docker-dca') return 'Linux';
  if (channelId.startsWith('databricks-') || channelId.startsWith('snowflake-') || channelId.startsWith('dbt-')) return 'Data';
  if (channelId.startsWith('comptia-') || channelId === 'cissp') return 'Security';
  if (channelId.startsWith('tensorflow-')) return 'AI';
  return 'Other';
}

type SortKey = 'az' | 'progress' | 'count';

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 16, scale: 0.97 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] } } };

function ProgressRing({ progress, size = 44, stroke = 3 }: { progress: number; size?: number; stroke?: number }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (progress / 100) * circ;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--surface-4)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--color-accent-violet)" strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s var(--ease-spring)' }} />
    </svg>
  );
}

function ChannelCard({ channel, questionCount, navigate, isSubscribed, toggleSubscription, onSelect }: {
  channel: ChannelConfig;
  questionCount: number;
  navigate: (path: string) => void;
  isSubscribed: (id: string) => boolean;
  toggleSubscription: (id: string) => void;
  onSelect?: () => void;
}) {
  const subscribed = isSubscribed(channel.id);
  const { completed } = useProgress(channel.id);
  const progress = questionCount > 0 ? Math.round((completed.length / questionCount) * 100) : 0;
  const Icon = iconMap[channel.icon] || Box;
  const accent = categoryColors[channel.category] || 'var(--color-accent-violet)';
  const isNew = Boolean(channel.addedAt && new Date(channel.addedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className="group relative p-5 bg-card border border-border rounded-3xl cursor-pointer hover:border-[var(--color-accent-violet)]/40 transition-all duration-200 ease-out overflow-hidden"
      style={{
        boxShadow: '8px 8px 24px rgba(0,0,0,0.15), -4px -4px 16px rgba(255,255,255,0.05)',
      }}
      whileHover={{ 
        y: -4,
        boxShadow: '12px 12px 32px rgba(0,0,0,0.2), -6px -6px 20px rgba(255,255,255,0.08)',
      }}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />

      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent-violet)]/10 to-[var(--color-accent-cyan)]/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />

      {/* Clay border for featured/subscribed */}
      {subscribed && (
        <div className="absolute inset-0 rounded-3xl pointer-events-none border-2"
          style={{ borderColor: `${accent}40`, background: `linear-gradient(135deg, ${accent}08, transparent)` }}
        />
      )}

      {/* NEW badge */}
      {isNew && (
        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold z-10 bg-[var(--color-accent-cyan)] text-black">
          NEW
        </div>
      )}

      {/* Subscribed badge */}
      {subscribed && !isNew && (
        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold z-10"
          style={{ background: `${accent}22`, border: `1px solid ${accent}66`, color: accent }}>
          ★ Subscribed
        </div>
      )}

      <div className="relative space-y-3">
        {/* Header row */}
        <div className="flex items-start gap-3">
          {/* Icon with SVG ring */}
          <div className="relative w-10 h-10 flex-shrink-0">
            {subscribed && progress > 0 && (
              <div className="absolute -inset-1 flex items-center justify-center pointer-events-none">
                <ProgressRing progress={progress} size={48} stroke={3} />
              </div>
            )}
            <div className="absolute inset-0 rounded-xl flex items-center justify-center"
              style={{ background: `${accent}18`, border: `1px solid ${accent}33` }}>
              <Icon className="w-4 h-4" style={{ color: accent }} />
            </div>
          </div>
          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-muted-foreground capitalize">{channel.category}</div>
            <h3 className="text-sm font-bold leading-tight line-clamp-2">{channel.name}</h3>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2">{channel.description}</p>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" />{questionCount}q</span>
          {subscribed && <span className="flex items-center gap-1"><BarChart2 className="w-3 h-3" />{progress}%</span>}
        </div>

        {/* Progress bar */}
        {subscribed && (
          <div className="h-1 rounded-full overflow-hidden bg-muted">
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
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={e => { e.stopPropagation(); navigate(`/channel/${channel.id}`); }}
                className="flex-1 min-h-[44px] rounded-2xl text-xs font-bold transition-all duration-150 ease-out flex items-center justify-center gap-1.5 text-white cursor-pointer"
                style={{ background: `linear-gradient(135deg, ${accent}, var(--color-accent-cyan))` }}
              >
                Continue <ChevronRight className="w-3.5 h-3.5" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={e => { e.stopPropagation(); toggleSubscription(channel.id); }}
                className="px-3 min-h-[44px] rounded-2xl transition-all duration-150 ease-out hover:bg-muted/80 border border-border text-muted-foreground cursor-pointer"
                title="Unsubscribe"
              >
                <X className="w-3.5 h-3.5" />
              </motion.button>
            </>
          ) : (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={e => { e.stopPropagation(); toggleSubscription(channel.id); }}
              className="flex-1 min-h-[44px] rounded-2xl text-xs font-bold transition-all duration-150 ease-out flex items-center justify-center gap-1.5 text-white cursor-pointer"
              style={{ background: `linear-gradient(135deg, ${accent}, var(--color-accent-cyan))` }}
            >
              <Plus className="w-3.5 h-3.5" />Subscribe
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function CategorySection({ categoryKey, channels, questionCounts, navigate, isSubscribed, toggleSubscription, onSelect }: {
  categoryKey: string;
  channels: ChannelConfig[];
  questionCounts: Record<string, number>;
  navigate: (path: string) => void;
  isSubscribed: (id: string) => boolean;
  toggleSubscription: (id: string) => void;
  onSelect: (channel: ChannelConfig) => void;
}) {
  const [open, setOpen] = useState(true);
  const meta = CERT_PROVIDER_META[categoryKey] ?? { label: categoryKey, emoji: '📋', order: 99 };
  const subscribedCount = channels.filter(c => isSubscribed(c.id)).length;

  return (
    <div className="mb-6">
      <button onClick={() => setOpen(o => !o)} className="w-full min-h-[44px] flex items-center justify-between px-1 py-2 mb-3 group cursor-pointer">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{meta.emoji}</span>
          <div className="text-left">
            <div className="text-sm font-bold">{meta.label}</div>
            <div className="text-[10px] text-muted-foreground">
              {channels.length} channels{subscribedCount > 0 ? ` · ${subscribedCount} subscribed` : ''}
            </div>
          </div>
        </div>
        <motion.div animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {channels.map(ch => (
                <ChannelCard key={ch.id} channel={ch}
                  questionCount={questionCounts[ch.id] || 0}
                  navigate={navigate} isSubscribed={isSubscribed} toggleSubscription={toggleSubscription}
                  onSelect={() => onSelect(ch)} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChannelDetail({ channel, questionCount, isSubscribed: subscribed, onToggle, onNavigate, onClose }: {
  channel: ChannelConfig;
  questionCount: number;
  isSubscribed: boolean;
  onToggle: () => void;
  onNavigate: () => void;
  onClose: () => void;
}) {
  const Icon = iconMap[channel.icon] || Award;
  const accent = categoryColors[channel.category] || 'var(--color-accent-violet)';
  const { completed } = useProgress(channel.id);
  const progress = questionCount > 0 ? Math.round((completed.length / Math.max(questionCount, 1)) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[var(--z-modal)] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full sm:max-w-lg bg-card border border-border rounded-t-2xl sm:rounded-2xl p-6 max-h-[85vh] overflow-y-auto custom-scrollbar"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors duration-150 ease-out cursor-pointer">
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${accent}20`, border: `1px solid ${accent}30` }}>
            <Icon className="w-7 h-7" style={{ color: accent }} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-0.5 capitalize">{channel.category}</div>
            <h2 className="text-lg font-bold leading-tight">{channel.name}</h2>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{channel.description}</p>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {([
            { icon: BookOpen, label: 'Questions', value: questionCount },
            { icon: BarChart2, label: 'Progress',  value: `${progress}%` },
          ] as { icon: React.ElementType; label: string; value: string | number }[]).map(({ icon: I, label, value }) => (
            <div key={label} className="p-3 rounded-xl bg-muted/40 flex items-center gap-2.5">
              <I className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div>
                <div className="text-[10px] text-muted-foreground">{label}</div>
                <div className="text-sm font-semibold">{value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {subscribed && (
          <div className="mb-5 p-3 rounded-xl border" style={{ background: `${accent}10`, borderColor: `${accent}20` }}>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold" style={{ color: accent }}>{progress}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${accent}, var(--color-accent-cyan))` }} />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onToggle}
            className={`flex-1 min-h-[44px] rounded-xl text-sm font-bold transition-all duration-150 ease-out flex items-center justify-center gap-2 cursor-pointer ${
              subscribed ? 'bg-muted border border-border hover:bg-muted/80 text-foreground' : 'text-white hover:opacity-90'
            }`}
            style={subscribed ? {} : { background: `linear-gradient(135deg, ${accent}, var(--color-accent-cyan))` }}
          >
            {subscribed ? <><Check className="w-4 h-4" />Subscribed</> : <><Plus className="w-4 h-4" />Subscribe</>}
          </button>
          {subscribed && (
            <button
              onClick={onNavigate}
              className="flex-1 min-h-[44px] rounded-xl text-sm font-bold text-white hover:opacity-90 transition-all duration-150 ease-out flex items-center justify-center gap-2 cursor-pointer"
              style={{ background: `linear-gradient(135deg, ${accent}, var(--color-accent-cyan))` }}
            >
              Go to Channel <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
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
  const [subscribedOnly, setSubscribedOnly] = useState(() =>
    preferences.subscribedChannels.length > 0
  );
  const [selectedChannel, setSelectedChannel] = useState<ChannelConfig | null>(null);

  const subscribedIds = new Set(preferences.subscribedChannels);
  const hasSubscriptions = subscribedIds.size > 0;

  const questionCounts: Record<string, number> = {};
  stats.forEach(s => { questionCounts[s.id] = s.total; });

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

  // Stats bar values (shown when subscribedIds has entries)
  const subscribedCount = subscribedIds.size;
  const totalCount = allChannelsConfig.length;

  // Cert-view provider grouping
  const isCertView = selectedCategory === 'certification' && !searchQuery && progressFilter === 'all';
  const certProviderGroups: [string, ChannelConfig[]][] = [];
  if (isCertView) {
    const byProvider: Record<string, ChannelConfig[]> = {};
    channels.forEach(ch => {
      const p = getChannelProvider(ch.id);
      if (!byProvider[p]) byProvider[p] = [];
      byProvider[p].push(ch);
    });
    Object.entries(byProvider)
      .sort(([a], [b]) => (CERT_PROVIDER_META[a]?.order ?? 99) - (CERT_PROVIDER_META[b]?.order ?? 99))
      .forEach(entry => certProviderGroups.push(entry));
  }

  const categoryMeta: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    engineering:   { label: 'Engineering',  icon: Code,        color: 'var(--color-accent-violet)' },
    cloud:         { label: 'Cloud',        icon: Cloud,       color: 'var(--color-accent-cyan)' },
    security:      { label: 'Security',     icon: Shield,      color: 'var(--color-error)' },
    ai:            { label: 'AI / ML',      icon: Brain,       color: 'var(--color-accent-pink)' },
    testing:       { label: 'Testing',      icon: CheckCircle, color: 'var(--color-success)' },
    soft:          { label: 'Soft Skills',  icon: Users,       color: 'var(--accent-gold)' },
    data:          { label: 'Data',         icon: Database,    color: 'var(--color-accent-cyan)' },
    mobile:        { label: 'Mobile',       icon: Smartphone,  color: 'var(--color-accent-violet)' },
    fundamentals:  { label: 'Fundamentals', icon: Layers,      color: 'var(--text-secondary)' },
    management:    { label: 'Management',   icon: Users,       color: 'var(--accent-gold)' },
    certification: { label: 'Certification',icon: Award,       color: 'var(--accent-gold)' },
  };

  const renderContent = () => {
    if (channels.length === 0) {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-bold mb-2">
            {subscribedOnly && hasSubscriptions ? 'No subscribed channels match' : 'No channels found'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {subscribedOnly && hasSubscriptions ? 'Try clearing filters or browse all topics' : 'Try a different search or category'}
          </p>
          {subscribedOnly && hasSubscriptions && (
            <button onClick={() => setSubscribedOnly(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-[var(--color-accent-violet)] to-[var(--color-accent-cyan)] text-white">
              Browse All Channels
            </button>
          )}
        </motion.div>
      );
    }

    // Cert provider-grouped view
    if (isCertView) {
      return (
        <div className="space-y-2">
          {certProviderGroups.map(([provider, providerChannels]) => (
            <CategorySection key={provider} categoryKey={provider} channels={providerChannels}
              questionCounts={questionCounts} navigate={navigate}
              isSubscribed={isSubscribed} toggleSubscription={toggleSubscription}
              onSelect={setSelectedChannel} />
          ))}
        </div>
      );
    }

    // Flat grid when filter/search active
    if (selectedCategory || searchQuery || progressFilter !== 'all') {
      return (
        <motion.div variants={stagger} initial="hidden" animate="visible"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {channels.map(ch => (
            <ChannelCard key={ch.id} channel={ch} questionCount={questionCounts[ch.id] || 0}
              navigate={navigate} isSubscribed={isSubscribed} toggleSubscription={toggleSubscription}
              onSelect={() => setSelectedChannel(ch)} />
          ))}
        </motion.div>
      );
    }

    // Grouped by category (default)
    const grouped: Record<string, ChannelConfig[]> = {};
    channels.forEach(ch => {
      const cat = ch.category || 'other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(ch);
    });
    const subscribedCats = new Set<string>(
      preferences.subscribedChannels.flatMap(id => {
        const ch = allChannelsConfig.find(c => c.id === id);
        return ch?.category ? [ch.category] : [];
      })
    );
    const sortedEntries = Object.entries(grouped).sort(([a], [b]) => {
      return (subscribedCats.has(a) ? 0 : 1) - (subscribedCats.has(b) ? 0 : 1);
    });
    const firstUnsubscribedIdx = sortedEntries.findIndex(([cat]) => !subscribedCats.has(cat));

    return (
      <div className="space-y-10">
        {sortedEntries.map(([cat, catChannels], idx) => {
          const meta = categoryMeta[cat] ?? { label: cat, icon: Layers, color: 'var(--text-secondary)' };
          const CatIcon = meta.icon;
          return (
            <div key={cat}>
              {idx === firstUnsubscribedIdx && firstUnsubscribedIdx > 0 && (
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-muted text-muted-foreground border border-border">
                    Explore More Topics
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              )}
              <div className="flex items-center gap-2 mb-4">
                <CatIcon className="w-5 h-5" style={{ color: meta.color }} />
                <h2 className="text-lg font-bold">{meta.label}</h2>
                <span className="text-xs px-2 py-0.5 rounded-full ml-1" style={{ background: `${meta.color}18`, color: meta.color }}>
                  {catChannels.length}
                </span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide md:grid md:grid-cols-3 lg:grid-cols-4 md:overflow-visible md:pb-0">
                {catChannels.map(ch => (
                  <div key={ch.id} className="flex-shrink-0 w-56 md:w-auto">
                    <ChannelCard channel={ch} questionCount={questionCounts[ch.id] || 0}
                      navigate={navigate} isSubscribed={isSubscribed} toggleSubscription={toggleSubscription}
                      onSelect={() => setSelectedChannel(ch)} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <SEOHead
        title="Browse Channels - Level Up Your Skills"
        description="Explore all topics and start learning. Frontend, backend, DevOps, and more."
        canonical="https://open-interview.github.io/channels"
      />
      <AppLayout fullWidth>
        <div className="min-h-screen bg-background text-foreground">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-24">

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

            {/* Stats bar */}
            {subscribedIds.size > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-3 gap-3 mb-6 max-w-lg mx-auto">
                {[
                  { label: 'Subscribed', value: subscribedCount,  colorClass: 'text-[var(--color-accent-violet-light)]' },
                  { label: 'Total',      value: totalCount,        colorClass: 'text-[var(--color-accent-cyan)]' },
                  { label: 'Avg Progress', value: `${Math.round(preferences.subscribedChannels.reduce((acc, id) => {
                      const total = questionCounts[id] || 0;
                      if (!total) return acc;
                      try { const raw = localStorage.getItem(`progress-${id}`); return acc + (raw ? (JSON.parse(raw) as string[]).length / total * 100 : 0); } catch { return acc; }
                    }, 0) / Math.max(subscribedCount, 1))}%`, colorClass: 'text-[var(--color-success)]' },
                ].map(({ label, value, colorClass }) => (
                  <div key={label} className="p-3 rounded-xl bg-muted/40 border border-border text-center">
                    <div className={`text-xl font-bold ${colorClass}`}>{value}</div>
                    <div className="text-[10px] text-muted-foreground">{label}</div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Filter bar */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6 space-y-3">
              <div className="flex gap-3 flex-wrap">
                <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search channels…" />
                <select value={progressFilter} onChange={e => setProgressFilter(e.target.value as typeof progressFilter)}
                  className="min-h-[44px] px-3 py-2.5 rounded-xl text-sm focus:outline-none bg-muted border border-border text-foreground cursor-pointer">
                  <option value="all">All Progress</option>
                  <option value="not-started">Not Started</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)}
                  className="min-h-[44px] px-3 py-2.5 rounded-xl text-sm focus:outline-none bg-muted border border-border text-foreground cursor-pointer">
                  <option value="az">A–Z</option>
                  <option value="count">Most Questions</option>
                  <option value="progress">Progress</option>
                </select>
              </div>
              <FilterPills options={[{id:'',label:'All'}, ...categories.map(c=>({id:c.id,label:c.name}))]}
                active={selectedCategory||''} onChange={id => setSelectedCategory(id||null)} />
            </motion.div>

            {renderContent()}

          </div>
        </div>
      </AppLayout>

      {/* Channel detail modal */}
      <AnimatePresence>
        {selectedChannel && (
          <ChannelDetail
            channel={selectedChannel}
            questionCount={questionCounts[selectedChannel.id] || 0}
            isSubscribed={isSubscribed(selectedChannel.id)}
            onToggle={() => toggleSubscription(selectedChannel.id)}
            onNavigate={() => { navigate(`/channel/${selectedChannel.id}`); setSelectedChannel(null); }}
            onClose={() => setSelectedChannel(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
