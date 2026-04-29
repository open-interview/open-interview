/**
 * All Channels - Google Material Design 3 Style
 * Browse and subscribe to topics with clean, modern UI
 */

import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '../components/layout/AppLayout';
import { allChannelsConfig, categories, ChannelConfig } from '../lib/channels-config';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { useChannelStats } from '../hooks/use-stats';
import { useProgress } from '../hooks/use-progress';
import { SEOHead } from '../components/SEOHead';
import {
  Search, Check, Plus, X,
  BookOpen, Code, Cloud, Database, Brain, Shield, TestTube,
  Smartphone, Users, Award, Terminal, Layers, Cpu, Server,
  Activity, Box, Network, Sparkles, TrendingUp, Eye
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  'book-open': BookOpen,
  'code': Code,
  'cloud': Cloud,
  'database': Database,
  'brain': Brain,
  'shield': Shield,
  'check-circle': TestTube,
  'smartphone': Smartphone,
  'users': Users,
  'award': Award,
  'terminal': Terminal,
  'layers': Layers,
  'cpu': Cpu,
  'server': Server,
  'activity': Activity,
  'box': Box,
  'network': Network,
  'workflow': Layers,
  'infinity': TrendingUp,
  'layout': Layers,
  'sparkles': Sparkles,
};

const categoryColors: Record<string, { bg: string; text: string; accent: string }> = {
  fundamentals: { bg: '#e8def8', text: '#21005d', accent: '#6750a4' },
  engineering: { bg: '#e8def8', text: '#21005d', accent: '#6750a4' },
  cloud: { bg: '#cfe7f0', text: '#00202f', accent: '#006874' },
  data: { bg: '#dce8f0', text: '#00202f', accent: '#006874' },
  ai: { bg: '#f4d4d4', text: '#2e0000', accent: '#8c1b1b' },
  testing: { bg: '#d4f0d4', text: '#002200', accent: '#1b8c1b' },
  security: { bg: '#f4d4d4', text: '#2e0000', accent: '#8c1b1b' },
  mobile: { bg: '#e8def8', text: '#21005d', accent: '#6750a4' },
  management: { bg: '#fce8e8', text: '#2e0000', accent: '#8c1b1b' },
  certification: { bg: '#fff4d4', text: '#2e2000', accent: '#8c6a1b' },
};

const categoryOrder = [
  'fundamentals', 'engineering', 'cloud', 'data', 'ai',
  'testing', 'security', 'mobile', 'management', 'certification'
];

function CategoryIcon({ icon, color }: { icon: string; color: string }) {
  const IconComponent = iconMap[icon] || BookOpen;
  return <IconComponent className="w-5 h-5" style={{ color }} />;
}

export default function AllChannelsMD3() {
  const [, navigate] = useLocation();
  const { isSubscribed, toggleSubscription, preferences } = useUserPreferences();
  const { stats } = useChannelStats();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [subscribedIds, setSubscribedIds] = useState<Set<string>>(new Set(preferences.subscribedChannels));

  useEffect(() => {
    setSubscribedIds(new Set(preferences.subscribedChannels));
  }, [preferences.subscribedChannels]);

  const questionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    stats.forEach(s => { counts[s.id] = s.total; });
    return counts;
  }, [stats]);

  const filteredChannels = useMemo(() => {
    return allChannelsConfig.filter(ch => {
      const matchesSearch = searchQuery.length < 2 || 
        ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ch.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || ch.category === selectedCategory;
      return matchesSearch && matchesCategory;
    }).sort((a, b) => {
      const aSub = subscribedIds.has(a.id) ? 0 : 1;
      const bSub = subscribedIds.has(b.id) ? 0 : 1;
      if (aSub !== bSub) return aSub - bSub;
      return a.name.localeCompare(b.name);
    });
  }, [searchQuery, selectedCategory, subscribedIds]);

  const groupedChannels = useMemo(() => {
    const groups: Record<string, ChannelConfig[]> = {};
    categoryOrder.forEach(cat => { groups[cat] = []; });
    
    filteredChannels.forEach(ch => {
      const cat = ch.category || 'certification';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(ch);
    });
    
    return Object.entries(groups)
      .filter(([_, channels]) => channels.length > 0)
      .map(([category, channels]) => {
        const catInfo = categories.find(c => c.id === category);
        return {
          id: category,
          name: catInfo?.name || category,
          icon: catInfo?.icon || 'book-open',
          channels
        };
      });
  }, [filteredChannels]);

  const subscribedCount = subscribedIds.size;
  const totalCount = allChannelsConfig.length;

  return (
    <>
      <SEOHead
        title="Browse Channels - Level Up Your Skills"
        description="Explore all topics and start learning. Frontend, backend, DevOps, and more."
        canonical="https://open-interview.github.io/channels"
      />
      <AppLayout fullWidth>
        <div className="min-h-screen bg-background text-foreground">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-normal tracking-tight mb-2">Explore Channels</h1>
              <p className="text-muted-foreground">
                {subscribedCount > 0 
                  ? `${subscribedCount} of ${totalCount} channels subscribed`
                  : `${totalCount} channels available`
                }
              </p>
            </div>

            {/* Search Bar - Material Design 3 style */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9AA0A6]" />
              <input
                type="text"
                placeholder="Search channels..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-[46px] bg-[#F1F3F4] dark:bg-[#303134] rounded-full pl-12 pr-4 text-base focus:outline-none focus-visible:ring-2 focus:visible:ring-primary/30 transition-all placeholder:text-[#9AA0A6] text-foreground"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
              <FilterChip 
                active={!selectedCategory} 
                onClick={() => setSelectedCategory(null)}
              >
                All
              </FilterChip>
              {categories.map(cat => (
                <FilterChip
                  key={cat.id}
                  active={selectedCategory === cat.id}
                  onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                  color={categoryColors[cat.id]}
                >
                  {cat.name}
                </FilterChip>
              ))}
            </div>

            {/* Empty State */}
            {filteredChannels.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <Search className="w-5 h-5 mx-auto mb-4 text-[#9AA0A6]/30" />
                <h3 className="text-xl font-medium mb-2">No channels found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filter
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}
                  className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium"
                >
                  Clear filters
                </button>
              </motion.div>
            )}

            {/* Channel Grid */}
            {selectedCategory ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredChannels.map((channel, index) => (
                    <ChannelCardMD3
                      key={channel.id}
                      channel={channel}
                      questionCount={questionCounts[channel.id] || 0}
                      isSubscribed={subscribedIds.has(channel.id)}
                      onToggle={() => toggleSubscription(channel.id)}
                      onNavigate={() => navigate(`/channel/${channel.id}`)}
                      index={index}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="space-y-10">
                {groupedChannels.map(group => (
                  <div key={group.id}>
                    <div className="flex items-center gap-3 mb-4">
                      <div 
                        className="p-2 rounded-xl"
                        style={{ backgroundColor: categoryColors[group.id]?.bg }}
                      >
                        <CategoryIcon 
                          icon={group.icon} 
                          color={categoryColors[group.id]?.accent || '#6750a4'} 
                        />
                      </div>
                      <div>
                        <h2 className="text-lg font-medium">{group.name}</h2>
                        <p className="text-sm text-muted-foreground">
                          {group.channels.length} channels
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      <AnimatePresence mode="popLayout">
                        {group.channels.map((channel, index) => (
                          <ChannelCardMD3
                            key={channel.id}
                            channel={channel}
                            questionCount={questionCounts[channel.id] || 0}
                            isSubscribed={subscribedIds.has(channel.id)}
                            onToggle={() => toggleSubscription(channel.id)}
                            onNavigate={() => navigate(`/channel/${channel.id}`)}
                            index={index}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </>
  );
}

function FilterChip({ 
  children, 
  active, 
  onClick,
  color
}: { 
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  color?: { bg: string; text: string; accent: string };
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap
        ${active 
          ? 'bg-[var(--color-accent-violet)] text-white shadow-md' 
          : 'bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-foreground'
        }
      `}
      style={active && color ? { 
        backgroundColor: color.accent,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      } : undefined}
    >
      {children}
    </button>
  );
}

function ChannelCardMD3({ 
  channel, 
  questionCount,
  isSubscribed, 
  onToggle,
  onNavigate,
  index
}: { 
  channel: ChannelConfig;
  questionCount: number;
  isSubscribed: boolean;
  onToggle: () => void;
  onNavigate: () => void;
  index: number;
}) {
  const { completed } = useProgress(channel.id);
  const progress = questionCount > 0 
    ? Math.min(100, Math.round((completed.length / questionCount) * 100)) 
    : 0;
  
  const colors = categoryColors[channel.category] || categoryColors.certification;
  const Icon = iconMap[channel.icon] || BookOpen;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: index * 0.02 }}
      whileHover={{ y: -2 }}
      onClick={onNavigate}
      className={`
        group relative bg-[var(--surface-2)] rounded-xl p-5 cursor-pointer 
        transition-all duration-200
        ${isSubscribed 
          ? 'ring-2' 
          : 'hover:bg-[var(--surface-3)]'
        }
      `}
      style={isSubscribed ? { 
        ringColor: colors.accent,
        boxShadow: `0 2px 12px ${colors.accent}20`
      } : {
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
      }}
    >
      {/* Content */}
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div 
            className="p-2.5 rounded-xl"
            style={{ backgroundColor: colors.bg }}
          >
            <Icon className="w-5 h-5" style={{ color: colors.accent }} />
          </div>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={e => { e.stopPropagation(); onToggle(); }}
            className={`
              p-2 rounded-full transition-all
              ${isSubscribed 
                ? 'bg-[var(--color-accent-violet)] text-white' 
                : 'bg-[var(--surface-3)] text-muted-foreground hover:text-foreground'
              }
            `}
          >
            {isSubscribed ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </motion.button>
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="font-medium leading-tight mb-1 group-hover:text-[var(--color-accent-violet)] transition-colors">
            {channel.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {channel.description}
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Eye className="w-4 h-4" />
            {questionCount} questions
          </span>
          {isSubscribed && progress > 0 && (
            <span className="font-medium" style={{ color: colors.accent }}>
              {progress}%
            </span>
          )}
        </div>

        {/* Progress Bar */}
        {isSubscribed && progress > 0 && (
          <div className="h-1.5 bg-[var(--surface-4)] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ backgroundColor: colors.accent }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}