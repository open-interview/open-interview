/**
 * Tests Page — revamped with filter/sort, pass/fail badges, difficulty, estimated time
 */

import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '../components/layout/AppLayout';
import { SEOHead } from '../components/SEOHead';
import {
  Test, loadTests, getAllTestProgress, getTestStats, checkAndExpireTests
} from '../lib/tests';
import {
  Target, Clock, CheckCircle, XCircle, Search, Star,
  AlertTriangle, ChevronRight, SlidersHorizontal, Settings2
} from 'lucide-react';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { PageHeader, SearchBar, FilterPills, StatCard, PageLoader } from '@/components/ui/page';

type FilterTab = 'all' | 'passed' | 'failed' | 'not-attempted';
type SortKey = 'name' | 'last-attempt' | 'score';

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner: 'text-[var(--color-difficulty-beginner)]',
  intermediate: 'text-[var(--color-difficulty-intermediate)]',
  advanced: 'text-[var(--color-difficulty-advanced)]',
};

function getDominantDifficulty(test: Test): string {
  const counts: Record<string, number> = {};
  for (const q of test.questions) {
    counts[q.difficulty] = (counts[q.difficulty] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'beginner';
}

function estimatedMinutes(count: number) {
  return Math.round((count * 1.5));
}

export default function TestsPage() {
  const [, setLocation] = useLocation();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterTab>('all');
  const [sort, setSort] = useState<SortKey>('name');
  const [showSort, setShowSort] = useState(false);
  const [subscribedOnly, setSubscribedOnly] = useState(true);
  const progress = getAllTestProgress();
  const stats = getTestStats();
  const { preferences } = useUserPreferences();
  const subscribedIds = new Set(preferences.subscribedChannels);

  useEffect(() => {
    (async () => {
      await checkAndExpireTests();
      setTests(await loadTests());
      setLoading(false);
    })();
  }, []);

  const passedCount = Object.values(progress).filter(p => p.passed && !p.expired).length;
  const failedCount = Object.values(progress).filter(p => !p.passed && !p.expired).length;
  const notStartedCount = tests.length - Object.keys(progress).filter(id => tests.some(t => t.channelId === id)).length;

  const filtered = useMemo(() => {
    let list = tests.filter(t =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.channelName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Subscribed-only filter
    if (subscribedOnly && subscribedIds.size > 0) {
      list = list.filter(t => subscribedIds.has(t.channelId));
    }

    if (filter === 'passed') list = list.filter(t => progress[t.channelId]?.passed && !progress[t.channelId]?.expired);
    else if (filter === 'failed') list = list.filter(t => {
      const p = progress[t.channelId];
      return p && !p.passed && !p.expired;
    });
    else if (filter === 'not-attempted') list = list.filter(t => !progress[t.channelId]);

    list = [...list].sort((a, b) => {
      if (sort === 'name') return a.title.localeCompare(b.title);
      if (sort === 'score') return (progress[b.channelId]?.bestScore ?? -1) - (progress[a.channelId]?.bestScore ?? -1);
      if (sort === 'last-attempt') {
        const da = progress[a.channelId]?.lastAttemptAt ?? '';
        const db = progress[b.channelId]?.lastAttemptAt ?? '';
        return db.localeCompare(da);
      }
      return 0;
    });

    return list;
  }, [tests, searchQuery, filter, sort, progress]);

  const FILTERS: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'passed', label: 'Passed' },
    { id: 'failed', label: 'Failed' },
    { id: 'not-attempted', label: 'Not Attempted' },
  ];

  return (
    <>
      <SEOHead
        title="Tests — Challenge Yourself"
        description="Take knowledge tests and earn badges"
        canonical="https://open-interview.github.io/tests"
      />
      <AppLayout>
        <div className="min-h-screen bg-background text-foreground pb-24 lg:pb-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <PageHeader title="Channel Tests" subtitle="Prove what you know across every topic" />

            {/* Stats */}
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mb-8">
              <StatCard icon={CheckCircle} bgColor="from-green-500/20 to-green-600/10" borderColor="border-green-500/30" color="text-green-500" value={passedCount} label="Passed" />
              <StatCard icon={XCircle} bgColor="from-red-500/20 to-red-600/10" borderColor="border-red-500/30" color="text-red-500" value={failedCount} label="Failed" />
              <StatCard icon={Target} bgColor="from-blue-500/20 to-blue-600/10" borderColor="border-blue-500/30" color="text-blue-500" value={notStartedCount} label="Not Started" />
              <StatCard icon={Star} bgColor="from-purple-500/20 to-purple-600/10" borderColor="border-purple-500/30" color="text-purple-500" value={`${stats.averageScore}%`} label="Avg Score" />
            </div>

            {/* Search + Sort */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex gap-2 mb-4">
              <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search tests..." />
              {/* Subscribed toggle */}
              <button
                onClick={() => setSubscribedOnly(s => !s)}
                className={`px-3 py-2.5 rounded-lg text-xs font-semibold border transition-all whitespace-nowrap ${
                  subscribedOnly
                    ? 'bg-[var(--color-accent-violet)]/15 border-[var(--color-accent-violet)] text-[var(--color-accent-violet-light)]'
                    : 'bg-muted/50 border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                {subscribedOnly ? '★ My Topics' : 'All Topics'}
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowSort(s => !s)}
                  className="flex items-center gap-1.5 px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm hover:border-primary/50 transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="hidden sm:inline">Sort</span>
                </button>
                <AnimatePresence>
                  {showSort && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      className="absolute right-0 top-full mt-1 w-44 bg-card border border-border rounded-lg shadow-lg z-10 overflow-hidden"
                    >
                      {([['name', 'Name'], ['last-attempt', 'Last Attempt'], ['score', 'Score']] as [SortKey, string][]).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => { setSort(key); setShowSort(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-muted/50 ${sort === key ? 'text-primary font-semibold' : 'text-muted-foreground'}`}
                        >
                          {label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Filter Tabs */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex gap-2 mb-8 overflow-x-auto pb-1">
              <FilterPills options={FILTERS} active={filter} onChange={id => setFilter(id as FilterTab)} />
            </motion.div>

            {/* Grid */}
            {loading ? (
              <PageLoader message="Loading tests..." />
            ) : filtered.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                <Search className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                <h3 className="text-xl font-bold mb-1">No tests found</h3>
                <p className="text-sm text-muted-foreground">Try a different filter or search term</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {filtered.map((test, i) => {
                    const p = progress[test.channelId];
                    const isPassed = p?.passed && !p?.expired;
                    const isFailed = p && !p.passed && !p.expired;
                    const isExpired = p?.expired;
                    const difficulty = getDominantDifficulty(test);
                    const sessionCount = Math.min(15, test.questions.length);
                    const mins = estimatedMinutes(sessionCount);
                    const lastDate = p?.lastAttemptAt
                      ? new Date(p.lastAttemptAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                      : null;

                    return (
                      <motion.button
                        key={test.channelId}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: Math.min(i * 0.04, 0.3) }}
                        whileHover={{ scale: 1.02, y: -3 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setLocation(`/test/${test.channelId}`)}
                        className={`group relative p-5 bg-card border rounded-xl text-left overflow-hidden transition-all ${
                          isPassed ? 'border-[var(--color-success)]/40 hover:border-[var(--color-success)]/70'
                          : isFailed ? 'border-[var(--color-error)]/40 hover:border-[var(--color-error)]/70'
                          : 'border-[var(--color-border)] hover:border-primary/50'
                        }`}
                      >
                        {/* Hover bg */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="relative space-y-3">
                          {/* Top row */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-0.5">{test.channelName}</div>
                              <h3 className="text-base font-bold leading-tight">{test.title}</h3>
                            </div>
                            {/* Score ring + status */}
                            <div className="flex flex-col items-center gap-1 flex-shrink-0">
                              {p ? (
                                <div className="relative w-12 h-12 flex items-center justify-center">
                                  <svg width="48" height="48" className="-rotate-90">
                                    <circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="3.5" />
                                    <motion.circle
                                      cx="24" cy="24" r="18"
                                      fill="none"
                                      stroke={isPassed ? 'var(--color-success)' : 'var(--color-error)'}
                                      strokeWidth="3.5"
                                      strokeLinecap="round"
                                      strokeDasharray={2 * Math.PI * 18}
                                      initial={{ strokeDashoffset: 2 * Math.PI * 18 }}
                                      animate={{ strokeDashoffset: 2 * Math.PI * 18 * (1 - p.bestScore / 100) }}
                                      transition={{ duration: 0.8, ease: 'easeOut' }}
                                    />
                                  </svg>
                                  <span className="absolute text-[10px] font-bold" style={{ color: isPassed ? 'var(--color-success)' : 'var(--color-error)' }}>{p.bestScore}%</span>
                                </div>
                              ) : (
                                <div className="w-12 h-12 rounded-full border-2 border-dashed border-border flex items-center justify-center">
                                  <span className="text-[9px] text-muted-foreground text-center leading-tight">No<br/>score</span>
                                </div>
                              )}
                              {isPassed && (
                                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[var(--color-success)]/15 text-[var(--color-success)] border border-[var(--color-success)]/30">
                                  <CheckCircle className="w-2.5 h-2.5" /> Pass
                                </span>
                              )}
                              {isFailed && (
                                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[var(--color-error)]/15 text-[var(--color-error)] border border-[var(--color-error)]/30">
                                  <XCircle className="w-2.5 h-2.5" /> Fail
                                </span>
                              )}
                              {isExpired && (
                                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                  <AlertTriangle className="w-2.5 h-2.5" /> Exp
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Meta row */}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{sessionCount}q · ~{mins}m</span>
                            <span className={`font-semibold ${DIFFICULTY_COLOR[difficulty]}`}>{DIFFICULTY_LABEL[difficulty]}</span>
                            {lastDate && <span>Last: {lastDate}</span>}
                          </div>

                          {/* CTA */}
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-xs font-semibold text-primary">
                              {isPassed ? 'Retake Test' : isExpired ? 'Retake (Expired)' : p ? 'Try Again' : 'Start Test'}
                            </span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </>
  );
}
