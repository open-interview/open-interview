import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Zap, Flame, Trophy, ArrowRight, Layers, Type, GitBranch,
  Network, BarChart2, SortAsc, Bot, CheckCircle, Clock, RotateCcw,
} from 'lucide-react';
import { getProgress, getStats } from '@/lib/challenge-progress';
import { loadAllChallenges } from '@/lib/challenges-loader';
import type { ChallengeListItem } from '../types/challenges';
import type { UserProgress, ChallengeProgress } from '@/lib/challenge-progress';

const LEVEL_NAMES = ['Newbie', 'Beginner', 'Learner', 'Coder', 'Developer', 'Engineer', 'Expert', 'Master'];

const CATEGORIES = [
  { label: 'Arrays',            tag: 'array',              icon: Layers },
  { label: 'Strings',           tag: 'string',             icon: Type },
  { label: 'Dynamic Programming', tag: 'dynamic-programming', icon: GitBranch },
  { label: 'Trees',             tag: 'tree',               icon: Network },
  { label: 'Graphs',            tag: 'graph',              icon: BarChart2 },
  { label: 'Sorting',           tag: 'sorting',            icon: SortAsc },
];

const DIFF_COLOR: Record<string, string> = {
  easy:   'text-emerald-400',
  medium: 'text-amber-400',
  hard:   'text-red-400',
};

function dayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86400000);
}

export default function ChallengeHome() {
  const [, setLocation] = useLocation();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [challenges, setChallenges] = useState<ChallengeListItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<ChallengeProgress[]>([]);

  useEffect(() => {
    const p = getProgress();
    setProgress(p);
    const { recentActivity } = getStats();
    setRecentActivity(recentActivity.slice(0, 3));
    loadAllChallenges().then(setChallenges).catch(() => {});
  }, []);

  const hasProgress = progress && (progress.xp > 0 || progress.totalSolved > 0);
  const featured = challenges.length > 0 ? challenges[dayOfYear() % challenges.length] : null;

  const categoryCounts = CATEGORIES.map(cat => ({
    ...cat,
    count: challenges.filter(c => c.tags.includes(cat.tag)).length,
  }));

  const recentWithTitle = recentActivity.map(a => ({
    ...a,
    title: challenges.find(c => c.id === a.challengeId)?.title ?? a.challengeId,
  }));

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">

        {/* Hero */}
        <section className="text-center space-y-4">
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            Code. Learn. Level Up.
          </h1>
          <p className="text-gray-400 text-lg">
            Practice coding challenges in your browser. No login required.
          </p>
          <div className="flex items-center justify-center gap-4 pt-2">
            <Link href="/challenges">
              <button className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
                Start Coding <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            {hasProgress && (
              <span className="text-sm text-violet-300 font-medium">
                Level {progress.level} · {progress.xp} XP
              </span>
            )}
          </div>
        </section>

        {/* Stats bar */}
        {hasProgress && (
          <section className="grid grid-cols-4 gap-3">
            {[
              { label: 'Solved',  value: progress.totalSolved,  icon: <CheckCircle className="w-4 h-4 text-emerald-400" /> },
              { label: 'Streak',  value: `${progress.streak} 🔥`, icon: <Flame className="w-4 h-4 text-orange-400" /> },
              { label: 'XP',      value: progress.xp,           icon: <Zap className="w-4 h-4 text-yellow-400" /> },
              { label: LEVEL_NAMES[Math.min(progress.level, LEVEL_NAMES.length - 1)], value: `Lv ${progress.level}`, icon: <Trophy className="w-4 h-4 text-violet-400" /> },
            ].map(({ label, value, icon }) => (
              <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col items-center gap-1">
                {icon}
                <span className="text-xl font-bold">{value}</span>
                <span className="text-xs text-gray-500">{label}</span>
              </div>
            ))}
          </section>
        )}

        {/* Featured challenge */}
        {featured && (
          <section className="bg-gray-900 border border-indigo-800/50 rounded-2xl p-6 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold uppercase tracking-wide">
              <Zap className="w-4 h-4" /> Challenge of the Day
            </div>
            <h2 className="text-xl font-bold">{featured.title}</h2>
            <div className="flex items-center gap-4 text-sm">
              <span className={`font-medium capitalize ${DIFF_COLOR[featured.difficulty] ?? 'text-gray-400'}`}>
                {featured.difficulty}
              </span>
              <span className="flex items-center gap-1 text-gray-400">
                <Clock className="w-3.5 h-3.5" /> {featured.estimatedMinutes} min
              </span>
            </div>
            <Link href={`/challenges/${featured.id}`}>
              <button className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors mt-1">
                Solve Now <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </section>
        )}

        {/* Category grid */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-200">Browse by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categoryCounts.map(({ label, tag, icon: Icon, count }) => (
              <button
                key={tag}
                onClick={() => setLocation(`/challenges?tag=${tag}`)}
                className="bg-gray-900 border border-gray-800 hover:border-indigo-600 rounded-xl p-4 flex items-center gap-3 text-left transition-colors group"
              >
                <Icon className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300 shrink-0" />
                <div>
                  <div className="font-medium text-sm">{label}</div>
                  <div className="text-xs text-gray-500">{count} challenges</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Recent activity */}
        {recentWithTitle.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-200">Recent Activity</h2>
            <div className="space-y-2">
              {recentWithTitle.map(a => (
                <div key={a.challengeId} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {a.status === 'solved'
                      ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      : <RotateCcw className="w-4 h-4 text-amber-400 shrink-0" />}
                    <span className="text-sm font-medium">{a.title}</span>
                  </div>
                  <Link href={`/challenges/${a.challengeId}`}>
                    <button className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                      {a.status === 'solved' ? 'Review' : 'Retry'} →
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Rex teaser */}
        <section className="bg-teal-950/60 border border-teal-700/50 rounded-2xl p-5 flex items-center gap-4">
          <div className="bg-teal-600/20 rounded-full p-3">
            <Bot className="w-6 h-6 text-teal-400" />
          </div>
          <div>
            <p className="font-semibold text-teal-300">Rex is here to help!</p>
            <p className="text-sm text-teal-400/80">Get hints without spoilers. Your AI coding companion.</p>
          </div>
        </section>

      </div>
    </div>
  );
}
