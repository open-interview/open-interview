/**
 * Home Page — Material Design 3 revamp
 * M3 surfaces, type scale, 8dp grid, no decorative noise
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
  ChevronRight, TrendingUp, Award, Plus,
  RotateCcw, Check, X, BookOpen, Calendar, Clock, Settings2,
} from 'lucide-react';
import { PullToRefresh, SwipeableCard } from '../mobile';
import { useUserPreferences } from '../../context/UserPreferencesContext';
import { getRoleDefaultChannels, isPersonalized } from '../../lib/personalization';
import { allChannelsConfig } from '../../lib/channels-config';
import { getInProgressSessions } from '../../lib/resume-service';

// ─── Animation variants ───────────────────────────────────────────────────────
const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.2, 0, 0, 1] } } };
const stagger = { show: { transition: { staggerChildren: 0.07 } } };

// ─── M3 Shimmer Skeleton ──────────────────────────────────────────────────────
function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-muted ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

// ─── M3 Suggestion Chip ───────────────────────────────────────────────────────
function SuggestionChip({ label, icon: Icon, onClick }: {
  label: string; icon?: React.ElementType; onClick: () => void;
}) {
  return (
    <motion.button
      variants={fadeUp}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 min-h-[48px] h-8 px-4 rounded-full border border-border/60 bg-background text-foreground hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      style={{ fontSize: 14, fontWeight: 500 }}
    >
      {Icon && <Icon className="w-3.5 h-3.5 text-primary" />}
      {label}
    </motion.button>
  );
}

// ─── M3 Metric Card (tonal container) ────────────────────────────────────────
function MetricCard({ value, label, toneColor, onClick }: {
  value: string | number; label: string; toneColor: string; onClick?: () => void;
}) {
  return (
    <motion.button
      variants={fadeUp}
      onClick={onClick}
      className="flex-1 flex flex-col items-center gap-1 py-4 px-2 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      style={{ backgroundColor: `color-mix(in srgb, ${toneColor} 12%, var(--background, white))` }}
    >
      <span className="text-2xl font-medium leading-none" style={{ color: toneColor }}>{value}</span>
      <span className="text-center leading-tight text-foreground/70" style={{ fontSize: 11, fontWeight: 500 }}>{label}</span>
    </motion.button>
  );
}

// ─── Progress Ring ────────────────────────────────────────────────────────────
function ProgressRing({ pct, size = 52, stroke = 4 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.12} strokeWidth={stroke} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="var(--primary)" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - (pct / 100) * circ }}
        transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 }}
      />
    </svg>
  );
}

// ─── Greeting ─────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ─── Onboarding Empty State (M3 formula) ─────────────────────────────────────
function OnboardingScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
        className="w-full max-w-sm text-center space-y-6"
      >
        {/* Illustration */}
        <div className="w-24 h-24 mx-auto rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 12%, transparent)' }}>
          <Brain className="w-12 h-12 text-primary" />
        </div>
        {/* Headline — M3 Headline Medium 28/36 */}
        <div className="space-y-2">
          <h1 className="font-normal text-foreground" style={{ fontSize: 28, lineHeight: '36px' }}>
            Ace your tech interview
          </h1>
          {/* Body — M3 Body Large 16/24 */}
          <p className="text-foreground/60" style={{ fontSize: 16, lineHeight: '24px' }}>
            1000+ questions · AI voice interviews · Spaced repetition
          </p>
        </div>
        {/* CTA — M3 Filled Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onStart}
          data-testid="button-start-practicing"
          className="inline-flex items-center justify-center gap-2 min-h-[48px] h-10 px-6 rounded-full font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', fontSize: 14, fontWeight: 500 }}
        >
          Start Practicing
          <ChevronRight className="w-4 h-4" />
        </motion.button>
        {/* Social proof */}
        <div className="flex items-center justify-center gap-8">
          {[['12K+', 'Learners'], ['1000+', 'Questions'], ['85%', 'Success']].map(([n, l]) => (
            <div key={l} className="text-center">
              <div className="font-medium text-foreground" style={{ fontSize: 16 }}>{n}</div>
              <div className="text-foreground/60" style={{ fontSize: 12 }}>{l}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Daily Challenge Card — M3 Filled Card (primary container) ───────────────
const DAILY_CHALLENGES = [
  { question: 'Design a URL shortener service like bit.ly. Focus on scalability and analytics.', topic: 'System Design', channelId: 'system-design', difficulty: 'Medium' },
  { question: 'Explain the difference between process and thread. When would you use each?', topic: 'OS Concepts', channelId: 'operating-systems', difficulty: 'Easy' },
  { question: 'Implement a LRU cache with O(1) get and put operations.', topic: 'Algorithms', channelId: 'algorithms', difficulty: 'Hard' },
  { question: 'How does React reconciliation work? What is the virtual DOM?', topic: 'Frontend', channelId: 'frontend', difficulty: 'Medium' },
  { question: 'Design a distributed rate limiter for a high-traffic API.', topic: 'System Design', channelId: 'system-design', difficulty: 'Hard' },
  { question: 'What are SOLID principles? Give an example of each.', topic: 'Engineering', channelId: 'backend', difficulty: 'Medium' },
  { question: 'Explain CAP theorem and how it applies to distributed databases.', topic: 'Database', channelId: 'database', difficulty: 'Hard' },
];

function DailyChallengeCard({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { preferences } = useUserPreferences();
  const { subscribedChannels, role } = preferences;
  const relevant = subscribedChannels.length > 0 ? subscribedChannels : getRoleDefaultChannels(role ?? '');
  const pool = DAILY_CHALLENGES.filter(c => relevant.includes(c.channelId));
  const challenges = pool.length > 0 ? pool : DAILY_CHALLENGES;
  const challenge = challenges[new Date().getDate() % challenges.length];
  const doneKey = `daily-challenge-${new Date().toISOString().split('T')[0]}`;
  const [done, setDone] = React.useState(() => localStorage.getItem(doneKey) === 'true');

  const diffColor = challenge.difficulty === 'Easy'
    ? { text: '#34A853', bg: 'color-mix(in srgb, #34A853 12%, transparent)', border: 'color-mix(in srgb, #34A853 30%, transparent)' }
    : challenge.difficulty === 'Medium'
    ? { text: '#FBBC04', bg: 'color-mix(in srgb, #FBBC04 12%, transparent)', border: 'color-mix(in srgb, #FBBC04 30%, transparent)' }
    : { text: '#EA4335', bg: 'color-mix(in srgb, #EA4335 12%, transparent)', border: 'color-mix(in srgb, #EA4335 30%, transparent)' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      // M3 Filled Card — primary container color
      className="rounded-2xl p-4 space-y-3"
      style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 10%, var(--card, white))' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          {/* Label Large 14/20 */}
          <span className="font-medium text-primary" style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Today's Challenge
          </span>
        </div>
        {done && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: 'color-mix(in srgb, #34A853 15%, transparent)', color: '#34A853' }}>
            <Check className="w-3 h-3" /> Done
          </span>
        )}
      </div>

      {/* Question — Body Large 16/24 */}
      <p className="font-medium text-foreground leading-snug" style={{ fontSize: 15, lineHeight: '22px' }}>
        {challenge.question.length > 90 ? challenge.question.slice(0, 90) + '…' : challenge.question}
      </p>

      {/* Chips row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="px-2 py-0.5 rounded-full text-xs font-medium border"
          style={{ color: diffColor.text, backgroundColor: diffColor.bg, borderColor: diffColor.border }}>
          {challenge.difficulty}
        </span>
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground/70 border border-border/40">
          {challenge.topic}
        </span>
        <span className="ml-auto flex items-center gap-1 text-xs text-foreground/60">
          <Award className="w-3 h-3 text-amber-400" /> +50 XP
        </span>
      </div>

      {/* CTA */}
      {!done ? (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { localStorage.setItem(doneKey, 'true'); setDone(true); onNavigate('/voice-interview'); }}
          data-testid="button-start-daily-challenge"
          className="w-full min-h-[48px] h-10 rounded-full font-medium flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', fontSize: 14, fontWeight: 500 }}
        >
          Start challenge <ChevronRight className="w-4 h-4" />
        </motion.button>
      ) : (
        <button
          onClick={() => onNavigate('/voice-interview')}
          className="w-full min-h-[48px] h-10 rounded-full font-medium border transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          style={{ fontSize: 14, fontWeight: 500, color: '#34A853', borderColor: 'color-mix(in srgb, #34A853 30%, transparent)' }}
        >
          Practice More →
        </button>
      )}
    </motion.div>
  );
}

// ─── My Topics Feed ───────────────────────────────────────────────────────────
function MyTopicsFeed({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { preferences } = useUserPreferences();
  const { subscribedChannels: ids, onboardingComplete } = preferences;
  const channels = isPersonalized(onboardingComplete, ids)
    ? allChannelsConfig.filter(c => !c.isCertification && ids.includes(c.id))
    : [];

  if (!onboardingComplete) return null;

  if (channels.length === 0) {
    return (
      <motion.button
        variants={fadeUp}
        onClick={() => onNavigate('/channels')}
        className="w-full py-4 rounded-2xl border border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-foreground/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        style={{ fontSize: 14 }}
      >
        <Plus className="w-4 h-4 text-primary" />
        Add topics to personalize your feed
      </motion.button>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        {/* Label Medium 12/16 */}
        <span className="text-foreground/60" style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>My Topics</span>
        <button
          onClick={() => onNavigate('/manage-subscriptions')}
          className="flex items-center gap-1 text-primary hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary px-2 py-1 rounded"
          style={{ fontSize: 12, fontWeight: 500 }}
        >
          <Settings2 className="w-3 h-3" /> Manage
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {channels.map(ch => (
          <motion.button
            key={ch.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate(`/channel/${ch.id}`)}
            className="flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl bg-card border border-border/40 hover:border-primary/30 transition-colors min-w-[80px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="min-w-[48px] w-8 min-h-[48px] h-8 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 12%, transparent)' }}>
              <BookOpen className="w-4 h-4 text-primary" />
            </div>
            <span className="text-center leading-tight line-clamp-2" style={{ fontSize: 11, fontWeight: 500 }}>{ch.name}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ─── Quick Actions — M3 Suggestion Chips ─────────────────────────────────────
function QuickActions({ onNavigate, firstChannelId }: { onNavigate: (p: string) => void; firstChannelId?: string }) {
  const actions = [
    { label: 'Swipe Learn', icon: BookOpen, path: firstChannelId ? `/channel/${firstChannelId}` : '/learning-paths' },
    { label: 'Voice Interview', icon: Mic, path: '/voice-interview' },
    { label: 'Daily Test', icon: Target, path: '/tests' },
    { label: 'Code Challenges', icon: Code, path: '/coding' },
  ];
  return (
    <div>
      <span className="block mb-3 text-foreground/60" style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        Practice
      </span>
      <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-wrap gap-2">
        {actions.map(a => (
          <SuggestionChip key={a.label} label={a.label} icon={a.icon} onClick={() => onNavigate(a.path)} />
        ))}
      </motion.div>
    </div>
  );
}

// ─── Continue Learning — M3 Elevated Card with expand affordance ──────────────
function ContinueLearningSection({
  activePaths, totalCompleted, onNavigate, onRemove,
}: {
  activePaths: any[]; totalCompleted: number; onNavigate: (p: string) => void; onRemove: (id: string) => void;
}) {
  if (activePaths.length === 0) return null;
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-foreground/60" style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Continue Learning
        </span>
        <button onClick={() => onNavigate('/learning-paths')}
          className="text-primary hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary px-2 py-1 rounded"
          style={{ fontSize: 12, fontWeight: 500 }}>
          Browse All →
        </button>
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
              leftAction={{ icon: <Check className="w-5 h-5" />, label: 'Continue', color: 'bg-green-500', onAction: () => onNavigate(`/channel/${path.channels[0]}`) }}
              rightAction={{ icon: <X className="w-5 h-5" />, label: 'Remove', color: 'bg-red-500', onAction: () => onRemove(path.id) }}>
              {/* M3 Elevated Card — Level 1 elevation */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-card"
                style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.08), 0 1px 3px 1px rgba(0,0,0,0.06)' }}
              >
                <div className="relative flex-shrink-0">
                  <ProgressRing pct={pct} size={52} stroke={4} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-foreground" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  {/* Title Medium 16/24 */}
                  <div className="font-medium text-foreground truncate" style={{ fontSize: 14, fontWeight: 500 }}>{path.name}</div>
                  {/* Body Small 12/16 */}
                  <div className="text-foreground/60 mt-0.5" style={{ fontSize: 12 }}>{done}/{total} questions · {pct}%</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {path.channels.slice(0, 3).map((ch: string) => (
                      <button key={ch} onClick={() => onNavigate(`/channel/${ch}`)}
                        className="px-2 py-0.5 bg-muted rounded-full text-foreground/60 hover:bg-muted/80 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                        style={{ fontSize: 10 }}>{ch}</button>
                    ))}
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onNavigate(`/channel/${path.channels[0]}`)}
                  className="flex-shrink-0 min-h-[48px] h-8 px-3 rounded-full font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', fontSize: 12, fontWeight: 500 }}>
                  Resume
                </motion.button>
              </motion.div>
            </SwipeableCard>
          );
        })}
        {activePaths.length > 2 && (
          <button onClick={() => onNavigate('/learning-paths')}
            className="w-full min-h-[48px] h-10 rounded-xl border border-border text-foreground/60 hover:text-foreground hover:border-border/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            style={{ fontSize: 13 }}>
            +{activePaths.length - 2} more paths
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Recent Activity ──────────────────────────────────────────────────────────
function RecentActivity({ items, onNavigate }: {
  items: { channelId: string; questionId: string; timestamp: number }[];
  onNavigate: (p: string) => void;
}) {
  if (items.length === 0) return null;
  const rel = (ts: number) => {
    const s = (Date.now() - ts) / 1000;
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };
  return (
    <div>
      <span className="block mb-3 text-foreground/60" style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        Recent Activity
      </span>
      <div className="space-y-2">
        {items.map((item, i) => (
          <motion.button key={`${item.questionId}-${i}`}
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
            onClick={() => onNavigate(`/channel/${item.channelId}`)}
            className="w-full flex items-center gap-3 p-3 rounded-2xl bg-muted/60 border border-border/40 hover:border-border/70 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="min-w-[48px] w-8 min-h-[48px] h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'color-mix(in srgb, #34A853 12%, transparent)' }}>
              <Check className="w-4 h-4" style={{ color: '#34A853' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-foreground truncate" style={{ fontSize: 12, fontWeight: 500 }}>Completed a question</div>
              <div className="text-foreground/60 capitalize" style={{ fontSize: 11 }}>{item.channelId.replace(/-/g, ' ')}</div>
            </div>
            <div className="flex items-center gap-1 text-foreground/50 flex-shrink-0" style={{ fontSize: 10 }}>
              <Clock className="w-3 h-3" />{rel(item.timestamp)}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function HomePage() {
  const [, setLocation] = useLocation();
  const { stats: activityStats } = useGlobalStats();
  const { balance, level, streak: ctxStreak } = useCredits();

  const totalCompleted = ProgressStorage.getAllCompletedIds().size;

  const [curatedPaths, setCuratedPaths] = React.useState<any[]>([]);
  const [activePaths, setActivePaths] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      try {
        const base = import.meta.env.BASE_URL || '/';
        const res = await fetch(`${base}data/learning-paths.json`);
        if (res.ok) setCuratedPaths(await res.json());
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    }
    load();
  }, []);

  React.useEffect(() => {
    try {
      let saved = localStorage.getItem('activeLearningPaths');
      if (!saved) {
        const old = localStorage.getItem('activeLearningPath');
        if (old) { const ids = [JSON.parse(old)]; localStorage.setItem('activeLearningPaths', JSON.stringify(ids)); saved = JSON.stringify(ids); }
      }
      if (!saved) { setActivePaths([]); return; }
      const pathIds = JSON.parse(saved);
      if (!Array.isArray(pathIds)) { setActivePaths([]); return; }
      const customPaths = JSON.parse(localStorage.getItem('customLearningPaths') || '[]');
      const paths = pathIds.map((pathId: string) => {
        if (pathId.startsWith?.('custom-')) {
          const cp = customPaths.find((p: any) => p.id === pathId);
          if (cp) return { id: cp.id, name: cp.name, icon: Brain, color: 'from-primary to-pink-500', description: 'Your custom learning journey', channels: cp.channels || [], certifications: cp.certifications || [], difficulty: 'Custom', duration: 'Self-paced', totalQuestions: 0, jobs: ['Custom Path'], skills: [], salary: 'Varies' };
        }
        const cp2 = curatedPaths.find((p: any) => p.id === pathId);
        if (cp2) {
          const tags = Array.isArray(cp2.tags) ? cp2.tags : JSON.parse(cp2.tags || '[]');
          const rawChannels = Array.isArray(cp2.channels) ? cp2.channels : JSON.parse(cp2.channels || '[]');
          const channelIds = rawChannels.length ? rawChannels : tags;
          const difficulty = cp2.difficulty ? cp2.difficulty.charAt(0).toUpperCase() + cp2.difficulty.slice(1) : 'Intermediate';
          const learningObjectives = Array.isArray(cp2.learningObjectives) ? cp2.learningObjectives : JSON.parse(cp2.learningObjectives || '[]');
          return { id: cp2.id, name: cp2.title, icon: Brain, color: 'from-green-500 to-emerald-500', description: cp2.description, channels: channelIds, difficulty, duration: `${cp2.estimatedHours || 10}h`, totalQuestions: Array.isArray(cp2.questionIds) ? cp2.questionIds.length : JSON.parse(cp2.questionIds || '[]').length, jobs: learningObjectives.slice(0, 3), skills: tags.slice(0, 5), salary: 'Varies' };
        }
        return null;
      }).filter(Boolean);
      setActivePaths(paths);
    } catch { setActivePaths([]); }
  }, [curatedPaths]);

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

  const xpInLevel = balance % 100;

  const resumeState = React.useMemo(() => {
    const sessions = getInProgressSessions();
    const session = sessions.find(s => s.channelId && (s.type === 'channel' || s.type === 'test'));
    if (!session?.channelId) return null;
    const questionId = session.sessionData?.questions?.[session.sessionData?.currentIndex]?.id ?? '0';
    return { channelId: session.channelId, questionId, channelName: session.title };
  }, []);

  const questionsToday = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return activityStats?.find(x => x.date === today)?.count ?? 0;
  }, [activityStats]);

  const topicsMastered = React.useMemo(() => {
    try {
      return Object.keys(localStorage).filter(k => k.startsWith('progress-')).filter(k => {
        const ids = JSON.parse(localStorage.getItem(k) || '[]');
        return ids.length >= 5;
      }).length;
    } catch { return 0; }
  }, []);

  const recentActivity = React.useMemo(() => {
    try {
      const all: { channelId: string; questionId: string; timestamp: number }[] = [];
      Object.keys(localStorage).filter(k => k.startsWith('history-')).forEach(key => {
        const ch = key.replace('history-', '');
        JSON.parse(localStorage.getItem(key) || '[]').forEach((item: any) =>
          all.push({ channelId: ch, questionId: item.questionId, timestamp: item.timestamp }));
      });
      return all.sort((a, b) => b.timestamp - a.timestamp).slice(0, 3);
    } catch { return []; }
  }, []);

  const hasAnyProgress = React.useMemo(() => {
    try { return Object.keys(localStorage).some(k => k.startsWith('progress-') || k.startsWith('history-') || k.startsWith('srs-')); }
    catch { return false; }
  }, []);

  const removeActivePath = (pathId: string) => {
    try {
      const ids = JSON.parse(localStorage.getItem('activeLearningPaths') || '[]');
      localStorage.setItem('activeLearningPaths', JSON.stringify(ids.filter((id: string) => id !== pathId)));
      window.location.reload();
    } catch (e) { console.error(e); }
  };

  if (activePaths.length === 0 && !isLoading && !hasAnyProgress) {
    return <OnboardingScreen onStart={() => setLocation('/learning-paths')} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── M3 Top bar — streak + XP + level ── */}
      <div className="sticky top-[calc(56px+env(safe-area-inset-top,0px))] lg:top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border/40">
        <div className="max-w-2xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {/* Streak chip */}
            <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full border"
              style={{ backgroundColor: 'color-mix(in srgb, #EA4335 10%, transparent)', borderColor: 'color-mix(in srgb, #EA4335 25%, transparent)' }}>
              <Flame className="w-3.5 h-3.5" style={{ color: '#EA4335' }} />
              <span className="font-bold" style={{ fontSize: 13 }}>{streak}</span>
              <span className="text-foreground/60" style={{ fontSize: 10 }}>day</span>
            </span>
            {/* XP chip */}
            <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full border"
              style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 10%, transparent)', borderColor: 'color-mix(in srgb, var(--primary) 25%, transparent)' }}>
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span className="font-bold" style={{ fontSize: 13 }}>{balance}</span>
              <span className="text-foreground/60" style={{ fontSize: 10 }}>XP</span>
            </span>
            {/* Level chip */}
            <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full border"
              style={{ backgroundColor: 'color-mix(in srgb, #FBBC04 10%, transparent)', borderColor: 'color-mix(in srgb, #FBBC04 25%, transparent)' }}>
              <Trophy className="w-3.5 h-3.5" style={{ color: '#FBBC04' }} />
              <span className="font-bold" style={{ fontSize: 13 }}>Lv {level}</span>
            </span>
          </div>
          {/* XP progress bar */}
          <div className="hidden sm:flex items-center gap-2 flex-1 max-w-[140px]">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full bg-primary"
                initial={{ width: 0 }} animate={{ width: `${xpInLevel}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
            </div>
            <span className="text-foreground/50 whitespace-nowrap" style={{ fontSize: 10 }}>{xpInLevel}/100</span>
          </div>
        </div>
      </div>

      <PullToRefresh onRefresh={async () => window.location.reload()}>
        <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-8 pb-24">

          {/* ── Hero: greeting + daily goal (Level 0) ── */}
          <motion.div variants={stagger} initial="hidden" animate="show">
            <motion.div variants={fadeUp}>
              {/* Display Small 36/44 */}
              <h1 className="font-normal text-foreground" style={{ fontSize: 28, lineHeight: '36px' }}>
                {getGreeting()}
              </h1>
              {/* Body Large 16/24 */}
              <p className="mt-1 text-foreground/60" style={{ fontSize: 16, lineHeight: '24px' }}>
                {streak === 0 ? 'Start your streak today!' : streak < 7 ? `${streak} day streak — keep it going!` : `${streak} days — unstoppable!`}
              </p>
            </motion.div>

            {/* Daily goal progress — M3 tonal metric cards */}
            <motion.div variants={stagger} className="flex gap-3 mt-4">
              <MetricCard value={questionsToday} label="Answered Today" toneColor="#4285F4" onClick={() => setLocation('/practice')} />
              <MetricCard value={topicsMastered} label="Topics Mastered" toneColor="var(--primary)" onClick={() => setLocation('/channels')} />
              <MetricCard value={totalCompleted} label="Total Solved" toneColor="#FBBC04" onClick={() => setLocation('/progress')} />
            </motion.div>
          </motion.div>

          {/* ── Continue widget (resume in-progress session) ── */}
          {resumeState && (
            <motion.button
              variants={fadeUp}
              initial="hidden" animate="show"
              whileTap={{ scale: 0.97 }}
              onClick={() => setLocation(`/channel/${resumeState.channelId}?q=${resumeState.questionId}`)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.08), 0 1px 3px 1px rgba(0,0,0,0.06)', backgroundColor: 'var(--card, white)' }}
              data-testid="button-continue-learning"
            >
              <div className="min-w-[48px] w-10 min-h-[48px] h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 12%, transparent)' }}>
                <RotateCcw className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-primary font-medium" style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Continue</div>
                <div className="font-medium text-foreground truncate" style={{ fontSize: 14, fontWeight: 500 }}>{resumeState.channelName}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-foreground/40 flex-shrink-0" />
            </motion.button>
          )}

          {/* ── Quick Actions — M3 Suggestion Chips ── */}
          <QuickActions onNavigate={setLocation} firstChannelId={activePaths[0]?.channels?.[0]} />

          {/* ── My Topics ── */}
          <MyTopicsFeed onNavigate={setLocation} />

          {/* ── Daily Challenge — M3 Filled Card ── */}
          <DailyChallengeCard onNavigate={setLocation} />

          {/* ── Continue Learning — M3 Elevated Cards ── */}
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <ContinueLearningSection
              activePaths={activePaths}
              totalCompleted={totalCompleted}
              onNavigate={setLocation}
              onRemove={removeActivePath}
            />
          )}

          {/* ── Recent Activity ── */}
          <RecentActivity items={recentActivity} onNavigate={setLocation} />

          {/* ── Add path CTA (empty state for paths) ── */}
          {activePaths.length < 3 && !isLoading && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setLocation('/learning-paths')}
              className="w-full h-12 rounded-2xl border border-dashed border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-foreground/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              style={{ fontSize: 14 }}
            >
              <Plus className="w-4 h-4" /> Add a learning path
            </motion.button>
          )}

        </div>
      </PullToRefresh>
    </div>
  );
}
