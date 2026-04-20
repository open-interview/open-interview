import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Search, Zap, Flame, Trophy, ArrowRight, Bot,
  CheckCircle, Clock, RotateCcw, Layers, Type,
  GitBranch, Network, BarChart2, SortAsc, Star,
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
  frontend:        ['arrays', 'strings', 'dynamic-programming'],
  backend:         ['arrays', 'trees', 'graphs'],
  fullstack:       ['arrays', 'strings', 'trees'],
  devops:          ['arrays', 'sorting', 'strings'],
  sre:             ['arrays', 'sorting', 'strings'],
  'data-engineer': ['dynamic-programming', 'arrays', 'sorting'],
  'ml-engineer':   ['dynamic-programming', 'arrays', 'sorting'],
  'ai-engineer':   ['dynamic-programming', 'arrays', 'strings'],
  'data-scientist':['dynamic-programming', 'arrays', 'sorting'],
  security:        ['arrays', 'strings', 'bit-manipulation'],
  architect:       ['graphs', 'trees', 'dynamic-programming'],
  manager:         ['arrays', 'strings', 'sorting'],
  platform:        ['arrays', 'graphs', 'sorting'],
  mobile:          ['arrays', 'strings', 'trees'],
  qa:              ['arrays', 'strings', 'sorting'],
  sdet:            ['arrays', 'strings', 'sorting'],
};

const LEVEL_NAMES = ['Newbie', 'Beginner', 'Learner', 'Coder', 'Developer', 'Engineer', 'Expert', 'Master'];
const DIFFICULTIES: Array<'All' | Difficulty> = ['All', 'easy', 'medium', 'hard'];

const DIFF_BADGE: Record<string, string> = {
  easy:   'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  hard:   'bg-red-500/20 text-red-400 border-red-500/30',
};
const STATUS_LABEL: Record<ChallengeStatus, string> = {
  solved: '✅ Solved', attempted: '🔄 Attempted', unsolved: '⬜ Unsolved',
};
const STATUS_STYLE: Record<ChallengeStatus, string> = {
  solved:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  attempted: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  unsolved:  'bg-zinc-700/30 text-zinc-400 border-zinc-600/30',
};

const CATEGORIES = [
  { label: 'Arrays',  tag: 'arrays',  icon: Layers },
  { label: 'Strings', tag: 'strings', icon: Type },
  { label: 'DP',      tag: 'dynamic-programming', icon: GitBranch },
  { label: 'Trees',   tag: 'trees',   icon: Network },
  { label: 'Graphs',  tag: 'graphs',  icon: BarChart2 },
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

  // Read ?tag= from URL on mount
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
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10 pb-24">

        {/* ── Hero ── */}
        <section className="text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            Code. Learn. Level Up.
          </h1>
          <p className="text-gray-400 text-lg">Practice coding challenges in your browser. No login required.</p>
          {hasProgress && (
            <div className="flex justify-center gap-6 pt-1">
              {[
                { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, val: progress.totalSolved, label: 'Solved' },
                { icon: <Flame className="w-4 h-4 text-orange-400" />,        val: `${progress.streak}🔥`, label: 'Streak' },
                { icon: <Zap className="w-4 h-4 text-yellow-400" />,          val: progress.xp,           label: 'XP' },
                { icon: <Trophy className="w-4 h-4 text-violet-400" />,       val: `Lv ${progress.level}`, label: LEVEL_NAMES[Math.min(progress.level, 7)] },
              ].map(({ icon, val, label }) => (
                <div key={label} className="flex flex-col items-center gap-0.5">
                  <div className="flex items-center gap-1 text-sm font-bold">{icon}{val}</div>
                  <span className="text-xs text-gray-500">{label}</span>
                </div>
              ))}
            </div>
          )}
          {hasProgress && (
            <div className="flex justify-center">
              <Link href="/stats" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                View Full Stats →
              </Link>
            </div>
          )}
        </section>

        {/* ── Recommended for You ── */}
        {preferences.onboardingComplete && relevantChallenges.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold">
              <Star className="w-4 h-4" /> Recommended for You
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {relevantChallenges.map(c => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/code/challenges/${c.id}`)}
                  className="text-left bg-gray-900 border border-amber-800/30 hover:border-amber-600/60 rounded-xl p-4 space-y-2 transition-colors duration-150 cursor-pointer min-h-[44px]"
                >
                  <p className="font-medium text-white text-sm leading-snug">{c.title}</p>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded border text-xs font-medium ${DIFF_BADGE[c.difficulty]}`}>
                      {c.difficulty}
                    </span>
                    <span className="flex items-center gap-1 text-gray-400 text-xs">
                      <Clock className="w-3 h-3" />{c.estimatedMinutes}m
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Featured + Rex side-by-side ── */}
        <div className="grid sm:grid-cols-2 gap-4">
          {featured && (
            <div className="bg-gray-900 border border-indigo-800/50 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wide">
                <Zap className="w-3.5 h-3.5" /> Challenge of the Day
              </div>
              <p className="font-bold text-lg leading-snug">{featured.title}</p>
              <div className="flex items-center gap-3 text-sm">
                <span className={`px-2 py-0.5 rounded border text-xs font-medium ${DIFF_BADGE[featured.difficulty]}`}>
                  {featured.difficulty}
                </span>
                <span className="flex items-center gap-1 text-gray-400 text-xs">
                  <Clock className="w-3 h-3" />{featured.estimatedMinutes}m
                </span>
              </div>
              <button
                onClick={() => navigate(`/code/challenges/${featured.id}`)}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors duration-150 cursor-pointer min-h-[44px]"
              >
                Solve Now <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <div className="bg-teal-950/60 border border-teal-700/50 rounded-2xl p-5 flex items-center gap-4">
            <div className="bg-teal-600/20 rounded-full p-3 shrink-0">
              <Bot className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <p className="font-semibold text-teal-300">Rex is here to help!</p>
              <p className="text-sm text-teal-400/80">3-level hints without spoilers. Your AI coding companion.</p>
            </div>
          </div>
        </div>

        {/* ── Category chips ── */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(({ label, tag, icon: Icon }) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-full text-xs font-medium border transition-colors duration-150 cursor-pointer min-h-[44px] ${
                activeTag === tag
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-indigo-600'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
          {activeTag && !CATEGORIES.find(c => c.tag === activeTag) && (
            <button
              onClick={() => setActiveTag(null)}
              className="px-3 py-2.5 rounded-full text-xs font-medium border bg-indigo-600 text-white border-indigo-500 cursor-pointer min-h-[44px]"
            >
              {activeTag} ×
            </button>
          )}
        </div>

        {/* ── Search + Difficulty ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search challenges…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>
          <div className="flex gap-2">
            {DIFFICULTIES.map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-3 py-2.5 rounded-full text-xs font-medium border transition-colors duration-150 cursor-pointer min-h-[44px] ${
                  difficulty === d
                    ? 'bg-white text-gray-900 border-white'
                    : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-500'
                }`}
              >
                {d === 'All' ? 'All' : d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* ── Challenge table ── */}
        {loading ? (
          <div className="flex justify-center py-16"><Spinner className="size-8 text-gray-500" /></div>
        ) : error ? (
          <div className="text-center py-16 text-red-400">{error}</div>
        ) : (
          <>
            <p className="text-sm text-gray-500">{solvedCount} / {challenges.length} solved · showing {filtered.length}</p>
            <div className="rounded-xl border border-gray-800 overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-900/60 text-gray-400 text-left">
                    <th className="px-4 py-3 w-10">#</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3 w-28">Difficulty</th>
                    <th className="px-4 py-3 hidden sm:table-cell">Tags</th>
                    <th className="px-4 py-3 w-32">Status</th>
                    <th className="px-4 py-3 w-20 hidden sm:table-cell">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16">
                        <p className="text-gray-500 mb-3">No challenges match.</p>
                        <div className="flex justify-center gap-3 flex-wrap">
                          <button
                            onClick={() => { setSearch(''); setDifficulty('All'); setActiveTag(null); }}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors duration-150 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Clear Filters
                          </button>
                          <button
                            onClick={() => { setSearch(''); setDifficulty('All'); setActiveTag(null); }}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium border border-gray-700 transition-colors duration-150 cursor-pointer"
                          >
                            Browse All Challenges
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.map((c, i) => {
                    const status: ChallengeStatus = progress?.challenges[c.id]?.status ?? 'unsolved';
                    return (
                      <tr
                        key={c.id}
                        onClick={() => navigate(`/code/challenges/${c.id}`)}
                        className="border-b border-gray-800/60 last:border-0 hover:bg-gray-800/40 cursor-pointer transition-colors duration-150"
                      >
                        <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                        <td className="px-4 py-3 font-medium text-white">{c.title}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded border text-xs font-medium ${DIFF_BADGE[c.difficulty]}`}>
                            {c.difficulty.charAt(0).toUpperCase() + c.difficulty.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <div className="flex gap-1 flex-wrap">
                            {c.tags.slice(0, 3).map(t => (
                              <span key={t} className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 text-xs border border-gray-700">{t}</span>
                            ))}
                            {c.tags.length > 3 && <span className="text-gray-500 text-xs">+{c.tags.length - 3}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded border text-xs ${STATUS_STYLE[status]}`}>
                            {STATUS_LABEL[status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">{c.estimatedMinutes}m</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── Cross-sell ── */}
        <div className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-5 py-4">
          <div>
            <p className="font-semibold text-white text-sm">Want more practice?</p>
            <p className="text-xs text-gray-400 mt-0.5">Try Q&amp;A interview questions across 40+ topics.</p>
          </div>
          <Link href="/channels" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors duration-150 shrink-0 min-h-[44px]">
            Practice Interview Questions <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </AppLayout>
  );
}
