/**
 * Stats Page — Profile & Progress Dashboard
 */

import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line, CartesianGrid
} from 'recharts';
import { AppLayout } from '../components/layout/AppLayout';
import { useGlobalStats } from '../hooks/use-progress';
import { useCredits } from '../context/CreditsContext';
import { useAchievements } from '../hooks/use-achievements';
import { channels, getQuestions, getAllQuestions } from '../lib/data';
import { SEOHead } from '../components/SEOHead';
import { Trophy, Flame, Zap, Target, Calendar, BarChart2, Award, Mic, TrendingUp, Clock } from 'lucide-react';

// ── helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const HEATMAP_LEVELS = [
  'bg-white/5',
  'bg-violet-500/30',
  'bg-violet-500/55',
  'bg-violet-500/80',
  'bg-violet-400',
];

function activityLevel(count: number) {
  if (!count) return 0;
  if (count < 3) return 1;
  if (count < 6) return 2;
  if (count < 10) return 3;
  return 4;
}

const CHART_COLORS = ['#7c3aed', '#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#0891b2'];

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// ── custom tooltip ────────────────────────────────────────────────────────────

function HeatmapTooltip({ date, count }: { date: string; count: number }) {
  return (
    <div className="px-2 py-1 rounded-md text-xs font-medium pointer-events-none"
      style={{ background: 'var(--surface-4)', border: '1px solid var(--color-border)', color: 'var(--text-primary)' }}>
      {formatDate(date)} · {count} {count === 1 ? 'activity' : 'activities'}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function StatsPage() {
  const [, setLocation] = useLocation();
  const { stats } = useGlobalStats();
  const { balance } = useCredits();
  const { unlocked: unlockedBadges } = useAchievements();
  const [hoveredCell, setHoveredCell] = useState<{ date: string; count: number; x: number; y: number } | null>(null);

  // ── today's count ─────────────────────────────────────────────────────────
  const todayCount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return stats.find(s => s.date === today)?.count || 0;
  }, [stats]);

  // ── derived stats (keep all existing logic) ───────────────────────────────
  const { totalCompleted, totalQuestions, streak, moduleProgress, certCount, voiceSessions } = useMemo(() => {
    const allQuestions = getAllQuestions();
    const allCompletedIds = new Set<string>();

    const modProgress = channels.map(ch => {
      const questions = getQuestions(ch.id);
      const stored = localStorage.getItem(`progress-${ch.id}`);
      const completedIds = stored ? new Set(JSON.parse(stored)) : new Set();
      Array.from(completedIds).forEach((id) => allCompletedIds.add(id as string));
      const validCompleted = Math.min(completedIds.size, questions.length);
      const pct = questions.length > 0 ? Math.min(100, Math.round((validCompleted / questions.length) * 100)) : 0;
      return { id: ch.id, name: ch.name, completed: validCompleted, total: questions.length, pct };
    }).filter(m => m.total > 0).sort((a, b) => b.pct - a.pct);

    let currentStreak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      if (stats.find(x => x.date === d.toISOString().split('T')[0])) currentStreak++;
      else break;
    }

    const certCount = modProgress.filter(m => m.pct === 100).length;
    const voiceSessions = parseInt(localStorage.getItem('voice-sessions-count') || '0', 10);

    return {
      totalCompleted: allCompletedIds.size,
      totalQuestions: allQuestions.length,
      streak: currentStreak,
      moduleProgress: modProgress,
      certCount,
      voiceSessions,
    };
  }, [stats]);

  const level = Math.floor(balance / 100);
  const xpInLevel = balance % 100;
  const topicsMastered = moduleProgress.filter(m => m.pct === 100).length;

  // ── heatmap: 52 weeks × 7 days ────────────────────────────────────────────
  const { heatmapCells, monthLabels } = useMemo(() => {
    const today = new Date();
    // Start from Sunday of the week 52 weeks ago
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364);
    // Align to Sunday
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const statsMap = new Map(stats.map(s => [s.date, s.count]));
    const cells: { date: string; count: number; col: number; row: number }[] = [];
    const months: { label: string; col: number }[] = [];
    let lastMonth = -1;

    for (let col = 0; col < 53; col++) {
      for (let row = 0; row < 7; row++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + col * 7 + row);
        if (d > today) continue;
        const iso = d.toISOString().split('T')[0];
        const count = statsMap.get(iso) || 0;
        cells.push({ date: iso, count, col, row });
        if (row === 0 && d.getMonth() !== lastMonth) {
          months.push({ label: MONTH_NAMES[d.getMonth()], col });
          lastMonth = d.getMonth();
        }
      }
    }

    return { heatmapCells: cells, monthLabels: months };
  }, [stats]);

  // ── weekly bar chart ──────────────────────────────────────────────────────
  const weeklyData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const iso = d.toISOString().split('T')[0];
      const entry = stats.find(s => s.date === iso);
      return {
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        count: entry?.count || 0,
      };
    });
  }, [stats]);

  // ── 30-day line chart ─────────────────────────────────────────────────────
  const dailyData = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const iso = d.toISOString().split('T')[0];
      const entry = stats.find(s => s.date === iso);
      return {
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: entry?.count || 0,
      };
    });
  }, [stats]);

  // ── recent sessions (last 5 active days) ─────────────────────────────────
  const recentSessions = useMemo(() => {
    return [...stats]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map(s => ({
        date: s.date,
        count: s.count,
        mode: s.count >= 10 ? 'test' : s.count >= 5 ? 'voice' : 'swipe',
      }));
  }, [stats]);

  // ── topic donut chart ─────────────────────────────────────────────────────
  const topicData = useMemo(() => {
    return moduleProgress
      .filter(m => m.completed > 0)
      .slice(0, 8)
      .map((m, i) => ({ name: m.name, value: m.completed, color: CHART_COLORS[i % CHART_COLORS.length] }));
  }, [moduleProgress]);

  // ── streak calendar (current month) ──────────────────────────────────────
  const { calendarDays, calendarMonth } = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDow = new Date(year, month, 1).getDay();
    const statsSet = new Set(stats.map(s => s.date));

    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      return { day: d, iso, active: statsSet.has(iso), isToday: d === now.getDate() };
    });

    return {
      calendarDays: days,
      calendarMonth: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      firstDow,
    };
  }, [stats]);

  const memberSince = useMemo(() => {
    const stored = localStorage.getItem('user-preferences');
    if (stored) {
      try {
        const prefs = JSON.parse(stored);
        if (prefs.createdAt) return new Date(prefs.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      } catch { /* ignore */ }
    }
    return 'Recently';
  }, []);

  const username = localStorage.getItem('user-display-name') || 'Learner';
  const initials = getInitials(username);

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.4 },
  });

  return (
    <>
      <SEOHead
        title="Your Stats - Track Your Progress"
        description="See your learning progress, streaks, and achievements"
        canonical="https://open-interview.github.io/stats"
      />
      <AppLayout title="Stats">
        <div className="min-h-screen pb-24 lg:pb-8 bg-background text-foreground">
          <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

            {/* ── Page Header ────────────────────────────────────────────── */}
            <div className="px-4 pt-6 pb-4 lg:px-8">
              <h1 className="text-2xl font-bold text-foreground">Stats</h1>
              <p className="text-sm text-muted-foreground mt-1">Your learning progress at a glance</p>
            </div>

            {/* ── Profile Header ─────────────────────────────────────────── */}
            <motion.div {...fadeUp(0)} className="glass-card rounded-[var(--radius-2xl)] p-6 flex flex-col sm:flex-row items-center gap-6">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                  style={{ background: 'var(--gradient-primary)' }}>
                  {initials}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: 'var(--gradient-warning)' }}>
                  {level}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-bold">{username}</h1>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Software Engineer · Member since {memberSince}</p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-3">
                  <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: 'var(--color-xp)' }}>
                    <Zap className="w-4 h-4" />{balance} XP
                  </span>
                  <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: 'var(--color-streak)' }}>
                    <Flame className="w-4 h-4" />{streak} streak
                  </span>
                  <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: 'var(--color-accent-violet-light)' }}>
                    <Award className="w-4 h-4" />{unlockedBadges.length} badges
                  </span>
                </div>
              </div>

              {/* Level progress */}
              <div className="w-full sm:w-40 flex-shrink-0">
                <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                  <span>Lv {level}</span><span>{xpInLevel}/100 XP</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-4)' }}>
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${xpInLevel}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="h-full rounded-full"
                    style={{ background: 'var(--gradient-primary)' }}
                  />
                </div>
              </div>
            </motion.div>

            {/* ── Key Metrics 2×2 ────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Target, label: 'Questions Answered', value: totalCompleted, sub: `+${todayCount} today`, color: 'var(--color-accent-cyan)', bg: 'rgba(6,182,212,0.12)', border: 'rgba(6,182,212,0.25)', delay: 0.1 },
                { icon: BarChart2, label: 'Topics Mastered', value: topicsMastered, sub: undefined, color: 'var(--color-accent-violet-light)', bg: 'rgba(124,58,237,0.12)', border: 'rgba(124,58,237,0.25)', delay: 0.15 },
                { icon: Trophy, label: 'Certifications', value: certCount, sub: undefined, color: 'var(--color-xp)', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', delay: 0.2 },
                { icon: Mic, label: 'Voice Sessions', value: voiceSessions, sub: undefined, color: 'var(--color-success)', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', delay: 0.25 },
              ].map(({ icon: Icon, label, value, sub, color, bg, border, delay }) => (
                <motion.div key={label} {...fadeUp(delay)}
                  className="rounded-[var(--radius-xl)] p-5 flex flex-col gap-2"
                  style={{ background: bg, border: `1px solid ${border}` }}>
                  <Icon className="w-6 h-6" style={{ color }} />
                  <div className="text-3xl font-black">{value}</div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</div>
                  {sub && <div className="text-xs font-semibold" style={{ color }}>{sub}</div>}
                </motion.div>
              ))}
            </div>

            {/* ── Activity Heatmap ────────────────────────────────────────── */}
            <motion.div {...fadeUp(0.3)} className="glass-card rounded-[var(--radius-2xl)] p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5" style={{ color: 'var(--color-accent-violet-light)' }} />
                <h2 className="text-lg font-bold">Activity Heatmap</h2>
                <span className="ml-auto text-xs" style={{ color: 'var(--text-tertiary)' }}>Last 52 weeks</span>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                  {/* Month labels */}
                  <div className="relative h-5 mb-1 pl-8">
                    {monthLabels.map(({ label, col }) => (
                      <span key={`${label}-${col}`} className="text-xs absolute"
                        style={{ color: 'var(--text-tertiary)', left: `${32 + col * 11}px` }}>
                        {label}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-1">
                    {/* Day labels */}
                    <div className="flex flex-col gap-1 mr-1 pt-0.5">
                      {DAY_LABELS.map((d, i) => (
                        <div key={d} className="text-xs w-6 text-right leading-[10px]"
                          style={{ color: i % 2 === 0 ? 'var(--text-tertiary)' : 'transparent', height: '10px' }}>
                          {d.slice(0, 1)}
                        </div>
                      ))}
                    </div>

                    {/* Grid */}
                    <div className="relative flex gap-1">
                      {Array.from({ length: 53 }, (_, col) => (
                        <div key={col} className="flex flex-col gap-1">
                          {Array.from({ length: 7 }, (_, row) => {
                            const cell = heatmapCells.find(c => c.col === col && c.row === row);
                            if (!cell) return <div key={row} className="w-[10px] h-[10px]" />;
                            const lvl = activityLevel(cell.count);
                            return (
                              <div
                                key={row}
                                className={`w-[10px] h-[10px] rounded-sm cursor-pointer transition-transform hover:scale-125 ${HEATMAP_LEVELS[lvl]}`}
                                onMouseEnter={(e) => {
                                  const rect = (e.target as HTMLElement).getBoundingClientRect();
                                  setHoveredCell({ date: cell.date, count: cell.count, x: rect.left, y: rect.top });
                                }}
                                onMouseLeave={() => setHoveredCell(null)}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-2 mt-3 justify-end text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    <span>Less</span>
                    {HEATMAP_LEVELS.map((cls, i) => (
                      <div key={i} className={`w-3 h-3 rounded-sm ${cls}`} />
                    ))}
                    <span>More</span>
                  </div>
                </div>
              </div>

              {/* Tooltip portal */}
              {hoveredCell && (
                <div className="fixed z-50 pointer-events-none" style={{ left: hoveredCell.x + 14, top: hoveredCell.y - 32 }}>
                  <HeatmapTooltip date={hoveredCell.date} count={hoveredCell.count} />
                </div>
              )}
            </motion.div>

            {/* ── Charts Row ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Weekly bar chart */}
              <motion.div {...fadeUp(0.35)} className="glass-card rounded-[var(--radius-2xl)] p-6">
                <h2 className="text-base font-bold mb-4 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4" style={{ color: 'var(--color-accent-cyan)' }} />
                  Weekly Activity
                </h2>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={weeklyData} barSize={20}>
                    <XAxis dataKey="day" tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ background: 'var(--surface-4)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }}
                      cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    />
                    <Bar dataKey="count" name="Activities" radius={[4, 4, 0, 0]} fill="url(#barGrad)" />
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7c3aed" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Topic donut */}
              <motion.div {...fadeUp(0.4)} className="glass-card rounded-[var(--radius-2xl)] p-6">
                <h2 className="text-base font-bold mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4" style={{ color: 'var(--color-accent-violet-light)' }} />
                  Topic Distribution
                </h2>
                {topicData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={topicData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                        dataKey="value" paddingAngle={2}>
                        {topicData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: 'var(--surface-4)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }}
                      />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-40 flex items-center justify-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    Complete some questions to see distribution
                  </div>
                )}
              </motion.div>
            </div>

            {/* ── Performance Over Time ───────────────────────────────────── */}
            <motion.div {...fadeUp(0.42)} className="glass-card rounded-[var(--radius-2xl)] p-6">
              <h2 className="text-base font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" style={{ color: 'var(--color-accent-violet-light)' }} />
                Performance Over Time
                <span className="ml-auto text-xs font-normal" style={{ color: 'var(--text-tertiary)' }}>Last 30 days</span>
              </h2>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={dailyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} axisLine={false} tickLine={false}
                    interval={6} />
                  <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'var(--surface-4)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }}
                    cursor={{ stroke: 'var(--color-accent-violet-light)', strokeWidth: 1 }}
                  />
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#7c3aed" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                  <Line type="monotone" dataKey="count" name="Questions" stroke="#7c3aed"
                    strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#7c3aed' }} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* ── Recent Sessions ─────────────────────────────────────────── */}
            <motion.div {...fadeUp(0.44)} className="glass-card rounded-[var(--radius-2xl)] p-6">
              <h2 className="text-base font-bold mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" style={{ color: 'var(--color-accent-cyan)' }} />
                Recent Sessions
              </h2>
              {recentSessions.length > 0 ? (
                <div className="space-y-2">
                  {recentSessions.map((s) => {
                    const modeConfig = {
                      swipe: { label: 'Swipe', color: 'var(--color-accent-violet-light)', bg: 'rgba(124,58,237,0.12)' },
                      voice: { label: 'Voice', color: 'var(--color-success)', bg: 'rgba(16,185,129,0.12)' },
                      test:  { label: 'Test',  color: 'var(--color-xp)',     bg: 'rgba(245,158,11,0.12)' },
                    }[s.mode];
                    return (
                      <div key={s.date} className="flex items-center justify-between px-4 py-3 rounded-[var(--radius-lg)]"
                        style={{ background: 'var(--surface-2)', border: '1px solid var(--color-border)' }}>
                        <span className="text-sm font-medium">{formatDate(s.date)}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: modeConfig?.bg, color: modeConfig?.color }}>
                          {modeConfig?.label}
                        </span>
                        <span className="text-sm font-bold">{s.count} <span className="text-xs font-normal" style={{ color: 'var(--text-tertiary)' }}>questions</span></span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-center py-4" style={{ color: 'var(--text-tertiary)' }}>No sessions yet — start learning!</p>
              )}
            </motion.div>

            {/* ── Streak Calendar ─────────────────────────────────────────── */}
            <motion.div {...fadeUp(0.45)} className="glass-card rounded-[var(--radius-2xl)] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Flame className="w-4 h-4" style={{ color: 'var(--color-streak)' }} />
                  {calendarMonth}
                </h2>
                <span className="text-sm font-bold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(249,115,22,0.15)', color: 'var(--color-streak)', border: '1px solid rgba(249,115,22,0.3)' }}>
                  {streak} day streak
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {DAY_LABELS.map(d => (
                  <div key={d} className="text-xs pb-1" style={{ color: 'var(--text-tertiary)' }}>{d.slice(0, 1)}</div>
                ))}
                {/* Empty cells for first week offset */}
                {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay() }, (_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {calendarDays.map(({ day, active, isToday }) => (
                  <div key={day}
                    className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                      isToday ? 'ring-2 ring-violet-500' : ''
                    } ${active ? 'text-white' : ''}`}
                    style={{
                      background: active ? 'var(--gradient-primary)' : 'var(--surface-3)',
                      color: active ? '#fff' : 'var(--text-secondary)',
                    }}>
                    {day}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ── Channel Progress ────────────────────────────────────────── */}
            <motion.div {...fadeUp(0.5)}>
              <h2 className="text-xl font-bold mb-4">Channel Progress</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {moduleProgress.slice(0, 10).map((mod, i) => (
                  <motion.button
                    key={mod.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.55 + i * 0.04 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setLocation(`/channel/${mod.id}`)}
                    className="p-5 rounded-[var(--radius-xl)] text-left transition-colors"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--color-border)' }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-sm">{mod.name}</span>
                      {mod.pct === 100 && <Trophy className="w-4 h-4" style={{ color: 'var(--color-xp)' }} />}
                      <span className="text-xs font-bold ml-auto" style={{ color: 'var(--text-secondary)' }}>{mod.pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-4)' }}>
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${mod.pct}%` }}
                        transition={{ duration: 0.8, delay: 0.6 + i * 0.05 }}
                        className="h-full rounded-full"
                        style={{ background: 'var(--gradient-primary)' }}
                      />
                    </div>
                    <div className="text-xs mt-1.5" style={{ color: 'var(--text-tertiary)' }}>{mod.completed}/{mod.total}</div>
                  </motion.button>
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </AppLayout>
    </>
  );
}
