/**
 * Answer History Page
 * 
 * Shows a chronological view of all questions the user has answered
 * across all channels. Aggregates data from localStorage.
 */

import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { 
  History, Clock, Filter, Download, Search,
  CheckCircle, Calendar, TrendingUp, BarChart3
} from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { AppLayout } from '../components/layout/AppLayout';
import { allChannelsConfig } from '../lib/channels-config';
import { getQuestionById } from '../lib/questions-loader';

interface HistoryEntry {
  questionId: string;
  channelId: string;
  channelName: string;
  timestamp: number;
  date: string;
}

export default function AnswerHistory() {
  const [, setLocation] = useLocation();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Load all history from localStorage
  useEffect(() => {
    const loadHistory = () => {
      const allHistory: HistoryEntry[] = [];
      
      // Scan all localStorage keys for history-*
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('history-')) {
          const channelId = key.replace('history-', '');
          const channelConfig = allChannelsConfig.find(c => c.id === channelId);
          const channelName = channelConfig?.name || channelId;
          
          try {
            const data = localStorage.getItem(key);
            if (data) {
              const entries: { questionId: string; timestamp: number }[] = JSON.parse(data);
              entries.forEach(entry => {
                allHistory.push({
                  questionId: entry.questionId,
                  channelId,
                  channelName,
                  timestamp: entry.timestamp,
                  date: new Date(entry.timestamp).toISOString().split('T')[0]
                });
              });
            }
          } catch (e) {
            console.error(`Failed to parse history for ${channelId}:`, e);
          }
        }
      });
      
      // Sort by timestamp (newest first)
      allHistory.sort((a, b) => b.timestamp - a.timestamp);
      
      setHistory(allHistory);
      setLoading(false);
    };
    
    loadHistory();
  }, []);

  // Filter history
  const filteredHistory = useMemo(() => {
    let filtered = history;
    
    // Filter by channel
    if (selectedChannel !== 'all') {
      filtered = filtered.filter(h => h.channelId === selectedChannel);
    }
    
    // Filter by date range
    if (dateRange !== 'all') {
      const now = Date.now();
      const cutoff = {
        today: now - 24 * 60 * 60 * 1000,
        week: now - 7 * 24 * 60 * 60 * 1000,
        month: now - 30 * 24 * 60 * 60 * 1000,
      }[dateRange];
      
      filtered = filtered.filter(h => h.timestamp >= cutoff);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(h => {
        const question = getQuestionById(h.questionId);
        const displayText = question?.question ?? h.questionId;
        return displayText.toLowerCase().includes(query) ||
          h.channelName.toLowerCase().includes(query);
      });
    }
    
    return filtered;
  }, [history, selectedChannel, dateRange, searchQuery]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalAnswered = history.length;
    const channelsUsed = new Set(history.map(h => h.channelId)).size;
    
    // Questions per day (last 7 days)
    const last7Days = history.filter(h => h.timestamp >= Date.now() - 7 * 24 * 60 * 60 * 1000);
    const questionsPerDay = last7Days.length / 7;
    
    // Current streak
    const dates = Array.from(new Set(history.map(h => h.date))).sort().reverse();
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    
    for (let i = 0; i < dates.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      const expected = expectedDate.toISOString().split('T')[0];
      
      if (dates[i] === expected) {
        streak++;
      } else {
        break;
      }
    }
    
    return {
      totalAnswered,
      channelsUsed,
      questionsPerDay: questionsPerDay.toFixed(1),
      currentStreak: streak
    };
  }, [history]);

  // Export history as JSON
  const exportHistory = () => {
    const dataStr = JSON.stringify(history, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `answer-history-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Get unique channels from history
  const channels = useMemo(() => {
    const channelIds = Array.from(new Set(history.map(h => h.channelId)));
    return channelIds.map(id => {
      const config = allChannelsConfig.find(c => c.id === id);
      return {
        id,
        name: config?.name || id,
        count: history.filter(h => h.channelId === id).length
      };
    }).sort((a, b) => b.count - a.count);
  }, [history]);

  return (
    <AppLayout fullWidth>
      <SEOHead 
        title="Answer History - CodeReels"
        description="View your complete question answering history across all channels"
      />
      
      <div className="min-h-screen bg-background pb-24 pb-safe lg:pb-8 pt-14 lg:pt-0">
        <div className="max-w-6xl mx-auto px-4 py-6">
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <History className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Answer History</h1>
                <p className="text-muted-foreground">Track your learning journey</p>
              </div>
            </div>
          </motion.div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={<CheckCircle className="w-5 h-5" />}
              label="Total Answered"
              value={stats.totalAnswered}
              color="text-green-500"
              bgColor="bg-green-500/10"
            />
            <StatCard
              icon={<BarChart3 className="w-5 h-5" />}
              label="Channels Used"
              value={stats.channelsUsed}
              color="text-blue-500"
              bgColor="bg-blue-500/10"
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Per Day (7d avg)"
              value={stats.questionsPerDay}
              color="text-purple-500"
              bgColor="bg-purple-500/10"
            />
            <StatCard
              icon={<Calendar className="w-5 h-5" />}
              label="Current Streak"
              value={`${stats.currentStreak} days`}
              color="text-amber-500"
              bgColor="bg-amber-500/10"
            />
          </div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-xl p-4 mb-6"
          >
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by question text or channel..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="history-search-input"
                    className="w-full pl-10 pr-4 py-3 min-h-[44px] bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-base"
                  />
                </div>
              </div>

              {/* Channel Filter */}
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                data-testid="history-channel-filter"
                className="px-4 py-3 min-h-[44px] bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer text-base"
              >
                <option value="all">All Channels ({history.length})</option>
                {channels.map(channel => (
                  <option key={channel.id} value={channel.id}>
                    {channel.name} ({channel.count})
                  </option>
                ))}
              </select>

              {/* Date Range Filter */}
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                data-testid="history-date-filter"
                className="px-4 py-3 min-h-[44px] bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer text-base"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>

              {/* Export Button */}
              <button
                onClick={exportHistory}
                data-testid="history-export-button"
                className="px-4 py-3 min-h-[44px] bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors duration-150 flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </motion.div>

          {/* History List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredHistory.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <History className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No History Found</h3>
              <p className="text-muted-foreground text-base mb-6">
                {history.length === 0 
                  ? "Start answering questions to build your history!"
                  : "Try adjusting your filters to see more results."}
              </p>
              {history.length === 0 && (
                <button
                  onClick={() => setLocation('/channels')}
                  className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors duration-150 cursor-pointer font-medium"
                >
                  Start Your First Session
                </button>
              )}
            </motion.div>
          ) : (
            <div className="space-y-2">
              {filteredHistory.map((entry, index) => (
                <HistoryItem key={`${entry.questionId}-${entry.timestamp}`} entry={entry} index={index} />
              ))}
              <div className="flex gap-3 justify-center pt-6">
                <button
                  onClick={() => setLocation('/channels')}
                  className="px-6 py-3 min-h-[44px] bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors duration-150 cursor-pointer font-medium"
                >
                  Continue Practicing
                </button>
                <button
                  onClick={() => setLocation('/stats')}
                  className="px-6 py-3 min-h-[44px] bg-card border border-border rounded-lg hover:border-primary/50 transition-colors duration-150 cursor-pointer font-medium"
                >
                  View Stats
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({ icon, label, value, color, bgColor }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  bgColor: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card border border-border rounded-xl p-4"
    >
      <div className={`w-10 h-10 rounded-lg ${bgColor} ${color} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </motion.div>
  );
}

function HistoryItem({ entry, index }: { entry: HistoryEntry; index: number }) {
  const [, setLocation] = useLocation();
  const question = getQuestionById(entry.questionId);
  const displayText = question?.question ?? entry.questionId;

  const timeAgo = useMemo(() => {
    const now = Date.now();
    const diff = now - entry.timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(entry.timestamp).toLocaleDateString();
  }, [entry.timestamp]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      data-testid={`history-item-${entry.questionId}`}
      className="bg-card border border-border rounded-lg p-4 min-h-[44px] hover:border-primary/50 transition-colors duration-150 cursor-pointer"
      onClick={() => { if (question) setLocation(`/channel/${entry.channelId}?q=${entry.questionId}`); }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">{displayText}</div>
            <div className="text-xs text-muted-foreground">{entry.channelName}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
          <Clock className="w-3.5 h-3.5" />
          {timeAgo}
        </div>
      </div>
    </motion.div>
  );
}
