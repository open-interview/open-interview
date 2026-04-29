import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Search, Zap, Flame, Trophy, ArrowRight, Bot,
  CheckCircle, Clock, Star, Layers, Type,
  GitBranch, Network, BarChart2, SortAsc,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { AppLayout } from '@/components/layout/AppLayout';
import { getProgress, getStats } from '@/lib/challenge-progress';
import { loadAllChallenges } from '@/lib/challenges-loader';
import { useUserPreferences } from '@/context/UserPreferencesContext';
import type { ChallengeListItem, ChallengeStatus, Difficulty } from '@/types/challenges';
import type { UserProgress } from '@/lib/challenge-progress';

const ROLE_TAGS: Record<string, string[]> = {
  frontend: ['arrays', 'strings', 'dynamic-programming'],
  backend: ['arrays', 'trees', 'graphs'],
  fullstack: ['arrays', 'strings', 'trees'],
  devops: ['arrays', 'sorting', 'strings'],
  sre: ['arrays', 'sorting', 'strings'],
  'data-engineer': ['dynamic-programming', 'arrays', 'sorting'],
  'ml-engineer': ['dynamic-programming', 'arrays', 'sorting'],
  'ai-engineer': ['dynamic-programming', 'arrays', 'strings'],
  'data-scientist': ['dynamic-programming', 'arrays', 'sorting'],
  security: ['arrays', 'strings', 'bit-manipulation'],
  architect: ['graphs', 'trees', 'dynamic-programming'],
  manager: ['arrays', 'strings', 'sorting'],
  platform: ['arrays', 'graphs', 'sorting'],
  mobile: ['arrays', 'strings', 'trees'],
  qa: ['arrays', 'strings', 'sorting'],
  sdet: ['arrays', 'strings', 'sorting'],
};

const LEVEL_NAMES = ['Newbie', 'Beginner', 'Learner', 'Coder', 'Developer', 'Engineer', 'Expert', 'Master'];
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

function dayOfYear() {
  const now = new Date();
  return Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
}

export default function ChallengeHome() {
  const [, navigate] = useLocation();
  const { preferences } = useUserPreferences();
  const [challenges, setChallenges] = useState<ChallengeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<'All' | Difficulty>('All');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    setProgress(getProgress());
    loadAllChallenges()
      .then(setChallenges)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const tag = new URLSearchParams(window.location.search).get('tag');
    if (tag) setActiveTag(tag);
  }, []);

  const hasProgress = progress && (progress.xp > 0 || progress.totalSolved > 0);
  const featured = challenges.length > 0 ? challenges[dayOfYear() % challenges.length] : null;

  const allTags = useMemo(() => {
    const s = new Set<string>();
    challenges.forEach(c => c.tags.forEach(t => s.add(t)));
    return Array.from(s).sort();
  }, [challenges]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return challenges.filter(c => {
      if (difficulty !== 'All' && c.difficulty !== difficulty) return false;
      if (activeTag && !c.tags.includes(activeTag)) return false;
      if (q && !c.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [challenges, search, difficulty, activeTag]);

  const solvedCount = useMemo(
    () => challenges.filter(c => progress?.challenges[c.id]?.status === 'solved').length,
    [challenges, progress],
  );

  const relevantChallenges = useMemo(() => {
    if (!preferences.onboardingComplete || challenges.length === 0) return [];
    const roleTags = ROLE_TAGS[preferences.role ?? ''] ?? ['arrays', 'strings'];
    return challenges
      .filter(c =>
        c.tags.some(t => roleTags.includes(t)) &&
        progress?.challenges[c.id]?.status !== 'solved'
      )
      .slice(0, 5);
  }, [challenges, preferences.onboardingComplete, preferences.role, progress]);

  return (
    <AppLayout title="Code Challenges" fullWidth>
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8 pb-24">

        {/* Hero Section */}
        <section className="text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
            Code. Learn. Level Up.
          </h1>
          <p className="text-foreground/70 text-base">Practice coding challenges in your browser. No login required.</p>
          {hasProgress && (
            <div className="flex justify-center gap-8 pt-2">
              {[
                { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, val: progress.totalSolved, label: 'Solved' },
                { icon: <Flame className="w-4 h-4 text-orange-400" />, val: `${progress.streak}🔥`, label: 'Streak' },
                { icon: <Zap className="w-4 h-4 text-yellow-400" />, val: progress.xp, label: 'XP' },
                { icon: <Trophy className="w-4 h-4 text-primary" />, val: `Lv ${progress.level}`, label: LEVEL_NAMES[Math.min(progress.level, 7)] },
              ].map(({ icon, val, label }) => (
                <div key={label} className="flex flex-col items-center gap-0.5">
                  <div className="flex items-center gap-1 text-sm font-bold">{icon}{val}</div>
                  <span className="text-xs text-foreground/60">{label}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Featured + Rex */}
        <div className="grid sm:grid-cols-2 gap-4">
          {featured && (
            <div className="bg-gradient-to-br from-background to-muted/50 border border-primary/30 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wide">
                <Zap className="w-3.5 h-3.5" /> Challenge of the Day
              </div>
               <p className="font-bold text-xl leading-snug text-foreground">{featured.title}</p>
              <div className="flex items-center gap-3">
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${DIFFICULTY_STYLES[featured.difficulty].bg} ${DIFFICULTY_STYLES[featured.difficulty].text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${DIFFICULTY_STYLES[featured.difficulty].dot}`} />
                  {featured.difficulty}
                </span>
                 <span className="flex items-center gap-1 text-foreground/70 text-xs">
                   <Clock className="w-3 h-3" />{featured.estimatedMinutes}m
                 </span>
              </div>
              <button
                onClick={() => navigate(`/code/challenges/${featured.id}`)}
                 className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-full transition-all duration-150 cursor-pointer hover:opacity-90 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Solve Now <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
           <div className="bg-gradient-to-br from-teal-900/30 to-teal-800/20 border border-teal-500/30 rounded-2xl p-6 flex items-center gap-4 shadow-xl">
            <div className="bg-teal-500/20 rounded-full p-3 shrink-0">
              <Bot className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <p className="font-semibold text-teal-300">Rex is here to help!</p>
               <p className="text-base text-teal-400/80">3-level hints without spoilers. Your AI coding companion.</p>
            </div>
          </div>
        </div>

        {/* Recommended for You */}
        {preferences.onboardingComplete && relevantChallenges.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold">
              <Star className="w-4 h-4" /> Recommended for You
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {relevantChallenges.map(c => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/code/challenges/${c.id}`)}
                  className="text-left p-4 rounded-2xl border border-amber-500/20 bg-amber-900/10 hover:bg-amber-900/20 hover:border-amber-500/40 cursor-pointer transition-all duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                     <p className="font-medium text-foreground text-sm leading-snug mb-2">{c.title}</p>
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${DIFFICULTY_STYLES[c.difficulty].bg} ${DIFFICULTY_STYLES[c.difficulty].text}`}>
                       <span className={`w-1.5 h-1.5 rounded-full ${DIFFICULTY_STYLES[c.difficulty].dot}`} />
                      {c.difficulty}
                    </span>
                         <span className="flex items-center gap-1 text-foreground/60 text-xs">
                           <Clock className="w-3 h-3" />{c.estimatedMinutes}m
                         </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Search Bar - Google Style */}
        <div className="relative">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9AA0A6]" />
         <Input
           placeholder="Search challenges…"
           value={search}
           onChange={e => setSearch(e.target.value)}
           className="pl-11 placeholder:text-[#9AA0A6] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all duration-200"
         />
        </div>

        {/* Filter Chips - Google Style */}
        <div className="space-y-3">
          {/* Difficulty filters */}
          <div className="flex items-center gap-2 flex-wrap">
           <span className="text-xs text-foreground/60 mr-1">Difficulty:</span>
           {DIFFICULTIES.map(d => (
             <button
               key={d}
               onClick={() => setDifficulty(d)}
               className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 cursor-pointer min-h-[36px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                 difficulty === d
                   ? 'bg-primary text-primary-foreground border-primary shadow-sm'
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
                     ? 'bg-primary/20 text-primary border-primary/50 shadow-sm'
                     : 'bg-muted/60 text-foreground/70 border-border/50 hover:bg-muted hover:border-border'
                 }`}
               >
                <Icon className="w-3.5 h-3.5" />{label}
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

        {/* Results count */}
         <p className="text-base text-foreground/60">
           {solvedCount} of {challenges.length} solved · showing {filtered.length}
         </p>

        {/* Challenge Cards Grid */}
        {loading ? (
          <div className="flex justify-center py-16"><Spinner className="size-8 text-zinc-500" /></div>
        ) : error ? (
           <div className="text-center py-16 text-destructive text-base">{error}</div>
        ) : filtered.length === 0 ? (
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
            {filtered.map((c, i) => {
              const status: ChallengeStatus = progress?.challenges[c.id]?.status ?? 'unsolved';
              const diffStyle = DIFFICULTY_STYLES[c.difficulty];
              const statusStyle = STATUS_STYLES[status];

              return (
                <button
                  key={c.id}
                  onClick={() => navigate(`/code/challenges/${c.id}`)}
                  className="group text-left p-4 rounded-2xl border border-border bg-card/40 hover:bg-card/60 hover:border-border/70 hover:shadow-xl cursor-pointer transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between mb-3">
                     <span className="text-xs text-foreground/60">#{i + 1}</span>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${diffStyle.bg} ${diffStyle.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${diffStyle.dot}`} />
                      {c.difficulty.charAt(0).toUpperCase() + c.difficulty.slice(1)}
                    </div>
                  </div>

                  {/* Title */}
                     <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                       {c.title}
                     </h3>

                  {/* Tags preview */}
                  {c.tags.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mb-3">
                      {c.tags.slice(0, 2).map(t => (
                         <span key={t} className="px-3 py-1.5 rounded-md bg-muted text-foreground/70 text-xs border border-border/50">
                          {t}
                        </span>
                      ))}
                         {c.tags.length > 2 && <span className="text-foreground/60 text-xs">+{c.tags.length - 2}</span>}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/50">
                     <span className={`inline-flex px-3 py-1.5 rounded-md text-xs font-medium ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} border`}>
                      {STATUS_LABEL[status]}
                    </span>
                       <div className="flex items-center gap-1 text-xs text-foreground/60">
                         <Clock className="w-3 h-3" />{c.estimatedMinutes}m
                       </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}