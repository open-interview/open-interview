/**
 * Bookmarks Page
 * Shows all bookmarked/tagged questions across all channels
 */

import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { AppLayout } from '../components/layout/AppLayout';
import { SEOHead } from '../components/SEOHead';
import { EmptyState, Button } from '../components/unified';
import { PageHeader, SearchBar } from '@/components/ui/page';
import { getAllQuestions } from '../lib/questions-loader';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { ProgressStorage } from '../services/storage.service';
import { STORAGE_KEYS } from '../lib/constants';
import type { Question } from '../types';
import {
  Star, Trash2, Play, Filter,
  Zap, Target, Flame, Building2, CheckCircle,
  Cpu, Terminal, Layout, Database, Activity, GitBranch, Server,
  Layers, X, ArrowUpDown, ChevronDown, ChevronUp, ChevronLeft, ChevronRight
} from 'lucide-react';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';

const channelIcons: Record<string, React.ReactNode> = {
  'system-design': <Cpu className="w-4 h-4" />,
  'algorithms': <Terminal className="w-4 h-4" />,
  'frontend': <Layout className="w-4 h-4" />,
  'backend': <Server className="w-4 h-4" />,
  'database': <Database className="w-4 h-4" />,
  'devops': <GitBranch className="w-4 h-4" />,
  'sre': <Activity className="w-4 h-4" />,
  'default': <Layers className="w-4 h-4" />,
};

interface BookmarkedQuestion extends Question {
  channelId: string;
  savedAt: number;
}

const DIFFICULTY_CONFIG = {
  beginner:     { icon: Zap,    color: 'text-[var(--color-success)]',  bg: 'bg-[var(--color-success-container)]',  border: 'border-[var(--color-success)]/30',  label: 'Easy' },
  intermediate: { icon: Target, color: 'text-[var(--color-warning)]', bg: 'bg-[var(--color-warning-container)]', border: 'border-[var(--color-warning)]/30', label: 'Medium' },
  advanced:     { icon: Flame,  color: 'text-[var(--color-error)]',    bg: 'bg-[var(--color-error-container)]',    border: 'border-[var(--color-error)]/30',    label: 'Hard' },
} as const;

type SortKey = 'newest' | 'oldest' | 'topic';

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export default function Bookmarks() {
  const [, setLocation] = useLocation();
  const { getSubscribedChannels } = useUserPreferences();
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<BookmarkedQuestion[]>([]);
  const [search, setSearch] = useState('');
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [sort, setSort] = useState<SortKey>('newest');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
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
      const markedIds = ProgressStorage.getMarked(channelId);
      markedIds.forEach(questionId => {
        const question = allQuestions.find(q => q.id === questionId);
        if (question) {
          const savedKey = `bookmark-ts-${channelId}-${questionId}`;
          const storedTs = localStorage.getItem(savedKey);
          bookmarked.push({ ...question, channelId, savedAt: storedTs ? parseInt(storedTs, 10) : Date.now() });
        }
      });
    });

    setBookmarkedQuestions(bookmarked);
  }, []);

  const channelsWithBookmarks = useMemo(() => {
    return Array.from(new Set(bookmarkedQuestions.map(q => q.channelId)));
  }, [bookmarkedQuestions]);

  const filteredQuestions = useMemo(() => {
    let result = bookmarkedQuestions.filter(q => {
      if (filterChannel !== 'all' && q.channelId !== filterChannel) return false;
      if (filterDifficulty !== 'all' && q.difficulty !== filterDifficulty) return false;
      if (search.trim()) {
        const s = search.toLowerCase();
        if (!q.question.toLowerCase().includes(s) && !q.channelId.includes(s)) return false;
      }
      return true;
    });

    if (sort === 'newest') result = [...result].reverse();
    else if (sort === 'topic') result = [...result].sort((a, b) => a.channelId.localeCompare(b.channelId));

    return result;
  }, [bookmarkedQuestions, filterChannel, filterDifficulty, search, sort]);

  const removeBookmark = (question: BookmarkedQuestion) => {
    ProgressStorage.toggleMarked(question.channelId, question.id);
    setBookmarkedQuestions(prev => prev.filter(q => q.id !== question.id));
  };

  const goToQuestion = (question: BookmarkedQuestion) => {
    setLocation(`/channel/${question.channelId}/${question.id}`);
  };

  const hasFilters = filterChannel !== 'all' || filterDifficulty !== 'all' || search.trim();

  return (
    <>
      <SEOHead
        title="Bookmarked Questions - Code Reels"
        description="View and manage your bookmarked interview questions"
      />
      <AppLayout fullWidth>
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden pb-24 lg:pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <PageHeader
              title="Bookmarks"
              subtitle={`${bookmarkedQuestions.length} saved question${bookmarkedQuestions.length !== 1 ? 's' : ''}`}
            />

            <div className="max-w-3xl mx-auto">
              {/* Filter Bar */}
              {bookmarkedQuestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="flex flex-wrap gap-2 mb-5"
                >
                  <SearchBar value={search} onChange={setSearch} placeholder="Search bookmarks…" />

                   <select
                     value={filterChannel}
                     onChange={e => setFilterChannel(e.target.value)}
                     className="px-3 py-2 text-base rounded-lg outline-none cursor-pointer min-h-[44px] bg-[var(--surface-2)] border border-[var(--color-border)] text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:outline-none"
                   >
                     <option value="all">All Topics</option>
                     {channelsWithBookmarks.map(ch => (
                       <option key={ch} value={ch}>
                         {ch.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                       </option>
                     ))}
                   </select>

                   <select
                     value={filterDifficulty}
                     onChange={e => setFilterDifficulty(e.target.value)}
                     className="px-3 py-2 text-base rounded-lg outline-none cursor-pointer min-h-[44px] bg-[var(--surface-2)] border border-[var(--color-border)] text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:outline-none"
                   >
                     <option value="all">All Levels</option>
                     <option value="beginner">Easy</option>
                     <option value="intermediate">Medium</option>
                     <option value="advanced">Hard</option>
                   </select>

                   <select
                     value={sort}
                     onChange={e => setSort(e.target.value as SortKey)}
                     className="px-3 py-2 text-base rounded-lg outline-none cursor-pointer min-h-[44px] bg-[var(--surface-2)] border border-[var(--color-border)] text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:outline-none"
                   >
                     <option value="newest">Newest</option>
                     <option value="oldest">Oldest</option>
                     <option value="topic">By Topic</option>
                   </select>

                   {hasFilters && (
                     <button
                       onClick={() => { setSearch(''); setFilterChannel('all'); setFilterDifficulty('all'); }}
                       className="px-3 py-2 text-base flex items-center gap-1 rounded-lg transition-colors duration-150 hover:bg-white/5 cursor-pointer min-h-[44px] text-foreground/70 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:outline-none"
                     >
                       <X className="w-3.5 h-3.5" /> Clear
                     </button>
                   )}
                </motion.div>
              )}

              {/* Empty state */}
              {bookmarkedQuestions.length === 0 ? (
                <EmptyState
                  icon={<Star className="w-10 h-10" />}
                  title="No bookmarks yet"
                  description="Tap the star icon on any question to save it for later review"
                  action={<Button variant="primary" onClick={() => setLocation('/channels')}>Browse Questions</Button>}
                  size="lg"
                  animated={true}
                />
               ) : filteredQuestions.length === 0 ? (
                 <div className="text-center py-16">
                   <Filter className="w-8 h-8 mx-auto mb-3 opacity-30" />
                   <p className="text-base text-foreground/70">No questions match your filters</p>
                   <button
                     onClick={() => { setSearch(''); setFilterChannel('all'); setFilterDifficulty('all'); }}
                     className="mt-4 px-4 py-2 text-base rounded-lg transition-colors duration-150 hover:bg-white/5 cursor-pointer min-h-[44px] text-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:outline-none"
                   >
                     Clear filters
                   </button>
                 </div>
              ) : (
                <div className="space-y-3">
                  {filteredQuestions.map((question, index) => {
                     const diff = DIFFICULTY_CONFIG[question.difficulty as keyof typeof DIFFICULTY_CONFIG]
                       || { icon: Target, color: 'text-foreground/70', bg: 'bg-[var(--surface-2)]', border: 'border-[var(--color-border)]', label: 'Unknown' };
                    const DiffIcon = diff.icon;
                    const isCompleted = ProgressStorage.getCompleted(question.channelId).includes(question.id);
                    const isExpanded = expandedId === question.id;
                    const previewText = question.tldr ?? (question.answer ? question.answer.slice(0, 200) + '...' : '');
                    const currentIdx = isExpanded ? filteredQuestions.findIndex(q => q.id === expandedId) : -1;

                    const cardContent = (
                      <motion.div
                        key={question.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => goToQuestion(question)}
                         className="group rounded-2xl p-4 cursor-pointer transition-all duration-200 ease-out hover:scale-[1.01] active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:outline-none] bg-[var(--surface-2)] border border-[var(--color-border)] shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          {/* Star indicator */}
                           <div className="relative flex-shrink-0">
                            <div
                                className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--color-warning-container)] text-[var(--color-warning)]"
                              >
                                <Star className="w-4 h-4 fill-current" />
                              </div>
                           </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                               <span className="text-xs uppercase tracking-wider font-medium text-foreground/70">
                                 {question.channelId.split('-').join(' ')}
                               </span>
                              <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs border ${diff.bg} ${diff.color} ${diff.border}`}>
                                <DiffIcon className="w-3 h-3" />
                                {diff.label}
                              </span>
                               {isCompleted && (
                                 <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-[var(--color-success-container)] text-[var(--color-success)] border border-[var(--color-success)]/30">
                                   <CheckCircle className="w-3 h-3" />
                                   Done
                                 </span>
                               )}
                               <span className="text-xs ml-auto text-foreground/70">
                                 {timeAgo(question.savedAt)}
                               </span>
                            </div>

                              <h3 className="font-medium text-base line-clamp-2 mb-2 text-[var(--text-primary)]">
                                {question.question}
                              </h3>

                            {question.companies && question.companies.length > 0 && (
                              <div className="flex items-center gap-1.5">
                                 <Building2 className="w-3 h-3 flex-shrink-0 text-foreground/70" />
                                 <span className="text-xs text-foreground/70">
                                   {question.companies.slice(0, 3).join(', ')}
                                   {question.companies.length > 3 && ` +${question.companies.length - 3}`}
                                 </span>
                              </div>
                            )}
                          </div>

                          {/* Actions — min 44px touch targets */}
                          <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                              <button
                                onClick={e => { e.stopPropagation(); setExpandedId(isExpanded ? null : question.id); }}
                                className="w-11 h-11 flex items-center justify-center rounded-full transition-colors duration-150 hover:bg-white/10 cursor-pointer sm:hidden text-foreground/70 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:outline-none"
                                aria-label={isExpanded ? 'Collapse' : 'Expand'}
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={e => { e.stopPropagation(); removeBookmark(question); }}
                                className="w-11 h-11 flex items-center justify-center rounded-full transition-colors duration-150 hover:bg-[var(--color-error-container)] hover:text-[var(--color-error)] cursor-pointer text-foreground/70 focus-visible:ring-2 focus-visible:ring-[var(--color-error)] focus-visible:outline-none"
                                title="Remove bookmark"
                                aria-label="Remove bookmark"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={e => { e.stopPropagation(); goToQuestion(question); }}
                                className="w-11 h-11 flex items-center justify-center rounded-full transition-colors duration-150 hover:opacity-80 cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:outline-none bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                                title="Review question"
                                aria-label="Review question"
                              >
                                <Play className="w-4 h-4 fill-current" />
                              </button>
                          </div>
                        </div>

                         {/* Mobile inline detail panel */}
                         {isExpanded && previewText && (
                           <div className="mt-3 pt-3 border-t border-border sm:hidden" onClick={e => e.stopPropagation()}>
                             <p className="text-base leading-relaxed mb-2 text-foreground/70">{previewText}</p>
                             <button
                               onClick={() => goToQuestion(question)}
                               className="text-base text-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:outline-none"
                             >
                               Go to question →
                             </button>
                             <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
                               <button
                                 disabled={currentIdx <= 0}
                                 onClick={() => setExpandedId(filteredQuestions[currentIdx - 1].id)}
                                 className="flex items-center gap-1 px-2 py-1 text-base rounded transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 cursor-pointer text-foreground/70 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:outline-none"
                               >
                                 <ChevronLeft className="w-3.5 h-3.5" /> Prev
                               </button>
                               <span className="text-base text-foreground/70">{currentIdx + 1} / {filteredQuestions.length}</span>
                               <button
                                 disabled={currentIdx >= filteredQuestions.length - 1}
                                 onClick={() => setExpandedId(filteredQuestions[currentIdx + 1].id)}
                                 className="flex items-center gap-1 px-2 py-1 text-base rounded transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 cursor-pointer text-foreground/70 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:outline-none"
                               >
                                 Next <ChevronRight className="w-3.5 h-3.5" />
                               </button>
                             </div>
                           </div>
                         )}
                      </motion.div>
                    );

                    return (
                      <HoverCard key={question.id} openDelay={300}>
                        <HoverCardTrigger asChild>
                          {cardContent}
                        </HoverCardTrigger>
                       <HoverCardContent className="w-80 hidden sm:block" onClick={e => e.stopPropagation()}>
                           <div className="space-y-2">
                             <p className="text-base font-medium leading-snug">{question.question}</p>
                             {previewText && (
                               <p className="text-base text-foreground/70 leading-relaxed">{previewText}</p>
                             )}
                             <div className="flex items-center justify-between pt-1">
                               <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs border ${diff.bg} ${diff.color} ${diff.border}`}>
                                 <DiffIcon className="w-3 h-3" />
                                 {diff.label}
                               </span>
                               <button
                                 onClick={() => goToQuestion(question)}
                                 className="text-base text-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:outline-none"
                               >
                                 Go to question →
                               </button>
                             </div>
                           </div>
                         </HoverCardContent>
                      </HoverCard>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </AppLayout>
    </>
  );
}
