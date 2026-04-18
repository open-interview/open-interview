import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { getProgress } from '@/lib/challenge-progress';
import { loadAllChallenges } from '@/lib/challenges-loader';
import type { ChallengeListItem, ChallengeStatus, Difficulty } from '@/types/challenges';

const DIFFICULTIES: Array<'All' | Difficulty> = ['All', 'easy', 'medium', 'hard'];

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  easy: 'bg-green-500/20 text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  hard: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const STATUS_LABEL: Record<ChallengeStatus, string> = {
  solved: '✅ Solved',
  attempted: '🔄 Attempted',
  unsolved: '⬜ Unsolved',
};

const STATUS_STYLES: Record<ChallengeStatus, string> = {
  solved: 'bg-green-500/10 text-green-400 border-green-500/20',
  attempted: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  unsolved: 'bg-zinc-700/30 text-zinc-400 border-zinc-600/30',
};

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
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header + Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Challenges</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            {solvedCount} / {challenges.length} solved
          </p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
          <Input
            placeholder="Search challenges..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
          />
        </div>

        {/* Difficulty filter */}
        <div className="flex gap-2 flex-wrap">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                difficulty === d
                  ? 'bg-white text-zinc-900 border-white'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500'
              }`}
            >
              {d === 'All' ? 'All' : d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>

        {/* Tag filter */}
        {allTags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`px-2 py-0.5 rounded text-xs border transition-colors ${
                  activeTag === tag
                    ? 'bg-indigo-500/30 text-indigo-300 border-indigo-500/50'
                    : 'bg-zinc-800/60 text-zinc-400 border-zinc-700 hover:border-zinc-500'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">No challenges match your filters.</div>
      ) : (
        <div className="rounded-lg border border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-400 text-left">
                <th className="px-4 py-3 w-12">#</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3 w-28">Difficulty</th>
                <th className="px-4 py-3">Tags</th>
                <th className="px-4 py-3 w-32">Status</th>
                <th className="px-4 py-3 w-24">Est. Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((challenge, idx) => {
                const status: ChallengeStatus =
                  progress.challenges[challenge.id]?.status ?? 'unsolved';
                return (
                  <tr
                    key={challenge.id}
                    onClick={() => navigate(`/challenges/${challenge.id}`)}
                    className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-800/40 cursor-pointer transition-colors"
                  >
                      <td className="px-4 py-3 text-zinc-500">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-white">{challenge.title}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded border text-xs font-medium ${DIFFICULTY_STYLES[challenge.difficulty]}`}
                        >
                          {challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {challenge.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 text-xs border border-zinc-700"
                            >
                              {tag}
                            </span>
                          ))}
                          {challenge.tags.length > 3 && (
                            <span className="text-zinc-500 text-xs">+{challenge.tags.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded border text-xs ${STATUS_STYLES[status]}`}
                        >
                          {STATUS_LABEL[status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-400">{challenge.estimatedMinutes}m</td>
                    </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
