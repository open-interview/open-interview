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
  engineering:   'hsl(var(--primary))',
  cloud:         'hsl(var(--primary))',
  security:      'hsl(var(--destructive))',
  ai:            'hsl(var(--primary))',
  testing:       'hsl(142 76% 36%)',
  soft:          'hsl(38 92% 50%)',
  certification: 'hsl(38 92% 50%)',
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
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="hsl(var(--primary))" strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease-out' }} />
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
  const accent = categoryColors[channel.category] || 'hsl(var(--primary))';
  const isNew = Boolean(channel.addedAt && new Date(channel.addedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className="group relative p-5 bg-card border border-border rounded-2xl cursor-pointer hover:border-primary/40 transition-all duration-200 ease-out overflow-hidden shadow-xl focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
      whileHover={{ 
        y: -4,
      }}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />

      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />

      {/* Clay border for featured/subscribed */}
      {subscribed && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none border-2"
          style={{ borderColor: `hsl(var(--primary) / 0.4)`, background: `linear-gradient(135deg, hsl(var(--primary) / 0.08), transparent)` }}
        />
      )}

      {/* NEW badge */}
      {isNew && (
        <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-bold z-10 bg-primary text-primary-foreground">
          NEW
        </div>
      )}

      {/* Subscribed badge */}
      {subscribed && !isNew && (
        <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-bold z-10 bg-primary/20 border border-primary/30 text-primary">
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
              style={{ background: `hsl(var(--primary) / 0.18)`, border: `1px solid hsl(var(--primary) / 0.33)` }}>
              <Icon className="w-4 h-4" style={{ color: `hsl(var(--primary))` }} />
            </div>
          </div>
          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="text-xs text-foreground/70 capitalize">{channel.category}</div>
            <h3 className="text-base font-bold leading-tight line-clamp-2">{channel.name}</h3>
          </div>
        </div>

        {/* Description */}
        <p className="text-base text-foreground/70 line-clamp-2">{channel.description}</p>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-foreground/70">
          <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" />{questionCount}q</span>
          {subscribed && <span className="flex items-center gap-1"><BarChart2 className="w-3 h-3" />{progress}%</span>}
        </div>

        {/* Progress bar */}
        {subscribed && (
          <div className="h-1 rounded-full overflow-hidden bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full bg-primary"
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
                className="flex-1 min-h-[44px] rounded-2xl text-base font-bold transition-all duration-150 ease-out flex items-center justify-center gap-1.5 text-primary-foreground bg-primary cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
              >
                Continue <ChevronRight className="w-3.5 h-3.5" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={e => { e.stopPropagation(); toggleSubscription(channel.id); }}
                className="px-3 min-h-[44px] rounded-2xl transition-all duration-150 ease-out hover:bg-muted/80 border border-border text-foreground/70 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
                title="Unsubscribe"
              >
                <X className="w-3.5 h-3.5" />
              </motion.button>
            </>
          ) : (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={e => { e.stopPropagation(); toggleSubscription(channel.id); }}
              className="flex-1 min-h-[44px] rounded-2xl text-base font-bold transition-all duration-150 ease-out flex items-center justify-center gap-1.5 text-primary-foreground bg-primary cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
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
        <button onClick={() => setOpen(o => !o)} className="w-full min-h-[44px] flex items-center justify-between px-1 py-2 mb-3 group cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{meta.emoji}</span>
            <div className="text-left">
              <div className="text-base font-bold">{meta.label}</div>
              <div className="text-xs text-foreground/70">
                {channels.length} channels{subscribedCount > 0 ? ` · ${subscribedCount} subscribed` : ''}
              </div>
            </div>
          </div>
          <motion.div animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4 text-foreground/70" />
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
  const accent = categoryColors[channel.category] || 'hsl(var(--primary))';
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
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted/50 text-foreground/70 transition-colors duration-150 ease-out cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none">
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: `hsl(var(--primary) / 0.2)`, border: `1px solid hsl(var(--primary) / 0.3)` }}>
            <Icon className="w-7 h-7" style={{ color: `hsl(var(--primary))` }} />
          </div>
          <div>
            <div className="text-xs text-foreground/70 mb-0.5 capitalize">{channel.category}</div>
            <h2 className="text-lg font-bold leading-tight">{channel.name}</h2>
          </div>
        </div>

        <p className="text-base text-foreground/70 mb-5 leading-relaxed">{channel.description}</p>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {([
            { icon: BookOpen, label: 'Questions', value: questionCount },
            { icon: BarChart2, label: 'Progress',  value: `${progress}%` },
          ] as { icon: React.ElementType; label: string; value: string | number }[]).map(({ icon: I, label, value }) => (
            <div key={label} className="p-3 rounded-xl bg-muted/40 flex items-center gap-2.5">
              <I className="w-4 h-4 text-foreground/70 flex-shrink-0" />
                <div>
                    <div className="text-xs text-foreground/70">{label}</div>
                    <div className="text-base font-semibold">{value}</div>
                  </div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {subscribed && (
          <div className="mb-5 p-3 rounded-xl border" style={{ background: `hsl(var(--primary) / 0.1)`, borderColor: `hsl(var(--primary) / 0.2)` }}>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-foreground/70">Progress</span>
              <span className="font-semibold text-primary">{progress}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onToggle}
            className={`flex-1 min-h-[44px] rounded-xl text-base font-bold transition-all duration-150 ease-out flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none ${
              subscribed ? 'bg-muted border border-border hover:bg-muted/80 text-foreground' : 'text-primary-foreground bg-primary hover:opacity-90'
            }`}
          >
            {subscribed ? <><Check className="w-4 h-4" />Subscribed</> : <><Plus className="w-4 h-4" />Subscribe</>}
          </button>
          {subscribed && (
            <button
              onClick={onNavigate}
              className="flex-1 min-h-[44px] rounded-xl text-base font-bold text-primary-foreground bg-primary hover:opacity-90 transition-all duration-150 ease-out flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
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
    engineering:   { label: 'Engineering',  icon: Code,        color: 'hsl(var(--primary))' },
    cloud:         { label: 'Cloud',        icon: Cloud,       color: 'hsl(var(--primary))' },
    security:      { label: 'Security',     icon: Shield,      color: 'hsl(var(--destructive))' },
    ai:            { label: 'AI / ML',      icon: Brain,       color: 'hsl(var(--primary))' },
    testing:       { label: 'Testing',      icon: CheckCircle, color: 'hsl(142 76% 36%)' },
    soft:          { label: 'Soft Skills',  icon: Users,       color: 'hsl(38 92% 50%)' },
    data:          { label: 'Data',         icon: Database,    color: 'hsl(var(--primary))' },
    mobile:        { label: 'Mobile',       icon: Smartphone,  color: 'hsl(var(--primary))' },
    fundamentals:  { label: 'Fundamentals', icon: Layers,      color: 'hsl(var(--muted-foreground))' },
    management:    { label: 'Management',   icon: Users,       color: 'hsl(38 92% 50%)' },
    certification: { label: 'Certification',icon: Award,       color: 'hsl(38 92% 50%)' },
  };

  const renderContent = () => {
    if (channels.length === 0) {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <Search className="w-5 h-5 mx-auto mb-4 text-[#9AA0A6]" />
          <h3 className="text-xl font-bold mb-2">
            {subscribedOnly && hasSubscriptions ? 'No subscribed channels match' : 'No channels found'}
          </h3>
          <p className="text-base text-foreground/70 mb-4">
            {subscribedOnly && hasSubscriptions ? 'Try clearing filters or browse all topics' : 'Try a different search or category'}
          </p>
          {subscribedOnly && hasSubscriptions && (
            <button onClick={() => setSubscribedOnly(false)}
              className="px-4 py-2 rounded-xl text-base font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
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
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-muted text-foreground/70 border border-border">
                  Explore More Topics
                </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              )}
              <div className="flex items-center gap-2 mb-4">
                <CatIcon className="w-5 h-5" style={{ color: meta.color }} />
                <h2 className="text-lg font-bold">{meta.label}</h2>
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full ml-1" style={{ background: `${meta.color} / 0.18`, color: meta.color }}>
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
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none ${
                    subscribedOnly
                      ? 'bg-primary/15 border-primary text-primary'
                      : 'bg-muted/50 border-border text-foreground/70'
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
                  { label: 'Subscribed', value: subscribedCount,  colorClass: 'text-primary' },
                  { label: 'Total',      value: totalCount,        colorClass: 'text-primary' },
                  { label: 'Avg Progress', value: `${Math.round(preferences.subscribedChannels.reduce((acc, id) => {
                      const total = questionCounts[id] || 0;
                      if (!total) return acc;
                      try { const raw = localStorage.getItem(`progress-${id}`); return acc + (raw ? (JSON.parse(raw) as string[]).length / total * 100 : 0); } catch { return acc; }
                    }, 0) / Math.max(subscribedCount, 1))}%`, colorClass: 'text-[hsl(142_76%_36%)]' },
                ].map(({ label, value, colorClass }) => (
                  <div key={label} className="p-3 rounded-xl bg-muted/40 border border-border text-center">
                    <div className={`text-xl font-bold ${colorClass}`}>{value}</div>
                    <div className="text-xs text-foreground/70">{label}</div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Filter bar */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6 space-y-3">
              <div className="flex gap-3 flex-wrap">
                <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search channels…" />
                <select value={progressFilter} onChange={e => setProgressFilter(e.target.value as typeof progressFilter)}
                  className="min-h-[44px] px-3 py-2.5 rounded-xl text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 bg-muted border border-border text-foreground cursor-pointer">
                  <option value="all">All Progress</option>
                  <option value="not-started">Not Started</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)}
                  className="min-h-[44px] px-3 py-2.5 rounded-xl text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 bg-muted border border-border text-foreground cursor-pointer">
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
