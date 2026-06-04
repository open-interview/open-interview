import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '../components/layout/AppLayout';
import { SEOHead } from '../components/SEOHead';
import { UnifiedFilterBar } from '@/components/ui/UnifiedFilterBar';
import { UnifiedEmptyState } from '@/components/ui/UnifiedEmptyState';
import { UnifiedCard, UnifiedCardContent } from '@/components/ui/UnifiedCard';
import { getAllQuestions } from '../lib/questions-loader';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { ProgressStorage } from '../services/storage.service';
import { STORAGE_KEYS } from '../lib/constants';
import type { Question } from '../types';
import { BookmarkItemSkeleton } from '@/components/ui/skeleton-loaders';
import { Bookmark, Play, Trash2, CheckCircle, X } from 'lucide-react';

interface BookmarkedQuestion extends Question {
  channelId: string;
  savedAt: number;
}

const DIFFICULTY_CONFIG: Record<string, { color: string; label: string }> = {
  beginner: { color: 'bg-green-500/20 text-green-400', label: 'Easy' },
  intermediate: { color: 'bg-yellow-500/20 text-yellow-400', label: 'Medium' },
  advanced: { color: 'bg-red-500/20 text-red-400', label: 'Hard' },
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

const FILTER_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'beginner', label: 'Easy' },
  { id: 'intermediate', label: 'Medium' },
  { id: 'advanced', label: 'Hard' },
];

export default function Bookmarks() {
  const [, setLocation] = useLocation();
  const { getSubscribedChannels } = useUserPreferences();
  const [mounted, setMounted] = useState(false);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<BookmarkedQuestion[]>([]);
  const [search, setSearch] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    try {
      const subscribedChannels = getSubscribedChannels();
      const allQuestions = getAllQuestions();
      const bookmarked: BookmarkedQuestion[] = [];

      const channelIds = new Set<string>();
      subscribedChannels.forEach(c => channelIds.add(c.id));
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(STORAGE_KEYS.MARKED_PREFIX)) {
          channelIds.add(key.replace(STORAGE_KEYS.MARKED_PREFIX, ''));
        }
      }

      channelIds.forEach(channelId => {
        try {
          const markedIds = ProgressStorage.getMarked(channelId);
          markedIds.forEach(questionId => {
            const question = allQuestions.find(q => q.id === questionId);
            if (question) {
              const savedKey = `bookmark-ts-${channelId}-${questionId}`;
              const storedTs = localStorage.getItem(savedKey);
              bookmarked.push({ ...question, channelId, savedAt: storedTs ? parseInt(storedTs, 10) : Date.now() });
            }
          });
        } catch { /* skip */ }
      });

      setBookmarkedQuestions(bookmarked);
    } catch {
      setBookmarkedQuestions([]);
    }
  }, []);

  const filteredQuestions = useMemo(() => {
    let result = bookmarkedQuestions.filter(q => {
      if (filterDifficulty !== 'all' && q.difficulty !== filterDifficulty) return false;
      if (search.trim()) {
        const s = search.toLowerCase();
        if (!q.question.toLowerCase().includes(s) && !q.channelId.includes(s)) return false;
      }
      return true;
    });
    return result.reverse();
  }, [bookmarkedQuestions, filterDifficulty, search]);

  const removeBookmark = (question: BookmarkedQuestion) => {
    ProgressStorage.toggleMarked(question.channelId, question.id);
    setBookmarkedQuestions(prev => prev.filter(q => q.id !== question.id));
    selected.delete(question.id);
  };

  const bulkDelete = () => {
    selected.forEach(id => {
      const q = bookmarkedQuestions.find(b => b.id === id);
      if (q) ProgressStorage.toggleMarked(q.channelId, q.id);
    });
    setBookmarkedQuestions(prev => prev.filter(q => !selected.has(q.id)));
    setSelected(new Set());
    setSelectMode(false);
  };

  const bulkReview = () => {
    const q = selected.values().next().value;
    const question = bookmarkedQuestions.find(b => b.id === q);
    if (question) setLocation(`/channel/${question.channelId}/${question.id}`);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const goToQuestion = (question: BookmarkedQuestion) => {
    setLocation(`/channel/${question.channelId}/${question.id}`);
  };

  const hasFilters = filterDifficulty !== 'all' || search.trim();
  const channels = Array.from(new Set(bookmarkedQuestions.map(q => q.channelId)));
  const channelFilterOptions = [
    { id: 'all', label: 'All Channels' },
    ...channels.map(ch => ({ id: ch, label: ch.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') })),
  ];
  const [channelFilter, setChannelFilter] = useState('all');

  const filteredByChannel = channelFilter === 'all'
    ? filteredQuestions
    : filteredQuestions.filter(q => q.channelId === channelFilter);

  return (
    <>
      <SEOHead title="Bookmarked Questions - Open Interview"
        description="View and manage your bookmarked interview questions" />
      <AppLayout fullWidth>
        <div className="min-h-screen pb-24 lg:pb-8">
          <div className="max-w-3xl mx-auto px-4 py-4 sm:py-6">
            {!mounted ? (
              <BookmarkItemSkeleton />
            ) : (
            <>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">Bookmarks</h1>
                <p className="text-sm text-muted-foreground">{bookmarkedQuestions.length} saved question{bookmarkedQuestions.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                {bookmarkedQuestions.length > 0 && (
                  <button
                    onClick={() => { setSelectMode(v => !v); setSelected(new Set()); }}
                    className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold bg-muted/50 border border-border text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    {selectMode ? 'Cancel' : 'Select'}
                  </button>
                )}
                <button
                  onClick={() => {
                    const ids = selected.size > 0 ? Array.from(selected) : filteredByChannel.map(q => q.id);
                    setLocation(`/review?bookmarks=${ids.join(',')}`);
                  }}
                  className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary to-cyan-500 text-black cursor-pointer"
                >
                  {selected.size > 0 ? `Review (${selected.size})` : 'Start Session'}
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            {bookmarkedQuestions.length > 0 && (
              <UnifiedFilterBar
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search bookmarks..."
                options={channelFilterOptions}
                activeFilter={channelFilter}
                onFilterChange={setChannelFilter}
                className="mb-2"
              />
            )}

            {/* Content */}
            {bookmarkedQuestions.length === 0 ? (
              <UnifiedEmptyState
                icon={<Bookmark className="w-6 h-6" />}
                title="No bookmarks yet"
                description="Tap the bookmark icon on any question to save it for later review"
                action={{ label: 'Browse Questions', onClick: () => setLocation('/channels') }}
              />
            ) : filteredByChannel.length === 0 ? (
              <UnifiedEmptyState
                icon={<X className="w-6 h-6" />}
                title="No matches"
                description={hasFilters ? 'Try different search terms or filters.' : 'Questions you bookmark will appear here.'}
                action={hasFilters ? { label: 'Clear filters', onClick: () => { setSearch(''); setFilterDifficulty('all'); setChannelFilter('all'); } } : undefined}
              />
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {filteredByChannel.map((question, index) => {
                    const diff = DIFFICULTY_CONFIG[question.difficulty] || { color: 'bg-muted text-muted-foreground', label: 'Unknown' };
                    const isCompleted = ProgressStorage.getCompleted(question.channelId).includes(question.id);
                    const isExpanded = expandedId === question.id;
                    const previewText = question.tldr ?? (question.answer ? question.answer.slice(0, 200) + '...' : '');

                    return (
                      <motion.div
                        key={question.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                      >
                        <UnifiedCard hover={!selectMode} compact>
                          <UnifiedCardContent>
                            <div className="flex items-start gap-3">
                              {selectMode && (
                                <input
                                  type="checkbox"
                                  checked={selected.has(question.id)}
                                  onChange={() => toggleSelect(question.id)}
                                  className="mt-1 w-5 h-5 rounded accent-primary cursor-pointer"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                                    {question.channelId}
                                  </span>
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${diff.color}`}>
                                    {diff.label}
                                  </span>
                                  {isCompleted && (
                                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-green-500/10 text-green-400 border border-green-500/30">
                                      <CheckCircle className="w-3 h-3" /> Done
                                    </span>
                                  )}
                                  <span className="text-[10px] text-muted-foreground ml-auto">
                                    {timeAgo(question.savedAt)}
                                  </span>
                                </div>
                                <h3
                                  className="font-medium text-sm sm:text-base line-clamp-2 mb-1 cursor-pointer hover:text-primary transition-colors"
                                  onClick={() => goToQuestion(question)}
                                >
                                  {question.question}
                                </h3>
                                {question.companies && question.companies.length > 0 && (
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    {question.companies.slice(0, 3).join(', ')}
                                    {question.companies.length > 3 && ` +${question.companies.length - 3}`}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {!selectMode && (
                                  <>
                                    <button
                                      onClick={() => setExpandedId(isExpanded ? null : question.id)}
                                      className="w-11 h-11 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground transition-colors sm:hidden cursor-pointer"
                                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                                    >
                                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d={isExpanded ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => removeBookmark(question)}
                                      className="w-11 h-11 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                                      title="Remove bookmark"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => goToQuestion(question)}
                                      className="w-11 h-11 flex items-center justify-center rounded-lg text-primary hover:opacity-80 transition-colors cursor-pointer"
                                      title="Review question"
                                    >
                                      <Play className="w-4 h-4" fill="currentColor" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {isExpanded && previewText && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                className="mt-3 pt-3 border-t border-border sm:hidden overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <p className="text-xs leading-relaxed mb-2 text-muted-foreground">{previewText}</p>
                                <button
                                  onClick={() => goToQuestion(question)}
                                  className="text-xs text-primary hover:opacity-80 transition-colors cursor-pointer"
                                >
                                  Go to question &rarr;
                                </button>
                              </motion.div>
                            )}
                          </UnifiedCardContent>
                        </UnifiedCard>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}

            {/* Bulk action bar */}
            <AnimatePresence>
              {selectMode && selected.size > 0 && (
                <motion.div
                  initial={{ y: 60, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 60, opacity: 0 }}
                  className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto"
                >
                  <div className="flex items-center gap-2 p-3 rounded-2xl bg-card border border-border shadow-lg backdrop-blur-xl">
                    <span className="text-sm font-semibold flex-1">{selected.size} selected</span>
                    <button onClick={bulkReview} className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary to-cyan-500 text-black cursor-pointer">Review</button>
                    <button onClick={bulkDelete} className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors cursor-pointer">Delete</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            </>
          )}
          </div>
        </div>
      </AppLayout>
    </>
  );
}
