/**
 * Home Page — Code Reels UI/UX Pro Max Revamp
 * Addictive, beautiful, conversion-focused
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { useGlobalStats } from '../../hooks/use-progress';
import { useCredits } from '../../context/CreditsContext';
import { ProgressStorage } from '../../services/storage.service';
import { useReducedMotion } from '../../hooks/use-reduced-motion';
import {
  Flame, Zap, Trophy, Target, Mic, Code, Brain,
  ChevronRight, Sparkles, TrendingUp, Star, Award, Rocket, Server, Plus,
  RotateCcw, Check, X, BookOpen, Calendar, Clock, Activity,
} from 'lucide-react';
import { PullToRefresh, SwipeableCard, SkeletonList } from '../mobile';

// ─── Learning Paths ───────────────────────────────────────────────────────────
const learningPaths = [
  { id: 'frontend', name: 'Frontend Developer', icon: Code, color: 'from-blue-500 to-cyan-500', description: 'Master React, JavaScript, and modern web development', channels: ['frontend', 'react-native', 'javascript', 'algorithms'], difficulty: 'Beginner Friendly', duration: '3-6 months', jobs: ['Frontend Developer', 'React Developer', 'UI Engineer'] },
  { id: 'backend', name: 'Backend Engineer', icon: Server, color: 'from-green-500 to-emerald-500', description: 'Build scalable APIs and microservices', channels: ['backend', 'database', 'system-design', 'algorithms'], difficulty: 'Intermediate', duration: '4-8 months', jobs: ['Backend Engineer', 'API Developer', 'Systems Engineer'] },
  { id: 'fullstack', name: 'Full Stack Developer', icon: Rocket, color: 'from-purple-500 to-pink-500', description: 'End-to-end application development', channels: ['frontend', 'backend', 'database', 'devops', 'system-design'], difficulty: 'Advanced', duration: '6-12 months', jobs: ['Full Stack Developer', 'Software Engineer', 'Tech Lead'] },
  { id: 'devops', name: 'DevOps Engineer', icon: Target, color: 'from-orange-500 to-red-500', description: 'Infrastructure, CI/CD, and cloud platforms', channels: ['devops', 'kubernetes', 'aws', 'terraform', 'docker'], difficulty: 'Advanced', duration: '4-8 months', jobs: ['DevOps Engineer', 'SRE', 'Cloud Engineer'] },
  { id: 'mobile', name: 'Mobile Developer', icon: Sparkles, color: 'from-pink-500 to-rose-500', description: 'iOS and Android app development', channels: ['react-native', 'ios', 'android', 'frontend'], difficulty: 'Intermediate', duration: '4-6 months', jobs: ['Mobile Developer', 'iOS Developer', 'Android Developer'] },
  { id: 'data', name: 'Data Engineer', icon: Brain, color: 'from-indigo-500 to-purple-500', description: 'Data pipelines, warehousing, and analytics', channels: ['data-engineering', 'database', 'python', 'aws'], difficulty: 'Advanced', duration: '6-10 months', jobs: ['Data Engineer', 'Analytics Engineer', 'ML Engineer'] },
];

// ─── Animation variants ───────────────────────────────────────────────────────
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.08 } } };

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-lg bg-white/5 ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/8 to-transparent" />
    </div>
  );
}

// ─── Greeting helper ──────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getStreakMotivation(streak: number) {
  if (streak === 0) return 'Start your streak today! 🚀';
  if (streak < 3) return `${streak} day streak — keep it going! 💪`;
  if (streak < 7) return `${streak} days strong — you're on fire! 🔥`;
  if (streak < 30) return `${streak} day streak — unstoppable! ⚡`;
  return `${streak} days — absolute legend! 🏆`;
}

// ─── Progress Ring ────────────────────────────────────────────────────────────
function ProgressRing({ pct, size = 56, stroke = 4, color = '#7c3aed' }: { pct: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
      />
    </svg>
  );
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────
function StatPill({ icon: Icon, value, label, color }: { icon: React.ElementType; value: string | number; label: string; color: string }) {
  return (
    <motion.div variants={fadeUp} className="flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl bg-white/5 border border-white/8 min-w-[80px]">
      <Icon className={`w-4 h-4 ${color}`} />
      <span className="text-lg font-bold leading-none">{value}</span>
      <span className="text-[10px] text-muted-foreground leading-none text-center">{label}</span>
    </motion.div>
  );
}

// ─── Quick Action Card ────────────────────────────────────────────────────────
function ActionCard({
  icon, title, subtitle, color, onClick, primary = false,
}: {
  icon: React.ReactNode; title: string; subtitle: string; color: string;
  onClick: () => void; primary?: boolean;
}) {
  return (
    <motion.button
      variants={fadeUp}
      whileHover={{ y: -3, boxShadow: `0 8px 32px rgba(0,0,0,0.4)` }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`group relative flex flex-col gap-3 p-4 rounded-2xl border text-left overflow-hidden transition-colors
        ${primary
          ? 'bg-gradient-to-br from-violet-600/30 to-cyan-500/20 border-violet-500/40 col-span-2 sm:col-span-1'
          : 'bg-white/4 border-white/8 hover:border-white/16'
        }`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity`} />
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${color} flex-shrink-0`}>
        {icon}
      </div>
      <div className="relative flex-1">
        <div className="font-semibold text-sm leading-tight">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{subtitle}</div>
      </div>
      <ChevronRight className="absolute top-4 right-4 w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
    </motion.button>
  );
}

// ─── Onboarding (new users) ───────────────────────────────────────────────────
function OnboardingScreen({ onStart }: { onStart: () => void }) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden pt-safe pb-safe">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-cyan-500/10 animate-gradient-shift" />
      {!prefersReducedMotion && [...Array(16)].map((_, i) => (
        <motion.div key={i} className="absolute w-1 h-1 bg-white/40 rounded-full"
          style={{ left: `${(i * 6.25) % 100}%`, top: `${(i * 13) % 100}%` }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }} />
      ))}

      <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-sm text-center space-y-10">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="w-24 h-24 mx-auto bg-gradient-to-br from-violet-600 to-cyan-500 rounded-[28px] flex items-center justify-center relative">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-cyan-500 rounded-[28px] blur-2xl opacity-50" />
          <Brain className="w-12 h-12 text-white relative z-10" strokeWidth={2.5} />
        </motion.div>

        <div className="space-y-4">
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="text-4xl font-bold leading-tight">
            Ace Your Tech Interview
            <br />
            <span className="gradient-text">Get Hired Faster</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
            className="text-muted-foreground text-base leading-relaxed">
            1000+ questions · AI voice interviews · Spaced repetition
          </motion.p>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
          className="space-y-3">
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={onStart}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-cyan-500 rounded-2xl font-bold text-lg text-white shadow-2xl shadow-violet-500/40 flex items-center justify-center gap-2">
            Start Practicing Now <ChevronRight className="w-5 h-5" />
          </motion.button>
          <p className="text-xs text-muted-foreground">Choose your path → Practice daily → Land your dream job</p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          className="flex items-center justify-center gap-6 text-sm">
          {[['12K+', 'Learners'], ['500K+', 'Solved'], ['85%', 'Success']].map(([n, l]) => (
            <div key={l} className="text-center">
              <div className="font-bold text-base">{n}</div>
              <div className="text-muted-foreground text-xs">{l}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── Daily Challenge Card ─────────────────────────────────────────────────────
const DAILY_CHALLENGES = [
  { question: 'Design a URL shortener service like bit.ly. Focus on scalability and analytics.', topic: 'System Design', difficulty: 'Medium' },
  { question: 'Explain the difference between process and thread. When would you use each?', topic: 'OS Concepts', difficulty: 'Easy' },
  { question: 'Implement a LRU cache with O(1) get and put operations.', topic: 'Algorithms', difficulty: 'Hard' },
  { question: 'How does React reconciliation work? What is the virtual DOM?', topic: 'Frontend', difficulty: 'Medium' },
  { question: 'Design a distributed rate limiter for a high-traffic API.', topic: 'System Design', difficulty: 'Hard' },
  { question: 'What are SOLID principles? Give an example of each.', topic: 'Engineering', difficulty: 'Medium' },
  { question: 'Explain CAP theorem and how it applies to distributed databases.', topic: 'Database', difficulty: 'Hard' },
];

function DailyChallengeCard({ onNavigate }: { onNavigate: (path: string) => void }) {
  const todayIndex = new Date().getDate() % DAILY_CHALLENGES.length;
  const challenge = DAILY_CHALLENGES[todayIndex];
  const doneKey = `daily-challenge-${new Date().toISOString().split('T')[0]}`;
  const [done, setDone] = React.useState(() => localStorage.getItem(doneKey) === 'true');

  const diffColor = challenge.difficulty === 'Easy' ? 'text-green-400 bg-green-500/15 border-green-500/25'
    : challenge.difficulty === 'Medium' ? 'text-amber-400 bg-amber-500/15 border-amber-500/25'
    : 'text-red-400 bg-red-500/15 border-red-500/25';

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className={`relative p-[1px] rounded-2xl overflow-hidden ${done ? '' : 'bg-gradient-to-br from-violet-500/50 via-cyan-500/30 to-transparent'}`}>
      <div className={`relative p-4 rounded-2xl overflow-hidden ${done ? 'bg-green-500/8 border border-green-500/25' : 'bg-[#0d0d14]'}`}>
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-15"
        style={{ background: done ? '#10b981' : 'radial-gradient(circle, #ff0080, #ff8c00)' }} />
      <div className="relative space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Today's Challenge</span>
          </div>
          {done && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/20 border border-green-500/30">
              <Check className="w-3 h-3 text-green-400" />
              <span className="text-xs font-semibold text-green-400">Done!</span>
            </div>
          )}
        </div>
        <p className="text-sm font-medium leading-snug line-clamp-2">
          {challenge.question.slice(0, 80)}{challenge.question.length > 80 ? '…' : ''}
        </p>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${diffColor}`}>{challenge.difficulty}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/8 border border-white/10 text-muted-foreground">{challenge.topic}</span>
          <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1"><Award className="w-3 h-3 text-amber-400" />+50 XP</span>
        </div>
        {!done ? (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => { localStorage.setItem(doneKey, 'true'); setDone(true); onNavigate('/training'); }}
            className="w-full py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #ff0080, #ff8c00)' }}>
            Start Challenge <ChevronRight className="w-4 h-4" />
          </motion.button>
        ) : (
          <button onClick={() => onNavigate('/training')}
            className="w-full py-2.5 rounded-xl font-semibold text-sm text-green-400 border border-green-500/25 hover:bg-green-500/10 transition-colors">
            Practice More →
          </button>
        )}
      </div>
    </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function HomePage() {
  const [, setLocation] = useLocation();
  const { stats: activityStats } = useGlobalStats();
  const { balance, level, streak: ctxStreak } = useCredits();
  const prefersReducedMotion = useReducedMotion();

  const totalCompleted = ProgressStorage.getAllCompletedIds().size;

  // ── Curated / active paths ──
  const [curatedPaths, setCuratedPaths] = React.useState<any[]>([]);
  const [activePaths, setActivePaths] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadCuratedPaths() {
      try {
        setIsLoading(true);
        const basePath = import.meta.env.BASE_URL || '/';
        const response = await fetch(`${basePath}data/learning-paths.json`);
        if (response.ok) setCuratedPaths(await response.json());
      } catch (e) { console.error('Failed to load curated paths:', e); }
      finally { setIsLoading(false); }
    }
    loadCuratedPaths();
  }, []);

  React.useEffect(() => {
    try {
      let saved = localStorage.getItem('activeLearningPaths');
      if (!saved) {
        const old = localStorage.getItem('activeLearningPath');
        if (old) {
          const ids = [JSON.parse(old)];
          localStorage.setItem('activeLearningPaths', JSON.stringify(ids));
          saved = JSON.stringify(ids);
        }
      }
      if (!saved) { setActivePaths([]); return; }
      const pathIds = JSON.parse(saved);
      if (!Array.isArray(pathIds)) { setActivePaths([]); return; }

      const customPaths = JSON.parse(localStorage.getItem('customLearningPaths') || '[]');
      const paths = pathIds.map((pathId: string) => {
        if (pathId.startsWith?.('custom-')) {
          const cp = customPaths.find((p: any) => p.id === pathId);
          if (cp) return { id: cp.id, name: cp.name, icon: Brain, color: 'from-purple-500 to-pink-500', description: 'Your custom learning journey', channels: cp.channels || [], certifications: cp.certifications || [], difficulty: 'Custom', duration: 'Self-paced', totalQuestions: 0, jobs: ['Custom Path'], skills: [], salary: 'Varies' };
        }
        const cp2 = curatedPaths.find((p: any) => p.id === pathId);
        if (cp2) {
          const channelIds = Array.isArray(cp2.channels) ? cp2.channels : JSON.parse(cp2.channels || '[]');
          return { id: cp2.id, name: cp2.title, icon: Brain, color: 'from-green-500 to-emerald-500', description: cp2.description, channels: channelIds, difficulty: cp2.difficulty.charAt(0).toUpperCase() + cp2.difficulty.slice(1), duration: `${cp2.estimatedHours}h`, totalQuestions: Array.isArray(cp2.questionIds) ? cp2.questionIds.length : JSON.parse(cp2.questionIds || '[]').length, jobs: Array.isArray(cp2.learningObjectives) ? cp2.learningObjectives.slice(0, 3) : JSON.parse(cp2.learningObjectives || '[]').slice(0, 3), skills: Array.isArray(cp2.tags) ? cp2.tags.slice(0, 5) : JSON.parse(cp2.tags || '[]').slice(0, 5), salary: 'Varies' };
        }
        return learningPaths.find(p => p.id === pathId);
      }).filter(Boolean);
      setActivePaths(paths);
    } catch { setActivePaths([]); }
  }, [curatedPaths]);

  // ── Streak (fallback to context streak) ──
  const streak = React.useMemo(() => {
    try {
      let s = 0;
      for (let i = 0; i < 365; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        if (activityStats?.find(x => x.date === d.toISOString().split('T')[0])) s++;
        else break;
      }
      return s || ctxStreak;
    } catch { return ctxStreak; }
  }, [activityStats, ctxStreak]);

  // ── XP / level ──
  const xpInLevel = balance % 100;

  // ── Resume path ──
  const resumePath = React.useMemo(() => {
    try {
      const s = localStorage.getItem('lastSession');
      if (!s) return null;
      const session = JSON.parse(s);
      if ((Date.now() - session.timestamp) / 3_600_000 > 24 || activePaths.length === 0) return null;
      return session;
    } catch { return null; }
  }, [activePaths]);

  // ── Recent activity ──
  const recentActivity = React.useMemo(() => {
    try {
      const historyKeys = Object.keys(localStorage).filter(k => k.startsWith('history-'));
      const all: { channelId: string; questionId: string; timestamp: number }[] = [];
      historyKeys.forEach(key => {
        const ch = key.replace('history-', '');
        const items = JSON.parse(localStorage.getItem(key) || '[]');
        items.forEach((item: any) => all.push({ channelId: ch, questionId: item.questionId, timestamp: item.timestamp }));
      });
      return all.sort((a, b) => b.timestamp - a.timestamp).slice(0, 3);
    } catch { return []; }
  }, []);

  // ── Topics mastered (channels with ≥5 completions) ──
  const topicsMastered = React.useMemo(() => {
    try {
      return Object.keys(localStorage).filter(k => k.startsWith('progress-')).filter(k => {
        const ids = JSON.parse(localStorage.getItem(k) || '[]');
        return ids.length >= 5;
      }).length;
    } catch { return 0; }
  }, []);

  // ── Questions answered today ──
  const questionsToday = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return activityStats?.find(x => x.date === today)?.count ?? 0;
  }, [activityStats]);

  // ── Helpers ──
  const removeActivePath = (pathId: string) => {
    try {
      const ids = JSON.parse(localStorage.getItem('activeLearningPaths') || '[]');
      localStorage.setItem('activeLearningPaths', JSON.stringify(ids.filter((id: string) => id !== pathId)));
      window.location.reload();
    } catch (e) { console.error(e); }
  };

  const handleRefresh = async () => window.location.reload();

  const relativeTime = (ts: number) => {
    const diff = (Date.now() - ts) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  // ── Onboarding gate ──
  if (activePaths.length === 0 && !isLoading) {
    return <OnboardingScreen onStart={() => setLocation('/learning-paths')} />;
  }

  // ── Render ──
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Sticky top bar ── */}
      <div className="sticky top-[calc(56px+env(safe-area-inset-top,0px))] lg:top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/25">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="font-bold text-sm">{streak}</span>
              <span className="text-[10px] text-muted-foreground">day</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/15 border border-violet-500/25">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="font-bold text-sm">{balance}</span>
              <span className="text-[10px] text-muted-foreground">XP</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/25">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-sm">Lv {level}</span>
            </div>
          </div>
          {/* XP progress bar */}
          <div className="hidden sm:flex items-center gap-2 flex-1 max-w-[140px]">
            <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full"
                initial={{ width: 0 }} animate={{ width: `${xpInLevel}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
            </div>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">{xpInLevel}/100</span>
          </div>
        </div>
      </div>

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-8 pb-safe">

          {/* ══ HERO ══════════════════════════════════════════════════════════ */}
          <motion.div variants={stagger} initial="hidden" animate="show"
            className="relative rounded-3xl overflow-hidden p-6 border border-white/8"
            style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.18) 0%, rgba(99,102,241,0.10) 50%, rgba(6,182,212,0.12) 100%)' }}>
            {!prefersReducedMotion && (
              <motion.div className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-30"
                style={{ background: 'radial-gradient(circle, #7c3aed, #06b6d4)' }}
                animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.4, 0.25] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} />
            )}
            <div className="relative space-y-4">
              <motion.div variants={fadeUp}>
                <h1 className="text-2xl font-bold">{getGreeting()}, Dev! 👋</h1>
                <p className="text-sm text-muted-foreground mt-0.5">{getStreakMotivation(streak)}</p>
              </motion.div>

              {/* Streak + XP badges row */}
              <motion.div variants={fadeUp} className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/30">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="font-bold text-sm text-orange-300">{streak} day streak</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/20 border border-violet-500/30">
                  <Zap className="w-4 h-4 text-violet-400" />
                  <span className="font-bold text-sm text-violet-300">{balance} XP</span>
                </div>
              </motion.div>

              {/* XP level bar */}
              <motion.div variants={fadeUp} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Level {level}</span>
                  <span>{xpInLevel}/100 XP → Level {level + 1}</span>
                </div>
                <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500"
                    initial={{ width: 0 }} animate={{ width: `${xpInLevel}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }} />
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* ══ STATS ROW ═════════════════════════════════════════════════════ */}
          <div>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Your Stats</h2>
            <motion.div variants={stagger} initial="hidden" animate="show"
              className="flex gap-3 overflow-x-auto pb-1 custom-scrollbar -mx-4 px-4">
              <StatPill icon={Zap} value={questionsToday} label="Answered Today" color="text-yellow-400" />
              <StatPill icon={Flame} value={streak} label="Day Streak" color="text-orange-400" />
              <StatPill icon={BookOpen} value={topicsMastered} label="Topics Mastered" color="text-cyan-400" />
              <StatPill icon={Sparkles} value={balance} label="Total XP" color="text-violet-400" />
              <StatPill icon={Trophy} value={totalCompleted} label="Solved" color="text-amber-400" />
            </motion.div>
          </div>

          {/* ══ QUICK ACTIONS ═════════════════════════════════════════════════ */}
          <div>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Practice</h2>
            <motion.div variants={stagger} initial="hidden" animate="show"
              className="grid grid-cols-2 gap-3">
              <ActionCard primary icon={<BookOpen className="w-5 h-5 text-white" />}
                title="Swipe Learn" subtitle="Browse questions like reels"
                color="from-violet-600 to-indigo-500"
                onClick={() => activePaths[0] ? setLocation(`/channel/${activePaths[0].channels[0]}`) : setLocation('/learning-paths')} />
              <ActionCard icon={<Mic className="w-5 h-5 text-white" />}
                title="Voice Interview" subtitle="AI mock interview"
                color="from-blue-500 to-cyan-500"
                onClick={() => setLocation('/voice-interview')} />
              <ActionCard icon={<Target className="w-5 h-5 text-white" />}
                title="Daily Test" subtitle="20-question quiz"
                color="from-orange-500 to-red-500"
                onClick={() => setLocation('/tests')} />
              <ActionCard icon={<Trophy className="w-5 h-5 text-white" />}
                title="My Path" subtitle="Track your journey"
                color="from-amber-500 to-orange-500"
                onClick={() => setLocation('/learning-paths')} />
            </motion.div>
          </div>

          {/* ══ DAILY CHALLENGE ═══════════════════════════════════════════════ */}
          <DailyChallengeCard onNavigate={setLocation} />

          {/* ══ CONTINUE LEARNING ════════════════════════════════════════════ */}
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-28 w-full rounded-2xl" />
            </div>
          ) : activePaths.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Continue Learning</h2>
                <button onClick={() => setLocation('/learning-paths')}
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors">Browse All →</button>
              </div>
              <div className="space-y-3">
                {activePaths.slice(0, 2).map((path, i) => {
                  const Icon = path.icon;
                  const allIds = ProgressStorage.getAllCompletedIds();
                  const done = path.questionIds?.filter((id: string) => allIds.has(id)).length ?? Math.min(totalCompleted, path.totalQuestions || 500);
                  const total = path.totalQuestions || path.questionIds?.length || 500;
                  const pct = Math.min(Math.round((done / total) * 100), 100);
                  return (
                    <SwipeableCard key={path.id}
                      leftAction={{ icon: <Check className="w-5 h-5" />, label: 'Continue', color: 'bg-green-500', onAction: () => setLocation(`/channel/${path.channels[0]}`) }}
                      rightAction={{ icon: <X className="w-5 h-5" />, label: 'Remove', color: 'bg-red-500', onAction: () => removeActivePath(path.id) }}>
                      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                        className="relative flex items-center gap-4 p-4 rounded-2xl bg-white/4 border border-white/8 overflow-hidden">
                        <div className={`absolute inset-0 bg-gradient-to-r ${path.color} opacity-5`} />
                        <div className="relative flex-shrink-0">
                          <ProgressRing pct={pct} size={52} stroke={4} color="#7c3aed" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-foreground" />
                          </div>
                        </div>
                        <div className="relative flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">{path.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{done}/{total} questions · {pct}%</div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {path.channels.slice(0, 3).map((ch: string) => (
                              <button key={ch} onClick={() => setLocation(`/channel/${ch}`)}
                                className="px-2 py-0.5 bg-white/8 hover:bg-white/14 rounded-full text-[10px] transition-colors">{ch}</button>
                            ))}
                          </div>
                        </div>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => setLocation(`/channel/${path.channels[0]}`)}
                          className={`relative flex-shrink-0 px-3 py-2 bg-gradient-to-r ${path.color} rounded-xl text-xs font-bold text-white`}>
                          Resume
                        </motion.button>
                      </motion.div>
                    </SwipeableCard>
                  );
                })}
                {activePaths.length > 2 && (
                  <button onClick={() => setLocation('/learning-paths')}
                    className="w-full py-2.5 rounded-xl border border-white/8 text-sm text-muted-foreground hover:text-foreground hover:border-white/16 transition-colors">
                    +{activePaths.length - 2} more paths
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ══ RESUME SESSION ════════════════════════════════════════════════ */}
          {resumePath && (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                  <RotateCcw className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Pick up where you left off</div>
                  <div className="text-xs text-muted-foreground">{resumePath.channelName} · {resumePath.questionTitle?.slice(0, 50)}</div>
                </div>
              </div>
              <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                <motion.div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                  initial={{ width: 0 }} animate={{ width: `${(resumePath.progress || 0) * 100}%` }} transition={{ duration: 0.8 }} />
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setLocation(`/channel/${resumePath.channelId}?question=${resumePath.questionId}`)}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2">
                Resume Learning <ChevronRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          )}

          {/* ══ RECENT ACTIVITY ═══════════════════════════════════════════════ */}
          {recentActivity.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent Activity</h2>
              <div className="space-y-2">
                {recentActivity.map((item, i) => (
                  <motion.div key={`${item.questionId}-${i}`}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/6">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 border border-green-500/25 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">Completed a question</div>
                      <div className="text-[10px] text-muted-foreground capitalize">{item.channelId.replace(/-/g, ' ')}</div>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      {relativeTime(item.timestamp)}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* ══ ADD PATH CTA (if < 3 paths) ══════════════════════════════════ */}
          {activePaths.length < 3 && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => setLocation('/learning-paths')}
              className="w-full py-4 rounded-2xl border border-dashed border-white/16 hover:border-violet-500/40 hover:bg-violet-500/5 transition-all flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <Plus className="w-4 h-4" /> Add a learning path
            </motion.button>
          )}

        </div>
      </PullToRefresh>
    </div>
  );
}
