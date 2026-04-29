/**
 * Answer History Page
 * 
 * Shows a chronological view of all questions the user has answered
 * across all channels. Uses Google Material Design 3 styling.
 */

import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { 
  History, Clock, Filter, Download, Search,
  CheckCircle, Calendar, TrendingUp, BarChart3,
  ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { AppLayout } from '../components/layout/AppLayout';
import { ProgressTabBar } from '../components/ProgressTabBar';
import { allChannelsConfig } from '../lib/channels-config';
import { getQuestionById } from '../lib/questions-loader';

interface HistoryEntry {
  questionId: string;
  channelId: string;
  channelName: string;
  timestamp: number;
  date: string;
  status?: 'correct' | 'incorrect';
}

const ITEMS_PER_PAGE = 15;

export default function AnswerHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [currentPage, setCurrentPage] = useState(1);

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
                  date: new Date(entry.timestamp).toISOString().split('T')[0]
                });
              });
            }
          } catch (e) {
            console.error(`Failed to parse history for ${channelId}:`, e);
          }
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
    
    if (selectedChannel !== 'all') {
      filtered = filtered.filter(h => h.channelId === selectedChannel);
    }
    
    if (dateRange !== 'all') {
      const now = Date.now();
      const cutoff = {
        today: now - 24 * 60 * 60 * 1000,
        week: now - 7 * 24 * 60 * 60 * 1000,
        month: now - 30 * 24 * 60 * 60 * 1000,
      }[dateRange];
      
      filtered = filtered.filter(h => h.timestamp >= cutoff);
    }
    
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

  const paginatedHistory = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredHistory.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredHistory, currentPage]);

  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedChannel, dateRange, searchQuery]);

  const stats = useMemo(() => {
    const totalAnswered = history.length;
    const channelsUsed = new Set(history.map(h => h.channelId)).size;
    
    const last7Days = history.filter(h => h.timestamp >= Date.now() - 7 * 24 * 60 * 60 * 1000);
    const questionsPerDay = last7Days.length / 7;
    
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

  const groupedByDate = useMemo(() => {
    const groups: Record<string, HistoryEntry[]> = {};
    paginatedHistory.forEach(entry => {
      if (!groups[entry.date]) {
        groups[entry.date] = [];
      }
      groups[entry.date].push(entry);
    });
    return groups;
  }, [paginatedHistory]);

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (dateStr === today.toISOString().split('T')[0]) return 'Today';
    if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  return (
    <AppLayout fullWidth>
      <SEOHead 
        title="Answer History - CodeReels"
        description="View your complete question answering history across all channels"
      />
      
      <div className="min-h-screen bg-surface-container-low pb-24 pb-safe lg:pb-8 pt-14 lg:pt-0">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <ProgressTabBar activeTab="history" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-primary-container flex items-center justify-center">
                <History className="w-6 h-6 text-on-primary-container" />
              </div>
              <div>
                <h1 className="text-3xl font-medium tracking-tight">Answer History</h1>
                <p className="text-on-surface-variant">Track your learning journey</p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <MaterialStatCard
              icon={<CheckCircle className="w-5 h-5" />}
              label="Total Answered"
              value={stats.totalAnswered}
            />
            <MaterialStatCard
              icon={<BarChart3 className="w-5 h-5" />}
              label="Channels Used"
              value={stats.channelsUsed}
            />
            <MaterialStatCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Per Day (7d avg)"
              value={stats.questionsPerDay}
            />
            <MaterialStatCard
              icon={<Calendar className="w-5 h-5" />}
              label="Current Streak"
              value={`${stats.currentStreak}d`}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-surface-container-high rounded-2xl p-4 mb-6"
          >
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9AA0A6]" />
                   <input
                    type="text"
                    placeholder="Search questions or channels..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="history-search-input"
                    aria-label="Search questions or channels in your answer history"
                    className="w-full pl-11 pr-10 h-[46px] min-h-[48px] bg-[#F1F3F4] dark:bg-[#303134] rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary placeholder:text-[#9AA0A6] text-foreground text-base"
                  />
                {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search query"
                  className="absolute right-3 top-1/2 -translate-y-1/2 min-w-[48px] min-h-[48px] flex items-center justify-center text-on-surface-variant hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
                >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                data-testid="history-channel-filter"
                aria-label="Filter history by channel"
                className="px-4 py-2.5 bg-surface border border-on-surface-variant/20 rounded-full focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary cursor-pointer text-base min-w-[140px] min-h-[48px]"
              >
                <option value="all">All ({history.length})</option>
                {channels.map(channel => (
                  <option key={channel.id} value={channel.id}>
                    {channel.name} ({channel.count})
                  </option>
                ))}
              </select>

              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                data-testid="history-date-filter"
                aria-label="Filter history by date range"
                className="px-4 py-2.5 bg-surface border border-on-surface-variant/20 rounded-full focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary cursor-pointer text-base min-h-[48px]"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>

              <button
                onClick={exportHistory}
                data-testid="history-export-button"
                aria-label="Export answer history as JSON file"
                className="px-4 py-2.5 bg-primary text-on-primary rounded-full hover:bg-primary/90 transition-colors duration-150 flex items-center gap-2 cursor-pointer text-base font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 min-h-[48px]"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </motion.div>

           {loading ? (
            <div className="flex items-center justify-center py-12" role="status" aria-label="Loading answer history">
              <div className="animate-spin rounded-full min-h-[48px] h-8 min-w-[48px] w-8 border-b-2 border-primary" aria-hidden="true"></div>
              <span className="sr-only">Loading your answer history...</span>
            </div>
          ) : filteredHistory.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary-container flex items-center justify-center mx-auto mb-4">
                <History className="min-w-[48px] w-8 min-h-[48px] h-8 text-on-primary-container" />
              </div>
              <h3 className="text-lg font-medium mb-2">No History Found</h3>
              <p className="text-on-surface-variant text-base mb-6">
                {history.length === 0 
                  ? "Start answering questions to build your history!"
                  : "Try adjusting your filters to see more results."}
              </p>
               {history.length === 0 && (
                   <a
                    href="/"
                    aria-label="Browse channels to start answering questions"
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary rounded-full hover:bg-primary/90 transition-colors duration-150 cursor-pointer font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 min-h-[48px]"
                  >
                   Browse Channels
                 </a>
               )}
            </motion.div>
           ) : (
             <>
               <div 
                 className="bg-surface-container-high rounded-2xl p-4 mb-4"
                 role="region"
                 aria-label="Answer history timeline"
                 aria-live="polite"
               >
                 {Object.entries(groupedByDate).map(([date, entries]) => (
                   <div key={date} className="mb-6 last:mb-0">
                     <div className="text-base font-medium text-on-surface-variant mb-3 sticky top-0 bg-surface-container-high py-2">
                       {formatDateHeader(date)}
                     </div>
                     <div className="space-y-0" role="list" aria-label={`Answers from ${formatDateHeader(date)}`}>
                       {entries.map((entry, idx) => (
                         <TimelineItem 
                           key={`${entry.questionId}-${entry.timestamp}`} 
                           entry={entry} 
                           isFirst={idx === 0}
                           isLast={idx === entries.length - 1}
                         />
                       ))}
                     </div>
                   </div>
                 ))}
               </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-2 py-4">
                <div className="text-base text-foreground/70">
                     Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredHistory.length)} of {filteredHistory.length}
                   </div>
                  <div className="flex items-center gap-2">
                   <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        aria-label="Previous page"
                        className="min-w-[48px] min-h-[48px] w-8 h-8 rounded-full flex items-center justify-center bg-surface-container-high hover:bg-surface-container hover:shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                       <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                     </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                        <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              aria-label={`Page ${pageNum}`}
                              aria-current={currentPage === pageNum ? 'page' : undefined}
                              className={`min-w-[48px] min-h-[48px] w-8 h-8 rounded-full text-base flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                currentPage === pageNum
                                  ? 'bg-primary text-on-primary'
                                  : 'hover:bg-surface-container'
                              }`}
                            >
                             {pageNum}
                           </button>
                        );
                      })}
                    </div>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        aria-label="Next page"
                        className="min-w-[48px] min-h-[48px] w-8 h-8 rounded-full flex items-center justify-center bg-surface-container-high hover:bg-surface-container hover:shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                       <ChevronRight className="w-5 h-5" aria-hidden="true" />
                     </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function MaterialStatCard({ icon, label, value }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-surface-container-high rounded-2xl p-4 hover:shadow-md transition-shadow"
    >
      <div className="min-w-[48px] w-10 min-h-[48px] h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center mb-3">
        {icon}
      </div>
       <div className="text-2xl font-medium">{value}</div>
       <div className="text-base text-on-surface-variant">{label}</div>
    </motion.div>
  );
}

function TimelineItem({ entry, isFirst, isLast }: { 
  entry: HistoryEntry; 
  isFirst: boolean;
  isLast: boolean;
}) {
  const [, setLocation] = useLocation();
  const question = getQuestionById(entry.questionId);
  const displayText = question?.question ?? entry.questionId;

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true 
    });
  };

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

  const handleClick = () => {
    if (question) setLocation(`/channel/${entry.channelId}?q=${entry.questionId}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      data-testid={`history-item-${entry.questionId}`}
      role="listitem"
      className="relative flex gap-0 group"
    >
       <div className="flex flex-col items-center">
         <div className={`w-3 h-3 rounded-full bg-primary-container border-2 border-surface-container-high z-10 ${!isFirst ? 'mt-4' : ''}`} />
         {!isLast && <div className="w-0.5 h-full bg-outline-variant/30 absolute top-3" />}
       </div>
       <div className="flex-1 pb-4 ml-4">
         <div 
           role="button"
           tabIndex={0}
           aria-label={`View question: ${displayText}`}
           onClick={handleClick}
           onKeyDown={handleKeyDown}
           className="bg-surface-container hover:bg-surface-container-high rounded-2xl p-4 cursor-pointer transition-all hover:shadow-md group-hover:translate-x-1 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none min-h-[48px]"
          >
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-base font-medium line-clamp-2">{displayText}</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-container text-base text-on-primary-container" aria-label={entry.status === 'incorrect' ? 'Incorrect answer' : 'Correct answer'}>
              <CheckCircle className="w-3 h-3" aria-hidden="true" />
              {entry.status === 'incorrect' ? 'Incorrect' : 'Correct'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-base text-foreground/70">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-tertiary-container" aria-hidden="true" />
              {entry.channelName}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              {formatTime(entry.timestamp)}
            </span>
            <span className="text-foreground/70">{timeAgo}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}