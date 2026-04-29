import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { Search, ChevronRight, Layers, Type, GitBranch, Network, BarChart2, SortAsc, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { getProgress } from '@/lib/challenge-progress';
import { loadAllChallenges } from '@/lib/challenges-loader';
import type { ChallengeListItem, ChallengeStatus, Difficulty } from '@/types/challenges';

const DIFFICULTIES: Array<'All' | Difficulty> = ['All', 'easy', 'medium', 'hard'];

const DIFFICULTY_STYLES: Record<Difficulty, { bg: string; text: string; dot: string }> = {
  easy: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  medium: { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
  hard: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
};

const STATUS_LABEL: Record<ChallengeStatus, string> = {
  solved: 'Solved',
  attempted: 'Attempted',
  unsolved: 'Unsolved',
};

const STATUS_STYLES: Record<ChallengeStatus, { bg: string; text: string; border: string }> = {
  solved: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  attempted: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  unsolved: { bg: 'bg-zinc-700/20', text: 'text-zinc-400', border: 'border-zinc-600/30' },
};

const CATEGORIES = [
  { label: 'Arrays', tag: 'arrays', icon: Layers },
  { label: 'Strings', tag: 'strings', icon: Type },
  { label: 'DP', tag: 'dynamic-programming', icon: GitBranch },
  { label: 'Trees', tag: 'trees', icon: Network },
  { label: 'Graphs', tag: 'graphs', icon: BarChart2 },
  { label: 'Sorting', tag: 'sorting', icon: SortAsc },
];

export default function ChallengeList() {
  const [challenges, setChallenges] = useState<ChallengeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<'All' | Difficulty>('All');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    loadAllChallenges()
      .then(setChallenges)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const progress = useMemo(() => getProgress(), [challenges]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    challenges.forEach((c) => c.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [challenges]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return challenges.filter((c) => {
      if (difficulty !== 'All' && c.difficulty !== difficulty) return false;
      if (activeTag && !c.tags.includes(activeTag)) return false;
      if (q && !c.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [challenges, search, difficulty, activeTag]);

  const solvedCount = useMemo(
    () => challenges.filter((c) => progress.challenges[c.id]?.status === 'solved').length,
    [challenges, progress]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner className="size-8 text-zinc-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-2 text-zinc-400">
        <p className="text-red-400 font-medium">Failed to load challenges</p>
        <p className="text-base">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Challenges</h1>
          <p className="text-base text-foreground/70 mt-0.5">
            {solvedCount} of {challenges.length} solved
          </p>
        </div>
      </div>

      {/* Search Bar - Google Style */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9AA0A6]" />
         <Input
           placeholder="Search challenges..."
           value={search}
           onChange={(e) => setSearch(e.target.value)}
           className="pl-11 placeholder:text-[#9AA0A6] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all duration-200"
         />
      </div>

      {/* Filter Chips - Google Style */}
      <div className="space-y-3">
        {/* Difficulty filters */}
        <div className="flex items-center gap-2 flex-wrap">
         <span className="text-xs text-foreground/60 mr-1">Difficulty:</span>
           {DIFFICULTIES.map((d) => (
             <button
               key={d}
               onClick={() => setDifficulty(d)}
               className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 cursor-pointer min-h-[36px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                 difficulty === d
                    ? 'bg-primary text-primary-foreground border-primary'
                   : 'bg-muted/60 text-foreground/70 border-border/50 hover:bg-muted hover:border-border'
               }`}
             >
              {d === 'All' ? 'All' : d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>

        {/* Category filters */}
        <div className="flex items-center gap-2 flex-wrap">
         <span className="text-xs text-foreground/60 mr-1">Topics:</span>
           {CATEGORIES.map(({ label, tag, icon: Icon }) => (
             <button
               key={tag}
               onClick={() => setActiveTag(activeTag === tag ? null : tag)}
               className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 cursor-pointer min-h-[36px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                 activeTag === tag
                    ? 'bg-primary/20 text-primary border-primary/50'
                   : 'bg-muted/60 text-foreground/70 border-border/50 hover:bg-muted hover:border-border'
               }`}
             >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Active tag indicator */}
        {activeTag && !CATEGORIES.find(c => c.tag === activeTag) && (
           <button
             onClick={() => setActiveTag(null)}
             className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border bg-muted/60 text-foreground border-border cursor-pointer min-h-[36px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
           >
            {activeTag} ×
          </button>
        )}
      </div>

      {/* Challenge Cards Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
           <p className="text-foreground/60">No challenges match your filters.</p>
           <button
             onClick={() => { setSearch(''); setDifficulty('All'); setActiveTag(null); }}
             className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium transition-colors duration-150 cursor-pointer hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
           >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((challenge, idx) => {
            const status: ChallengeStatus =
              progress.challenges[challenge.id]?.status ?? 'unsolved';
            const diffStyle = DIFFICULTY_STYLES[challenge.difficulty];
            const statusStyle = STATUS_STYLES[status];

            return (
          <button
                 key={challenge.id}
                 onClick={() => navigate(`/code/challenges/${challenge.id}`)}
                  className="group text-left p-4 rounded-2xl border border-border bg-card/40 hover:bg-card/60 hover:border-border/70 cursor-pointer transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
               >
                {/* Card header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-foreground/60">#{idx + 1}</span>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${diffStyle.bg} ${diffStyle.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${diffStyle.dot}`} />
                    {challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
                  </div>
                </div>

                {/* Title */}
                 <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                   {challenge.title}
                 </h3>

                {/* Tags preview */}
                {challenge.tags.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap mb-3">
                     {challenge.tags.slice(0, 2).map((tag) => (
                       <span
                         key={tag}
                         className="px-3 py-1.5 rounded-md bg-muted text-foreground/70 text-xs border border-border/50"
                       >
                        {tag}
                      </span>
                    ))}
                     {challenge.tags.length > 2 && (
                       <span className="text-foreground/60 text-xs">+{challenge.tags.length - 2}</span>
                     )}
                  </div>
                )}

                {/* Footer */}
                 <div className="flex items-center justify-between pt-2 border-t border-border/50">
                   <span className={`inline-flex px-3 py-1.5 rounded-md text-xs font-medium ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} border`}>
                     {STATUS_LABEL[status]}
                   </span>
                   <div className="flex items-center gap-1 text-xs text-foreground/60">
                     <span>{challenge.estimatedMinutes}m</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}