/**
 * Recommendations Component
 * 
 * Displays personalized recommendations based on user activity:
 * - Continue where you left off
 * - New questions in your channels
 * - Questions marked for review
 * - Explore related channels
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { 
  Sparkles, ArrowRight, BookOpen, Bell, Star, 
  Compass, ChevronRight, X, RefreshCw, TrendingUp
} from 'lucide-react';
import { RecommendationService, type Recommendation } from '../services/recommendation.service';
import { allChannelsConfig } from '../lib/channels-config';
import type { HistoryIndex } from './unified/QuestionHistory';

interface RecommendationsProps {
  channelQuestionCounts?: Record<string, number>;
  compact?: boolean;
  className?: string;
  onClose?: () => void;
}

// Cache for history index
let historyIndexCache: HistoryIndex | null = null;

async function loadHistoryIndex(): Promise<HistoryIndex | null> {
  if (historyIndexCache) return historyIndexCache;
  
  try {
    const res = await fetch('/data/history/index.json');
    if (res.ok) {
      const text = await res.text();
      if (text.startsWith('{')) {
        historyIndexCache = JSON.parse(text);
        return historyIndexCache;
      }
    }
  } catch {
    // Static file not available
  }
  return null;
}

function getChannelName(channelId: string): string {
  const channel = allChannelsConfig.find(c => c.id === channelId);
  return channel?.name || channelId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getChannelColor(channelId: string): string {
  const channel = allChannelsConfig.find(c => c.id === channelId);
  return channel?.color || 'text-gray-400';
}

const typeConfig: Record<Recommendation['type'], { 
  icon: typeof Sparkles; 
  label: string; 
  bg: string; 
  border: string;
  text: string;
}> = {
  continue: { 
    icon: BookOpen, 
    label: 'Continue', 
    bg: 'bg-blue-500/10', 
    border: 'border-blue-500/30',
    text: 'text-blue-400'
  },
  new_content: { 
    icon: Bell, 
    label: 'New', 
    bg: 'bg-green-500/10', 
    border: 'border-green-500/30',
    text: 'text-green-400'
  },
  review: { 
    icon: Star, 
    label: 'Review', 
    bg: 'bg-amber-500/10', 
    border: 'border-amber-500/30',
    text: 'text-amber-400'
  },
  explore: { 
    icon: Compass, 
    label: 'Explore', 
    bg: 'bg-purple-500/10', 
    border: 'border-purple-500/30',
    text: 'text-purple-400'
  },
};

export function Recommendations({ 
  channelQuestionCounts = {}, 
  compact = false,
  className = '',
  onClose 
}: RecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadRecommendations() {
      setLoading(true);
      try {
        const historyIndex = await loadHistoryIndex();
        const recs = await RecommendationService.generateRecommendations(
          historyIndex,
          channelQuestionCounts
        );
        setRecommendations(recs);
      } catch (e) {
        console.error('Failed to load recommendations:', e);
      }
      setLoading(false);
    }
    
    loadRecommendations();
  }, [channelQuestionCounts]);

  const visibleRecommendations = recommendations.filter(
    r => !dismissed.has(`${r.type}-${r.channelId}`)
  );

  const handleDismiss = (rec: Recommendation) => {
    setDismissed(prev => new Set(Array.from(prev).concat(`${rec.type}-${rec.channelId}`)));
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center gap-2 text-[#8b949e] py-4">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading recommendations...</span>
        </div>
      </div>
    );
  }

  if (visibleRecommendations.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-[#f0883e]" />
          <span className="text-sm font-medium text-[#e6edf3]">For You</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {visibleRecommendations.slice(0, 4).map((rec, index) => {
            const config = typeConfig[rec.type];
            const Icon = config.icon;
            
            return (
              <Link
                key={`${rec.type}-${rec.channelId}-${index}`}
                href={`/channel/${rec.channelId}`}
                onClick={() => RecommendationService.trackChannelVisit(rec.channelId)}
              >
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg border
                    ${config.bg} ${config.border} hover:bg-opacity-20
                    cursor-pointer transition-all whitespace-nowrap
                  `}
                >
                  <Icon className={`w-3.5 h-3.5 ${config.text}`} />
                  <span className="text-xs text-[#e6edf3]">
                    {getChannelName(rec.channelId)}
                  </span>
                  {rec.newCount && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
                      +{rec.newCount}
                    </span>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#f0883e] to-[#db6d28] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-[#e6edf3]">Recommended for You</h3>
            <p className="text-xs text-[#8b949e]">Based on your activity</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Recommendations List */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {visibleRecommendations.map((rec, index) => {
            const config = typeConfig[rec.type];
            const Icon = config.icon;
            
            return (
              <motion.div
                key={`${rec.type}-${rec.channelId}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  group relative rounded-xl border overflow-hidden
                  ${config.bg} ${config.border}
                  hover:border-opacity-60 transition-all
                `}
              >
                <Link
                  href={`/channel/${rec.channelId}`}
                  onClick={() => RecommendationService.trackChannelVisit(rec.channelId)}
                  className="flex items-center gap-3 p-3"
                >
                  {/* Icon */}
                  <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                    ${config.bg} border ${config.border}
                  `}>
                    <Icon className={`w-5 h-5 ${config.text}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider ${config.text}`}>
                        {config.label}
                      </span>
                      {rec.newCount && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 font-medium">
                          +{rec.newCount} new
                        </span>
                      )}
                    </div>
                    <h4 className="font-medium text-[#e6edf3] truncate">
                      {getChannelName(rec.channelId)}
                    </h4>
                    <p className="text-xs text-[#8b949e] truncate">
                      {rec.reason}
                    </p>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="w-5 h-5 text-[#6e7681] group-hover:text-[#8b949e] transition-colors flex-shrink-0" />
                </Link>

                {/* Dismiss button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDismiss(rec);
                  }}
                  className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 
                             hover:bg-[#21262d] text-[#6e7681] hover:text-[#8b949e] transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Engagement Summary */}
      <EngagementSummary className="mt-4" />
    </div>
  );
}

function EngagementSummary({ className = '' }: { className?: string }) {
  const summary = RecommendationService.getEngagementSummary();
  
  if (summary.totalChannelsVisited === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-4 p-3 rounded-lg bg-[#161b22] border border-[#30363d] ${className}`}>
      <TrendingUp className="w-4 h-4 text-[#3fb950]" />
      <div className="flex items-center gap-4 text-xs text-[#8b949e]">
        <span>
          <span className="text-[#e6edf3] font-medium">{summary.totalChannelsVisited}</span> channels explored
        </span>
        <span>
          <span className="text-[#e6edf3] font-medium">{summary.totalQuestionsCompleted}</span> completed
        </span>
        {summary.currentStreak > 0 && (
          <span>
            <span className="text-[#f0883e] font-medium">{summary.currentStreak}</span> day streak 🔥
          </span>
        )}
      </div>
    </div>
  );
}

export default Recommendations;
