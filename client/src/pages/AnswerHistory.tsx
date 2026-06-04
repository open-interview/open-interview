import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { History, Clock, CheckCircle, Download } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { AppLayout } from '../components/layout/AppLayout';
import { UnifiedFilterBar } from '@/components/ui/UnifiedFilterBar';
import { UnifiedEmptyState } from '@/components/ui/UnifiedEmptyState';
import { UnifiedCard, UnifiedCardContent } from '@/components/ui/UnifiedCard';
import { SkeletonList } from '@/components/ui/skeleton-loaders';
import { allChannelsConfig } from '../lib/channels-config';
import { getQuestionById } from '../lib/questions-loader';

interface HistoryEntry {
  questionId: string;
  channelId: string;
  channelName: string;
  timestamp: number;
  date: string;
}

const DATE_FILTERS = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
];

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

export default function AnswerHistory() {
  const [, setLocation] = useLocation();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  useEffect(() => {
    const loadHistory = () => {
      const allHistory: HistoryEntry[] = [];
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
                  date: new Date(entry.timestamp).toISOString().split('T')[0],
                });
              });
            }
          } catch { /* skip */ }
        }
      });
      allHistory.sort((a, b) => b.timestamp - a.timestamp);
      setHistory(allHistory);
      setLoading(false);
    };
    loadHistory();
  }, []);

  const filteredHistory = useMemo(() => {
    let filtered = history;
    if (selectedChannel !== 'all') filtered = filtered.filter(h => h.channelId === selectedChannel);

    if (dateRange !== 'all') {
      const now = Date.now();
      const cutoff = { today: now - 86400000, week: now - 604800000, month: now - 2592000000 }[dateRange];
      filtered = filtered.filter(h => h.timestamp >= cutoff!);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(h => {
        const question = getQuestionById(h.questionId);
        return (question?.question ?? h.questionId).toLowerCase().includes(q) || h.channelName.toLowerCase().includes(q);
      });
    }

    return filtered;
  }, [history, selectedChannel, dateRange, searchQuery]);

  const channels = useMemo(() => {
    const channelIds = Array.from(new Set(history.map(h => h.channelId)));
    return channelIds.map(id => ({
      id,
      name: allChannelsConfig.find(c => c.id === id)?.name || id,
      count: history.filter(h => h.channelId === id).length,
    })).sort((a, b) => b.count - a.count);
  }, [history]);

  const channelFilterOptions = [
    { id: 'all', label: `All Channels (${history.length})` },
    ...channels.map(ch => ({ id: ch.id, label: `${ch.name} (${ch.count})` })),
  ];

  const exportHistory = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `answer-history-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <AppLayout fullWidth>
        <div className="min-h-screen pb-24 lg:pb-8">
          <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
            <div className="h-8 w-48 bg-primary/10 rounded animate-pulse mb-4" />
            <SkeletonList count={6} />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <SEOHead title="Answer History" description="Track your learning journey across all channels"
        canonical="https://open-interview.github.io/history" />
      <AppLayout fullWidth>
        <div className="min-h-screen pb-24 lg:pb-8">
          <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center">
                  <History className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">History</h1>
                  <p className="text-sm text-muted-foreground">{history.length} answers</p>
                </div>
              </div>
              {history.length > 0 && (
                <button onClick={exportHistory}
                  className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold bg-muted/50 border border-border text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 cursor-pointer">
                  <Download className="w-4 h-4" /> Export
                </button>
              )}
            </div>

            {/* Filter bar */}
            {history.length > 0 && (
              <div className="space-y-2 mb-4">
                <UnifiedFilterBar
                  search={searchQuery}
                  onSearchChange={setSearchQuery}
                  searchPlaceholder="Search questions..."
                  options={channelFilterOptions}
                  activeFilter={selectedChannel}
                  onFilterChange={setSelectedChannel}
                />
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  {DATE_FILTERS.map(d => (
                    <button key={d.id} onClick={() => setDateRange(d.id)}
                      className={`shrink-0 px-4 h-10 rounded-full text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        dateRange === d.id
                          ? 'bg-primary text-white'
                          : 'bg-[var(--color-surface-2,var(--surface-raised))] border border-border text-muted-foreground hover:text-foreground'
                      }`}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {filteredHistory.length === 0 ? (
              <UnifiedEmptyState
                icon={<History className="w-6 h-6" />}
                title={history.length === 0 ? 'No History Found' : 'No matches'}
                description={history.length === 0
                  ? 'Start answering questions to build your history!'
                  : 'Try adjusting your filters to see more results.'}
                action={history.length === 0
                  ? { label: 'Browse Channels', onClick: () => setLocation('/') }
                  : undefined}
              />
            ) : (
              /* Desktop table */
              <div className="hidden md:block">
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                        <th className="text-left px-4 py-3 font-semibold">Question</th>
                        <th className="text-left px-4 py-3 font-semibold">Channel</th>
                        <th className="text-left px-4 py-3 font-semibold">Date</th>
                        <th className="text-right px-4 py-3 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistory.map((entry) => {
                        const question = getQuestionById(entry.questionId);
                        return (
                          <tr key={`${entry.questionId}-${entry.timestamp}`}
                            onClick={() => { if (question) setLocation(`/channel/${entry.channelId}?q=${entry.questionId}`); }}
                            className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer last:border-0">
                            <td className="px-4 py-3 font-medium truncate max-w-xs">{question?.question ?? entry.questionId}</td>
                            <td className="px-4 py-3 text-muted-foreground">{entry.channelName}</td>
                            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(entry.timestamp)}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button className="text-primary text-xs font-semibold hover:underline cursor-pointer">Review &rarr;</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Mobile list */}
            {filteredHistory.length > 0 && (
              <div className="md:hidden space-y-2">
                {filteredHistory.map((entry, index) => {
                  const question = getQuestionById(entry.questionId);
                  return (
                    <motion.div key={`${entry.questionId}-${entry.timestamp}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.015 }}>
                      <UnifiedCard hover compact className="cursor-pointer"
                        onClick={() => { if (question) setLocation(`/channel/${entry.channelId}?q=${entry.questionId}`); }}>
                        <UnifiedCardContent>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <CheckCircle className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm truncate">{question?.question ?? entry.questionId}</div>
                              <div className="text-xs text-muted-foreground">{entry.channelName}</div>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                              <Clock className="w-3 h-3" />{timeAgo(entry.timestamp)}
                            </div>
                          </div>
                        </UnifiedCardContent>
                      </UnifiedCard>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </>
  );
}
