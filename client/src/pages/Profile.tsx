import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid
} from 'recharts';
import { UnifiedPageShell } from '../components/layout/UnifiedPageShell';
import { SEOHead } from '../components/SEOHead';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { useCredits } from '../context/CreditsContext';
import { useAchievements } from '../hooks/use-achievements';
import { useGlobalStats } from '../hooks/use-progress';
import { getAllQuestions, channels } from '../lib/data';
import {
  User, Trophy, Target, Sparkles, Flame, BookOpen, BarChart2,
  Award, Mic, TrendingUp, Clock, Lock, AlertCircle, Share2,
  Code2, GraduationCap, Zap, ChevronRight, Check
} from 'lucide-react';
import { ErrorBoundary } from '../components/ErrorBoundary';

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const HEATMAP_LEVELS = ['bg-white/5','bg-violet-500/30','bg-violet-500/55','bg-violet-500/80','bg-violet-400'];
const CHART_COLORS = ['#7c3aed','#6366f1','#06b6d4','#10b981','#f59e0b','#f43f5e','#8b5cf6','#0891b2'];

function activityLevel(count: number) {
  if (!count) return 0;
  if (count < 3) return 1;
  if (count < 6) return 2;
  if (count < 10) return 3;
  return 4;
}

const fadeUp = (delay = 0) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.35 } });

const tiers: Record<string, string> = {
  bronze: '#cd7f32', silver: '#c0c0c0', gold: '#ffd700', platinum: '#e5e4e2', diamond: '#b9f2ff'
};

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const { stats } = useGlobalStats();
  const { state } = useCredits();
  const { unlocked: unlockedBadges, progress: allProgress, stats: badgeStats } = useAchievements();
  const [displayName] = useState(() => { try { return localStorage.getItem('user-display-name') || 'Learner'; } catch { return 'Learner'; } });

  const [totalCompleted, setTotalCompleted] = useState(0);
  useEffect(() => {
    try {
      const allQ = getAllQuestions();
      const ids = new Set<string>();
      allQ.forEach(q => {
        try {
          const s = localStorage.getItem(`progress-${q.channel}`);
          if (s && new Set(JSON.parse(s)).has(q.id)) ids.add(q.id);
        } catch {}
      });
      setTotalCompleted(ids.size);
    } catch { setTotalCompleted(0); }
  }, []);

  const streak = useMemo(() => {
    let s = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      if (stats.find(x => x.date === d.toISOString().split('T')[0])) s++; else break;
    }
    return s;
  }, [stats]);

  const level = Math.floor(state.balance / 100);
  const xpInLevel = state.balance % 100;
  const initials = getInitials(displayName);

  return (
    <ErrorBoundary fallback={
      <UnifiedPageShell fullWidth>
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-8">
          <div className="max-w-md text-center space-y-4">
            <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
            <h2 className="text-xl font-bold">Something went wrong</h2>
            <p className="text-muted-foreground">Your profile data could not be loaded. This is usually caused by corrupted localStorage data.</p>
            <button onClick={() => { try { localStorage.clear(); } catch {} window.location.reload(); }}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity cursor-pointer">
              Reset & Reload
            </button>
          </div>
        </div>
      </UnifiedPageShell>
    }>
      <SEOHead title="Profile & Stats" description="Your profile, settings and learning statistics" canonical="https://open-interview.github.io/profile" />
      <UnifiedPageShell fullWidth>
        <div className="max-w-4xl mx-auto py-4 sm:py-6 space-y-5">

          {/* Header card — avatar + name + level + XP bar */}
          <div className="flex items-center gap-4 p-5 rounded-2xl border border-border bg-card">
            <div className="p-0.5 rounded-full bg-gradient-to-r from-primary to-cyan-500 shrink-0">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white bg-background">
                {initials}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold truncate">{displayName}</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">Lv.{level}</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden max-w-[160px]">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${xpInLevel}%` }} transition={{ duration: 1 }}
                    className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-500" />
                </div>
                <span className="text-xs text-muted-foreground">{xpInLevel}/100 XP</span>
              </div>
            </div>
            <button
              onClick={() => { /* share stats */ }}
              className="shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-muted/50 border border-border hover:bg-muted transition-colors cursor-pointer"
              aria-label="Share stats"
            >
              <Share2 className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Tab strip */}
          <TabsContent level={level} streak={streak} totalCompleted={totalCompleted} stats={stats} state={state}
            unlockedBadges={unlockedBadges} allProgress={allProgress} badgeStats={badgeStats}
            setLocation={setLocation} displayName={displayName} />
        </div>
      </UnifiedPageShell>
    </ErrorBoundary>
  );
}

function TabsContent({ level, streak, totalCompleted, stats, state, unlockedBadges, allProgress, badgeStats, setLocation, displayName }: any) {
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'badges'>('overview');

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: User },
    { id: 'stats' as const, label: 'Stats', icon: BarChart2 },
    { id: 'badges' as const, label: 'Badges', icon: Award },
  ];

  return (
    <>
      <div className="flex gap-1 p-1 rounded-xl bg-muted/50 border border-border">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 min-h-[44px] rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === id
                ? 'bg-card text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>
          {activeTab === 'overview' && <OverviewTab stats={stats} level={level} streak={streak} totalCompleted={totalCompleted} state={state} unlockedBadges={unlockedBadges} setLocation={setLocation} />}
          {activeTab === 'stats' && <StatsTab stats={stats} totalCompleted={totalCompleted} streak={streak} state={state} setLocation={setLocation} />}
          {activeTab === 'badges' && <BadgesTab unlocked={unlockedBadges} allProgress={allProgress} badgeStats={badgeStats} setLocation={setLocation} />}
        </motion.div>
      </AnimatePresence>
    </>
  );
}

function OverviewTab({ stats, level, streak, totalCompleted, state, unlockedBadges, setLocation }: any) {
  const todayCount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return stats.find((s: any) => s.date === today)?.count || 0;
  }, [stats]);

  const weeklyData = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const iso = d.toISOString().split('T')[0];
    return { day: d.toLocaleDateString('en-US', { weekday: 'short' }), count: stats.find((s: any) => s.date === iso)?.count || 0 };
  }), [stats]);

  const moduleProgress = useMemo(() => {
    return channels.map(ch => {
      let completedIds = new Set<string>();
      try { const stored = localStorage.getItem(`progress-${ch.id}`); if (stored) completedIds = new Set(JSON.parse(stored)); } catch {}
      const questions = (() => { try { return JSON.parse(localStorage.getItem(`questions-${ch.id}`) || '[]'); } catch { return []; } })();
      const valid = Math.min(completedIds.size, questions.length || 1);
      const pct = questions.length > 0 ? Math.min(100, Math.round((valid / questions.length) * 100)) : 0;
      return { id: ch.id, name: ch.name, pct };
    }).filter(m => m.pct > 0).sort((a, b) => b.pct - a.pct).slice(0, 3);
  }, []);

  const statCards = [
    { icon: Zap, label: 'XP', value: state.balance, color: 'text-amber-400', bg: 'from-amber-500/15 to-amber-600/5', border: 'border-amber-500/20' },
    { icon: Target, label: 'Completed', value: totalCompleted, sub: `+${todayCount}`, color: 'text-cyan-400', bg: 'from-cyan-500/15 to-cyan-600/5', border: 'border-cyan-500/20' },
    { icon: Flame, label: 'Streak', value: `${streak}d`, color: 'text-rose-400', bg: 'from-rose-500/15 to-rose-600/5', border: 'border-rose-500/20' },
    { icon: Trophy, label: 'Badges', value: unlockedBadges.length, color: 'text-violet-400', bg: 'from-violet-500/15 to-violet-600/5', border: 'border-violet-500/20' },
  ];

  return (
    <div className="space-y-5">
      <motion.div variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }} initial="hidden" animate="visible"
        className="grid grid-cols-2 gap-3">
        {statCards.map((s, i) => (
          <motion.div key={s.label} variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
            className={`p-4 rounded-xl border bg-gradient-to-br ${s.bg} ${s.border}`}>
            <div className={`text-lg font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
            {(s as any).sub && <div className="text-[10px] font-semibold mt-0.5 text-cyan-400">{(s as any).sub} today</div>}
          </motion.div>
        ))}
      </motion.div>

      {/* 7-day activity strip */}
      <div className="p-4 rounded-xl border border-border bg-card">
        <div className="text-xs font-semibold text-muted-foreground mb-3">This Week</div>
        <div className="flex items-end gap-2 h-20">
          {weeklyData.map((d: any) => {
            const maxCount = Math.max(...weeklyData.map((w: any) => w.count), 1);
            const h = Math.max(8, (d.count / maxCount) * 64);
            return (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-md bg-gradient-to-t from-primary to-cyan-500 transition-all duration-300"
                  style={{ height: h, opacity: d.count > 0 ? 1 : 0.2 }} />
                <span className="text-[10px] text-muted-foreground">{d.day[0]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top channels */}
      <div className="p-4 rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-muted-foreground">Top Channels</span>
          <button onClick={() => setLocation('/channels')} className="text-xs text-primary flex items-center gap-1 cursor-pointer min-h-[44px]">
            All <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        {moduleProgress.length > 0 ? (
          <div className="space-y-2">
            {moduleProgress.map((m: any) => (
              <button key={m.id} onClick={() => setLocation(`/channel/${m.id}`)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer min-h-[44px]">
                <div className="flex-1 text-left min-w-0">
                  <div className="text-sm font-medium truncate">{m.name}</div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-500" style={{ width: `${m.pct}%` }} />
                  </div>
                </div>
                <span className="text-xs font-semibold text-muted-foreground shrink-0">{m.pct}%</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-4">No progress yet — start learning!</p>
        )}
      </div>
    </div>
  );
}

function StatsTab({ stats, totalCompleted, streak, state, setLocation }: any) {
  const topicsMastered = useMemo(() => {
    let count = 0;
    channels.forEach(ch => {
      try {
        const s = localStorage.getItem(`progress-${ch.id}`);
        if (!s) return;
        const completed = JSON.parse(s) as string[];
        const questions = (() => { try { return JSON.parse(localStorage.getItem(`questions-${ch.id}`) || '[]'); } catch { return []; } })();
        if (completed.length > 0 && completed.length >= (questions.length || 1)) count++;
      } catch {}
    });
    return count;
  }, []);

  const certCount = useMemo(() => {
    const certKw = ['aws','kubernetes','terraform','gcp','azure','comptia','cisco','cka','ckad','cks'];
    let c = 0;
    channels.forEach(ch => {
      try {
        const s = localStorage.getItem(`progress-${ch.id}`);
        if (!s) return;
        const completed = JSON.parse(s) as string[];
        if (!completed.length) return;
        if (certKw.some(k => ch.id.toLowerCase().includes(k))) c++;
      } catch {}
    });
    return c;
  }, []);

  const voiceSessions = useMemo(() => {
    try { return parseInt(localStorage.getItem('voice-sessions-count') || '0', 10); } catch { return 0; }
  }, []);

  const todayCount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return stats.find((s: any) => s.date === today)?.count || 0;
  }, [stats]);

  const { heatmapCells, monthLabels } = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    const statsMap = new Map(stats.map((s: any) => [s.date, s.count]));
    const cells: any[] = [];
    const months: any[] = [];
    let lastMonth = -1;
    for (let col = 0; col < 53; col++) {
      for (let row = 0; row < 7; row++) {
        const d = new Date(startDate); d.setDate(startDate.getDate() + col * 7 + row);
        if (d > today) continue;
        const iso = d.toISOString().split('T')[0];
        cells.push({ date: iso, count: statsMap.get(iso) || 0, col, row });
        if (row === 0 && d.getMonth() !== lastMonth) { months.push({ label: MONTH_NAMES[d.getMonth()], col }); lastMonth = d.getMonth(); }
      }
    }
    return { heatmapCells: cells, monthLabels: months };
  }, [stats]);

  const dailyData = useMemo(() => Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    const iso = d.toISOString().split('T')[0];
    return { date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count: stats.find((s: any) => s.date === iso)?.count || 0 };
  }), [stats]);

  const moduleProgress = useMemo(() => channels.map(ch => {
    let completedIds = new Set<string>();
    try { const stored = localStorage.getItem(`progress-${ch.id}`); if (stored) completedIds = new Set(JSON.parse(stored)); } catch {}
    const questions = (() => { try { return JSON.parse(localStorage.getItem(`questions-${ch.id}`) || '[]'); } catch { return []; } })();
    const valid = Math.min(completedIds.size, questions.length);
    const pct = questions.length > 0 ? Math.min(100, Math.round((valid / questions.length) * 100)) : 0;
    return { id: ch.id, name: ch.name, completed: valid, total: questions.length, pct };
  }).filter(m => m.total > 0).sort((a, b) => b.pct - a.pct), []);

  const topicData = useMemo(() => moduleProgress.filter(m => m.completed > 0).slice(0, 8)
    .map((m, i) => ({ name: m.name, value: m.completed, color: CHART_COLORS[i % CHART_COLORS.length] })), [moduleProgress]);

  const weeklyData = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const iso = d.toISOString().split('T')[0];
    return { day: d.toLocaleDateString('en-US', { weekday: 'short' }), count: stats.find((s: any) => s.date === iso)?.count || 0 };
  }), [stats]);

  const recentSessions = useMemo(() => [...stats]
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
    .map((s: any) => ({ date: s.date, count: s.count, mode: s.count >= 10 ? 'test' : s.count >= 5 ? 'voice' : 'swipe' })), [stats]);

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Stat chips */}
      {[
        { icon: Target, label: 'Questions', value: totalCompleted, sub: `+${todayCount}`, color: '#06b6d4', bg: 'rgba(6,182,212,0.08)' },
        { icon: Award, label: 'Mastered', value: topicsMastered, color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
        { icon: Trophy, label: 'Certs', value: certCount, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
        { icon: Mic, label: 'Voice', value: voiceSessions, color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
      ].map(({ icon: Icon, label, value, sub, color, bg }, i) => (
        <div key={label} className="rounded-xl p-3 flex flex-col gap-0.5 border" style={{ background: bg, borderColor: `${color}20` }}>
          <Icon style={{ color, width: 13, height: 13 }} />
          <div className="text-lg font-black leading-none mt-1">{value}</div>
          <div className="text-[10px] text-muted-foreground">{label}</div>
          {sub && <div className="text-[9px] font-semibold" style={{ color }}>{sub}</div>}
        </div>
      ))}

      {/* Heatmap */}
      <div className="col-span-2 rounded-xl border border-border bg-card p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground">Activity</span>
          <span className="text-[10px] text-muted-foreground">52 weeks</span>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[520px]">
            <div className="relative h-3.5 mb-0.5 pl-6">
              {monthLabels.map(({ label, col }: any) => (
                <span key={`${label}-${col}`} className="text-[9px] absolute text-muted-foreground" style={{ left: `${24 + col * 9}px` }}>{label}</span>
              ))}
            </div>
            <div className="flex gap-0.5">
              <div className="flex flex-col gap-0.5 mr-0.5">
                {DAY_LABELS.map((d, i) => (
                  <div key={d} className="text-[8px] w-4 text-right" style={{ color: i % 2 === 0 ? 'var(--text-tertiary)' : 'transparent', height: '8px', lineHeight: '8px' }}>{d[0]}</div>
                ))}
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: 53 }, (_, col) => (
                  <div key={col} className="flex flex-col gap-0.5">
                    {Array.from({ length: 7 }, (_, row) => {
                      const cell = heatmapCells.find((c: any) => c.col === col && c.row === row);
                      if (!cell) return <div key={row} style={{ width: 8, height: 8 }} />;
                      return <div key={row} className={`rounded-[1px] ${HEATMAP_LEVELS[activityLevel(cell.count)]}`} style={{ width: 8, height: 8 }} />;
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly bar */}
      <div className="col-span-1 rounded-xl border border-border bg-card p-3" style={{ maxHeight: 200 }}>
        <div className="text-[10px] font-semibold text-muted-foreground mb-2">This Week</div>
        <ResponsiveContainer width="100%" height={90}>
          <BarChart data={weeklyData} barSize={12} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
            <XAxis dataKey="day" tick={{ fill: 'var(--text-tertiary)', fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip contentStyle={{ background: 'var(--surface-4)', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: 10 }} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="count" radius={[3,3,0,0]} fill="url(#bG)" />
            <defs><linearGradient id="bG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7c3aed"/><stop offset="100%" stopColor="#06b6d4"/></linearGradient></defs>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Topic distribution */}
      <div className="col-span-1 rounded-xl border border-border bg-card p-3" style={{ maxHeight: 200 }}>
        <div className="text-[10px] font-semibold text-muted-foreground mb-2">Topics</div>
        {topicData.length > 0 ? (() => {
          const total = topicData.reduce((s: number, d: any) => s + d.value, 0);
          return (
            <div className="space-y-1.5">
              {topicData.slice(0, 5).map((d: any, i: number) => {
                const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-[9px] mb-0.5">
                      <span className="truncate max-w-[65%] text-muted-foreground">{d.name}</span>
                      <span style={{ color: d.color }}>{pct}%</span>
                    </div>
                    <div className="h-1 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full" style={{ background: d.color, width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })() : <div className="text-[10px] text-center py-4 text-muted-foreground">No data yet</div>}
      </div>

      {/* 30-day line */}
      <div className="col-span-2 rounded-xl border border-border bg-card p-3" style={{ maxHeight: 200 }}>
        <div className="text-[10px] font-semibold text-muted-foreground mb-2">30-day Trend</div>
        <ResponsiveContainer width="100%" height={80}>
          <LineChart data={dailyData} margin={{ top: 2, right: 2, left: -28, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: 'var(--text-tertiary)', fontSize: 9 }} axisLine={false} tickLine={false} interval={9} />
            <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 9 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: 'var(--surface-4)', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: 10 }} cursor={{ stroke: '#7c3aed', strokeWidth: 1 }} />
            <Line type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={1.5} dot={false} activeDot={{ r: 2, fill: '#7c3aed' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent sessions */}
      <div className="col-span-1 rounded-xl border border-border bg-card p-3" style={{ maxHeight: 200 }}>
        <div className="text-[10px] font-semibold text-muted-foreground mb-2">Recent Sessions</div>
        {recentSessions.length > 0 ? (
          <div className="space-y-1">
            {recentSessions.slice(0, 4).map((s: any) => {
              const cfg = { swipe: { label: 'Swipe', color: '#7c3aed' }, voice: { label: 'Voice', color: '#10b981' }, test: { label: 'Test', color: '#f59e0b' } }[s.mode as string];
              return (
                <div key={s.date} className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">{formatDate(s.date)}</span>
                  <span className="font-semibold" style={{ color: cfg?.color }}>{cfg?.label}</span>
                  <span className="font-bold">{s.count}q</span>
                </div>
              );
            })}
          </div>
        ) : <div className="text-[10px] text-center py-2 text-muted-foreground">No sessions yet</div>}
      </div>

      {/* Calendar */}
      <div className="col-span-1 rounded-xl border border-border bg-card p-3" style={{ maxHeight: 200 }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold text-muted-foreground">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          <span className="text-[10px] font-bold text-rose-400">{streak}d 🔥</span>
        </div>
        <div className="grid grid-cols-7 gap-0.5 mb-0.5">
          {['S','M','T','W','T','F','S'].map((d, i) => (
            <div key={i} className="text-center text-[8px] text-muted-foreground">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: new Date().getDay() }, (_, i) => <div key={`e-${i}`} />)}
          {(() => {
            const now = new Date();
            const year = now.getFullYear(); const month = now.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const statsSet = new Set(stats.map((s: any) => s.date));
            return Array.from({ length: daysInMonth }, (_, i) => {
              const d = i + 1;
              const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const active = statsSet.has(iso);
              const isToday = d === now.getDate();
              return (
                <div key={d} className={`flex items-center justify-center rounded text-[9px] font-medium ${isToday ? 'ring-1 ring-violet-500' : ''}`}
                  style={{ aspectRatio: '1', background: active ? (isToday ? '#7c3aed' : 'rgba(124,58,237,0.5)') : isToday ? 'rgba(124,58,237,0.12)' : '', color: active ? '#fff' : isToday ? '#a78bfa' : 'var(--text-tertiary)' }}>
                  {d}
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* Channel progress */}
      <div className="col-span-2 rounded-xl border border-border bg-card p-3" style={{ maxHeight: 200 }}>
        <div className="text-[10px] font-semibold text-muted-foreground mb-2">Channel Progress</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {(moduleProgress as any[]).slice(0, 8).map((mod, i) => (
            <button key={mod.id}
              onClick={() => setLocation(`/channel/${mod.id}`)}
              className="p-2 min-h-[44px] rounded-xl text-left cursor-pointer bg-muted/30 border border-border hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-medium truncate max-w-[70%]">{mod.name}</span>
                <span className="text-[9px] font-bold shrink-0" style={{ color: mod.pct === 100 ? '#f59e0b' : 'var(--text-tertiary)' }}>
                  {mod.pct === 100 ? '✓' : `${mod.pct}%`}
                </span>
              </div>
              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${mod.pct}%`, background: mod.pct === 100 ? '#f59e0b' : '#7c3aed' }} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function BadgesTab({ unlocked, allProgress, badgeStats, setLocation }: any) {
  const locked = useMemo(() => allProgress.filter((p: any) => !p.isUnlocked), [allProgress]);

  const allOrdered = useMemo(() => {
    const u = unlocked.map((p: any) => ({ ...p.achievement, unlocked: true }));
    const l = locked.map((p: any) => ({ ...p.achievement, unlocked: false, progress: p.progress, maxProgress: p.maxProgress }));
    return [...u, ...l];
  }, [unlocked, locked]);

  const tierRing = (tier: string) => tiers[tier] || '#7c3aed';
  const iconName = (icon: string) => {
    const name = (icon || 'star').split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    const icons: Record<string, any> = { Trophy, Award, Star: Award, Zap, Flame, Target, Check, Code2, BookOpen, Mic, TrendingUp, Clock, User, BarChart2, Sparkles };
    return icons[name] || Trophy;
  };

  return (
    <div className="space-y-4">
      {/* Badge stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Unlocked', value: badgeStats.unlocked, color: 'text-violet-400' },
          { label: 'Total', value: badgeStats.total, color: 'text-cyan-400' },
          { label: 'Progress', value: `${badgeStats.percentage}%`, color: 'text-amber-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="p-3 rounded-xl bg-muted/30 border border-border text-center">
            <div className={`text-lg font-black ${color}`}>{value}</div>
            <div className="text-[10px] text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {/* Badge grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {allOrdered.map((badge: any) => {
          const Icon = iconName(badge.icon || badge.name);
          const ringColor = tierRing(badge.tier);
          return (
            <div key={badge.id}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                badge.unlocked ? 'bg-card border-border hover:border-primary/30' : 'bg-muted/20 border-border/50'
              }`}
            >
              <div className="relative" style={{ width: 56, height: 56 }}>
                <svg width={56} height={56} className="absolute inset-0 -rotate-90">
                  <circle cx={28} cy={28} r={24} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={3} />
                  {badge.unlocked && (
                    <circle cx={28} cy={28} r={24} fill="none" stroke={ringColor} strokeWidth={3}
                      strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 24}`} strokeDashoffset={0} />
                  )}
                </svg>
                <div className={`absolute inset-0 rounded-full flex items-center justify-center ${badge.unlocked ? '' : 'grayscale opacity-40'}`}
                  style={{ background: badge.unlocked ? `${ringColor}18` : 'var(--surface-3)' }}>
                  <Icon className="w-5 h-5" style={{ color: badge.unlocked ? ringColor : 'var(--text-tertiary)' }} />
                </div>
                {!badge.unlocked && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Lock className="w-3 h-3 text-muted-foreground/60" />
                  </div>
                )}
              </div>
              <span className={`text-[9px] font-semibold leading-tight line-clamp-2 ${badge.unlocked ? '' : 'text-muted-foreground/60'}`}>
                {badge.name}
              </span>
            </div>
          );
        })}
      </div>

      {allOrdered.length === 0 && (
        <div className="text-center py-10 text-sm text-muted-foreground">
          No badges available yet
        </div>
      )}
    </div>
  );
}
