import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Search, ChevronRight, Layers, Type, GitBranch, Network, BarChart2, SortAsc, CheckCircle2, Clock, Code2, Circle, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { getProgress } from '@/lib/challenge-progress';
import { loadAllChallenges } from '@/lib/challenges-loader';
import type { ChallengeListItem, ChallengeStatus, Difficulty } from '@/types/challenges';
import { NetworkError, NoResults } from '@/components/google/ErrorStates';

const GoogleColors = {
  blue: '#4285F4',
  red: '#EA4335',
  yellow: '#FBBC04',
  green: '#34A853',
};

const DIFFICULTIES: Array<'All' | Difficulty> = ['All', 'easy', 'medium', 'hard'];

const DIFFICULTY_ICONS: Record<Difficulty, typeof Circle> = {
  easy: Circle,
  medium: AlertCircle,
  hard: CheckCircle2,
};

const DIFFICULTY_STYLES: Record<Difficulty, { bg: string; text: string; border: string }> = {
  easy: { bg: `bg-[${GoogleColors.green}]/10`, text: `text-[${GoogleColors.green}]`, border: `border-[${GoogleColors.green}]/30` },
  medium: { bg: `bg-[${GoogleColors.yellow}]/10`, text: `text-[${GoogleColors.yellow}]`, border: `border-[${GoogleColors.yellow}]/30` },
  hard: { bg: `bg-[${GoogleColors.red}]/10`, text: `text-[${GoogleColors.red}]`, border: `border-[${GoogleColors.red}]/30` },
};

const CATEGORIES = [
  { label: 'Arrays', tag: 'arrays', icon: Layers },
  { label: 'Strings', tag: 'strings', icon: Type },
  { label: 'DP', tag: 'dynamic-programming', icon: GitBranch },
  { label: 'Trees', tag: 'trees', icon: Network },
  { label: 'Graphs', tag: 'graphs', icon: BarChart2 },
  { label: 'Sorting', tag: 'sorting', icon: SortAsc },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 }
};

const stagger = {
  show: { transition: { staggerChildren: 0.05 } }
};

export default function CodeChallengesIndex() {
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
        <Spinner className={`size-8 text-[${GoogleColors.blue}]`} />
      </div>
    );
  }

  if (error) {
    return (
      <NetworkError
        title="Failed to load challenges"
        message="We couldn't load the challenges. Your internet connection may be unstable."
        onRetry={() => {
          setError(null);
          setLoading(true);
          loadAllChallenges()
            .then(setChallenges)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8 pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={`min-w-[48px] w-10 min-h-[48px] h-10 rounded-2xl bg-gradient-to-br from-[${GoogleColors.blue}] to-[${GoogleColors.blue}80] flex items-center justify-center`}>
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <h1 
              className="text-3xl font-normal text-foreground"
              style={{ fontFamily: "'Google Sans Display', 'Roboto', sans-serif", letterSpacing: '-0.02em' }}
            >
              Code Challenges
            </h1>
          </div>
          <p className="text-base text-foreground/70 ml-12">
            {solvedCount} of {challenges.length} solved
          </p>
        </motion.div>

        {/* Search Bar - Google Style */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="relative mb-6"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9AA0A6]" />
           <Input
             placeholder="Search challenges..."
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="pl-11 text-white placeholder:text-[#9AA0A6] focus-visible:ring-2 focus-visible:ring-[${GoogleColors.blue}] focus-visible:ring-offset-2 transition-all duration-200"
           />
        </motion.div>

        {/* Filter Chips - Google Style */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="space-y-3 mb-8"
        >
          {/* Difficulty filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-[${GoogleColors.blue}] focus-visible:ring-offset-2 ${
                   difficulty === d
                     ? 'bg-[${GoogleColors.blue}] text-white border-[${GoogleColors.blue}]'
: 'bg-[#202124] text-foreground/70 border-[#3C4043] hover:bg-[#303134] hover:border-[#5F6368]'
                 }`}
               >
                 {d === 'All' ? 'All' : d.charAt(0).toUpperCase() + d.slice(1)}
               </button>
             ))}
           </div>

           {/* Category filters */}
           <div className="flex items-center gap-2 flex-wrap">
             {CATEGORIES.map(({ label, tag, icon: Icon }) => (
               <button
                 key={tag}
                 onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                 className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-[${GoogleColors.blue}] focus-visible:ring-offset-2 ${
                   activeTag === tag
                     ? 'bg-[${GoogleColors.blue}]/20 text-[${GoogleColors.blue}] border-[${GoogleColors.blue}]/50'
                     : 'bg-[#202124] text-foreground/70 border-[#3C4043] hover:bg-[#303134] hover:border-[#5F6368]'
                 }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Challenge Cards Grid */}
        {filtered.length === 0 ? (
          <NoResults
            title="No challenges found"
            message="No challenges match your current filters."
            onClearSearch={() => { setSearch(''); setDifficulty('All'); setActiveTag(null); }}
            suggestions={['arrays', 'strings', 'dynamic-programming']}
            query={search}
          />
        ) : (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filtered.map((challenge, idx) => {
              const status: ChallengeStatus =
                progress.challenges[challenge.id]?.status ?? 'unsolved';
              const diffStyle = DIFFICULTY_STYLES[challenge.difficulty];

              return (
                <motion.button
                  key={challenge.id}
                  variants={fadeUp}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => navigate(`/code/challenges/${challenge.id}`)}
                   className="group text-left p-5 rounded-2xl border border-[#3C4043] bg-[#202124] hover:bg-[#303134] hover:border-[#5F6368] cursor-pointer transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[${GoogleColors.blue}] focus-visible:ring-offset-2"
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between mb-3">
                     <div className="flex items-center gap-2">
                       {status === 'solved' && (
                         <CheckCircle2 className="w-4 h-4 text-[${GoogleColors.green}]" aria-label="Solved" />
                       )}
                       {status === 'attempted' && (
                         <AlertCircle className="w-4 h-4 text-[${GoogleColors.yellow}]" aria-label="Attempted" />
                       )}
                       <span className="text-xs text-foreground/70">#{idx + 1}</span>
                     </div>
                     <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-medium border ${diffStyle.bg} ${diffStyle.text} ${diffStyle.border}`}>
                       {(() => { const Icon = DIFFICULTY_ICONS[challenge.difficulty]; return <Icon className="w-3 h-3" />; })()}
                       {challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
                     </div>
                  </div>

                  {/* Title */}
                  <h3 className={`font-medium text-white text-base mb-2 line-clamp-2 group-hover:text-[${GoogleColors.blue}] transition-colors`} style={{ fontFamily: "'Google Sans', 'Roboto', sans-serif" }}>
                    {challenge.title}
                  </h3>

                  {/* Tags preview */}
                  {challenge.tags.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mb-3">
                      {challenge.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1.5 rounded-2xl bg-[#303134] text-foreground/70 text-xs border border-[#3C4043]"
                        >
                          {tag}
                        </span>
                      ))}
                      {challenge.tags.length > 2 && (
                        <span className="text-foreground/70 text-xs">+{challenge.tags.length - 2}</span>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                   <div className="flex items-center justify-between pt-3 border-t border-[#3C4043]/50">
 <div className="flex items-center gap-1 text-xs text-foreground/70">
                        <Clock className="w-3 h-3" />
                       <span>{challenge.estimatedMinutes}m</span>
                     </div>
 <div className="flex items-center gap-1 text-xs">
                        {status === 'solved' && <CheckCircle2 className="w-3 h-3 text-[${GoogleColors.green}]" />}
                        {status === 'attempted' && <AlertCircle className="w-3 h-3 text-[${GoogleColors.yellow}]" />}
                        {status === 'unsolved' && <Circle className="w-3 h-3 text-foreground/50" />}
                        <span className={status === 'solved' ? 'text-[${GoogleColors.green}]' : status === 'attempted' ? 'text-[${GoogleColors.yellow}]' : 'text-foreground/70'}>
                         {status === 'solved' ? 'Solved' : status === 'attempted' ? 'Attempted' : 'Unsolved'}
                       </span>
                       <ChevronRight className="w-3.5 h-3.5 text-foreground/70 group-hover:text-[${GoogleColors.blue}] group-hover:translate-x-0.5 transition-all" />
                     </div>
                   </div>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}