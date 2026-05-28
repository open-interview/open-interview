import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';
import { Sparkles, Hash, RefreshCw, Github } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Layout } from '@/ui/Layout';
import { FeedCard } from '@/components/feed/FeedCard';
import { SkeletonCard } from '@/components/feed/SkeletonCard';
import { getAllQuestions, loadAllQuestionsFast } from '@/lib/questions-loader';
import { getSRSStats, addXP } from '@/lib/spaced-repetition';
import type { Question } from '@/lib/questions-loader';

const DISCOVERY_INTERVAL = 5;
const OVERSCAN = 3;

function DiscoveryCard({ topTag, onDismiss }: { topTag: string; onDismiss: () => void }) {
  return (
    <div className="w-full border-b border-[var(--tw-border)] px-4 py-3">
      <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/10 via-indigo-500/10 to-cyan-500/10 border border-violet-500/20">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[15px] font-bold text-[#e7e9ea] mb-1">You&apos;ve been mastering {topTag}</h4>
            <p className="text-[13px] text-[#71767b] leading-relaxed">
              Show more <strong className="text-[#e7e9ea]">#{topTag}</strong> in your feed?
            </p>
            <div className="flex items-center gap-2 mt-3">
              <button className="px-4 py-2 rounded-full text-[14px] font-semibold bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:from-violet-600 hover:to-indigo-600 transition-all">
                <Hash className="w-[18px] h-[18px] inline mr-1" />
                Show more
              </button>
              <button onClick={onDismiss} className="px-4 py-2 rounded-full text-[14px] text-[#71767b] hover:text-[#e7e9ea] hover:bg-[#1d1f23] transition-all">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function KnowledgeFeed() {
  const [location] = useLocation();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dismissedDiscovery, setDismissedDiscovery] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);

  // Channel filter from URL
  const channelFilter = useMemo(() => {
    const match = location.match(/^\/feed\/(.+)/);
    return match ? match[1] : null;
  }, [location]);

  // Load questions
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const cached = getAllQuestions();
        const all = cached.length > 0 ? cached : await loadAllQuestionsFast();
        if (!cancelled) {
          if (all.length === 0) {
            setError('No questions loaded yet.');
          } else {
            setQuestions(all);
          }
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load questions');
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // Filter — case-insensitive exact match first, then partial match fallback
  const filteredQuestions = useMemo(() => {
    if (!channelFilter) return questions;
    const filterLower = channelFilter.toLowerCase();
    const exact = questions.filter(q => q.channel.toLowerCase() === filterLower);
    if (exact.length > 0) return exact;
    // Partial: channel contains filter keyword OR filter contains channel id
    return questions.filter(q =>
      q.channel.toLowerCase().includes(filterLower) ||
      filterLower.includes(q.channel.toLowerCase())
    );
  }, [questions, channelFilter]);

  const virtualCount = filteredQuestions.length + Math.floor(filteredQuestions.length / DISCOVERY_INTERVAL);
  const getScrollEl = useCallback(() => parentRef.current, []);
  const estimateSize = useCallback(() => 280, []);
  const virtualizer = useVirtualizer({
    count: virtualCount,
    getScrollElement: getScrollEl,
    estimateSize,
    overscan: OVERSCAN,
  });

  const handleRate = useCallback((rating: 'again' | 'hard' | 'good' | 'easy') => {
    const xpGain = { again: 5, hard: 10, good: 15, easy: 20 }[rating];
    addXP(xpGain);
  }, []);

  const dismissDiscovery = useCallback(() => setDismissedDiscovery(true), []);

  const topLikedTag = useMemo(() => {
    try {
      const likedIds = JSON.parse(localStorage.getItem('oi-liked-questions') || '[]') as string[];
      const tagCounts = new Map<string, number>();
      questions.forEach(q => {
        if (likedIds.includes(q.id)) {
          q.tags?.forEach(t => tagCounts.set(t, (tagCounts.get(t) || 0) + 1));
        }
      });
      let top = '';
      let topCount = 0;
      tagCounts.forEach((count, tag) => {
        if (count > topCount) { top = tag; topCount = count; }
      });
      return top;
    } catch { return ''; }
  }, [questions]);

  const virtualItems = useMemo(() => {
    const items: Array<{ type: 'question'; q: Question; index: number } | { type: 'discovery'; discoveryTag: string; id: string }> = [];
    filteredQuestions.forEach((q, i) => {
      items.push({ type: 'question', q, index: i });
      if (i > 0 && i % DISCOVERY_INTERVAL === 0 && topLikedTag && !dismissedDiscovery) {
        items.push({ type: 'discovery', discoveryTag: topLikedTag, id: `disc-${i}` });
      }
    });
    return items;
  }, [filteredQuestions, topLikedTag, dismissedDiscovery]);

  if (loading) {
    return (
      <Layout>
        <div ref={parentRef} className="h-dvh overflow-y-auto">
          <div className="flex flex-col">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-4">
            <RefreshCw className="w-6 h-6 text-rose-400" />
          </div>
          <h2 className="text-[18px] font-bold text-[#e7e9ea] mb-2">No Questions Available</h2>
          <p className="text-[15px] text-[#71767b] text-center max-w-md mb-6">{error}</p>
        </div>
      </Layout>
    );
  }

  if (filteredQuestions.length === 0) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="w-14 h-14 rounded-2xl bg-[#1d1f23] flex items-center justify-center mb-4">
            <Hash className="w-6 h-6 text-[#71767b]" />
          </div>
          <h2 className="text-[18px] font-bold text-[#e7e9ea] mb-2">No Results Found</h2>
          <p className="text-[15px] text-[#71767b] text-center max-w-md mb-6">
            {channelFilter
              ? `No questions for "${channelFilter}".`
              : 'No questions match your filters.'
            }
          </p>
          <a
            href="https://github.com/open-interview/open-interview/issues/new?title=Suggest topic: &labels=suggestion"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-full text-[14px] font-semibold bg-[#1d1f23] text-[#e7e9ea] hover:bg-[#2f3336] transition-all"
          >
            <Github className="w-[18px] h-[18px]" />
            Suggest on GitHub
          </a>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div ref={parentRef} className="h-[calc(100dvh-52px)] overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const item = virtualItems[virtualItem.index];
            if (!item) return null;

            return (
              <div
                key={item.type === 'question' ? item.q.id : item.id}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                {item.type === 'discovery' ? (
                  <DiscoveryCard topTag={item.discoveryTag} onDismiss={dismissDiscovery} />
                ) : (
                  <FeedCard question={item.q} index={item.index} onRate={handleRate} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
