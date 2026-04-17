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
  Bookmark, Trash2, Play, Filter,
  Zap, Target, Flame, Building2, CheckCircle,
  Cpu, Terminal, Layout, Database, Activity, GitBranch, Server,
  Layers, X, Search, ArrowUpDown
} from 'lucide-react';

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
  beginner:     { icon: Zap,    color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/30',  label: 'Easy' },
  intermediate: { icon: Target, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', label: 'Medium' },
  advanced:     { icon: Flame,  color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/30',    label: 'Hard' },
} as const;

type SortKey = 'newest' | 'oldest' | 'topic';

export default function Bookmarks() {
  const [, setLocation] = useLocation();
  const { getSubscribedChannels } = useUserPreferences();
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<BookmarkedQuestion[]>([]);
  const [search, setSearch] = useState('');
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [sort, setSort] = useState<SortKey>('newest');

  // Load all bookmarked questions
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
          bookmarked.push({ ...question, channelId, savedAt: Date.now() });
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
    else if (sort === 'oldest') { /* already in insertion order */ }
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
      <AppLayout>
        <div className="min-h-screen bg-background text-foreground">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <PageHeader title="Bookmarks" subtitle={`${bookmarkedQuestions.length} saved question${bookmarkedQuestions.length !== 1 ? 's' : ''}`} />
          <div className="max-w-3xl mx-auto">

          {/* Filter Bar */}
          {bookmarkedQuestions.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="flex flex-wrap gap-2 mb-5">
              {/* Search */}
              <SearchBar value={search} onChange={setSearch} placeholder="Search bookmarks…" />

              {/* Topic filter */}
              <select value={filterChannel} onChange={e => setFilterChannel(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg outline-none"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--color-border)', color: 'var(--text-primary)' }}>
                <option value="all">All Topics</option>
                {channelsWithBookmarks.map(ch => (
                  <option key={ch} value={ch}>
                    {ch.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </option>
                ))}
              </select>

              {/* Difficulty filter */}
              <select value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg outline-none"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--color-border)', color: 'var(--text-primary)' }}>
                <option value="all">All Levels</option>
                <option value="beginner">Easy</option>
                <option value="intermediate">Medium</option>
                <option value="advanced">Hard</option>
              </select>

              {/* Sort */}
              <select value={sort} onChange={e => setSort(e.target.value as SortKey)}
                className="px-3 py-2 text-sm rounded-lg outline-none"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--color-border)', color: 'var(--text-primary)' }}>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="topic">By Topic</option>
              </select>

              {/* Clear */}
              {hasFilters && (
                <button onClick={() => { setSearch(''); setFilterChannel('all'); setFilterDifficulty('all'); }}
                  className="px-3 py-2 text-sm flex items-center gap-1 rounded-lg transition-colors hover:bg-white/5"
                  style={{ color: 'var(--text-tertiary)' }}>
                  <X className="w-3.5 h-3.5" /> Clear
                </button>
              )}
            </motion.div>
          )}

          {/* Empty state */}
          {bookmarkedQuestions.length === 0 ? (
            <EmptyState
              icon={<Bookmark className="w-10 h-10" />}
              title="No bookmarks yet"
              description="Tap the bookmark icon on any question to save it for later review"
              action={<Button variant="primary" onClick={() => setLocation('/channels')}>Browse Questions</Button>}
              size="lg"
              animated={true}
            />
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-16">
              <Filter className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No questions match your filters</p>
              <button onClick={() => { setSearch(''); setFilterChannel('all'); setFilterDifficulty('all'); }}
                className="mt-3 text-sm underline" style={{ color: 'var(--color-accent-violet-light)' }}>
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredQuestions.map((question, index) => {
                const diff = DIFFICULTY_CONFIG[question.difficulty as keyof typeof DIFFICULTY_CONFIG]
                  || { icon: Target, color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-muted', label: 'Unknown' };
                const DiffIcon = diff.icon;
                const isCompleted = ProgressStorage.getCompleted(question.channelId).includes(question.id);

                return (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => goToQuestion(question)}
                    className="rounded-[var(--radius-xl)] p-4 cursor-pointer transition-all hover:border-violet-500/30"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--color-border)' }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Channel icon */}
                      <div className="p-2 rounded-lg flex-shrink-0 hidden sm:flex"
                        style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--color-accent-violet-light)' }}>
                        {channelIcons[question.channelId] || channelIcons.default}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Meta row */}
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                            {question.channelId.split('-').join(' ')}
                          </span>
                          <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs border ${diff.bg} ${diff.color} ${diff.border}`}>
                            <DiffIcon className="w-3 h-3" />
                            {diff.label}
                          </span>
                          {isCompleted && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-green-500/10 text-green-400 border border-green-500/30">
                              <CheckCircle className="w-3 h-3" />
                              Done
                            </span>
                          )}
                        </div>

                        {/* Question text */}
                        <h3 className="font-medium text-sm sm:text-base line-clamp-2 mb-2" style={{ color: 'var(--text-primary)' }}>
                          {question.question}
                        </h3>

                        {/* Companies */}
                        {question.companies && question.companies.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                              {question.companies.slice(0, 3).join(', ')}
                              {question.companies.length > 3 && ` +${question.companies.length - 3}`}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={e => { e.stopPropagation(); removeBookmark(question); }}
                          className="p-2 rounded-lg transition-colors hover:bg-red-500/10 hover:text-red-400"
                          style={{ color: 'var(--text-tertiary)' }}
                          title="Remove bookmark"
                          aria-label="Remove bookmark">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); goToQuestion(question); }}
                          className="p-2 rounded-lg transition-colors"
                          style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--color-accent-violet-light)' }}
                          title="Review question"
                          aria-label="Review question">
                          <Play className="w-4 h-4" fill="currentColor" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
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
