/**
 * Google Stats — M3 redesign
 * Pure SVG charts, M3 color roles, no third-party chart libraries
 */
import '../styles/google-stats.css';
import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { AppLayout } from '../components/layout/AppLayout';
import { ProgressTabBar } from '../components/ProgressTabBar';
import { useGlobalStats } from '../hooks/use-progress';
import { useAchievements } from '../hooks/use-achievements';
import { useLevel } from '../hooks/use-level';
import { channels, getQuestions, getAllQuestions, getQuestionDifficulty } from '../lib/data';
import { SEOHead } from '../components/SEOHead';
import { Trophy, Flame, Target, BarChart2, Calendar, TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';

// ── M3 color roles (CSS vars) ─────────────────────────────────────────────────
const C = {
  primary:        'var(--color-primary,#6750a4)',
  primaryCont:    'var(--color-primary-container,#eaddff)',
  onPrimaryCont:  'var(--color-on-primary-container,#21005d)',
  secondary:      'var(--color-secondary,#625b71)',
  secondaryCont:  'var(--color-secondary-container,#e8def8)',
  onSecondaryCont:'var(--color-on-secondary-container,#1d192b)',
  tertiary:       'var(--color-tertiary,#7d5260)',
  tertiaryCont:   'var(--color-tertiary-container,#ffd8e4)',
  onTertiaryCont: 'var(--color-on-tertiary-container,#31111d)',
  error:          'var(--color-error,#b3261e)',
  errorCont:      'var(--color-error-container,#f9dedc)',
  onErrorCont:    'var(--color-on-error-container,#410e0b)',
  surface:        'var(--color-background,#fffbfe)',
  surfaceVar:     'var(--color-surface-variant,#e7e0ec)',
  onSurface:      'var(--color-on-surface,#1c1b1f)',
  onSurfaceVar:   'var(--color-on-surface-variant,#49454f)',
  outline:        'var(--color-outline,#79747e)',
};

// ── SVG Bar Chart ─────────────────────────────────────────────────────────────
function M3BarChart({ data, labels, height = 100 }: { data: number[]; labels?: string[]; height?: number }) {
  const max = Math.max(...data, 1);
  const n = data.length;
  const barW = 100 / n;
  return (
    <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
      {data.map((v, i) => {
        const bh = (v / max) * (height - 18);
        const x = i * barW + barW * 0.1;
        const w = barW * 0.8;
        const y = height - bh - 14;
        return (
          <g key={i}>
            <motion.rect x={`${x}%`} y={y} width={`${w}%`} height={bh} rx={2}
              fill={C.primary} opacity={0.85}
              initial={{ height: 0, y: height - 14 }} animate={{ height: bh, y }}
              transition={{ duration: 0.35, delay: i * 0.025 }} />
            {v > 0 && (
              <text x={`${x + w / 2}%`} y={y - 2} textAnchor="middle" fontSize={7} fill={C.onSurfaceVar}>{v}</text>
            )}
            {labels && (
              <text x={`${x + w / 2}%`} y={height - 2} textAnchor="middle" fontSize={7} fill={C.onSurfaceVar}>
                {labels[i]}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── SVG Line Chart ────────────────────────────────────────────────────────────
function M3LineChart({ data, height = 70 }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * 100;
    const y = height - (v / max) * (height - 10) - 5;
    return [x, y] as [number, number];
  });
  const linePath = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
  const areaPath = `${linePath} L100,${height} L0,${height} Z`;
  return (
    <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="m3-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.primary} stopOpacity="0.2" />
          <stop offset="100%" stopColor={C.primary} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#m3-area)" />
      <motion.path d={linePath} fill="none" stroke={C.primary} strokeWidth={1.5}
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />
      {pts.map(([x, y], i) => (
        <motion.circle key={i} cx={x} cy={y} r={2} fill={C.primary}
          initial={{ r: 0 }} animate={{ r: 2 }} transition={{ delay: i * 0.04 + 0.5 }} />
      ))}
    </svg>
  );
}

// ── SVG Heatmap ───────────────────────────────────────────────────────────────
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
// M3 primary tones 10/40/70/90
const HEAT_COLORS = [
  C.surfaceVar,
  'var(--color-primary-container,#eaddff)',
  C.primary,
  '#4a3780',
  '#2d1f5e',
];
function heatLevel(n: number) { return !n ? 0 : n < 3 ? 1 : n < 6 ? 2 : n < 10 ? 3 : 4; }

function M3Heatmap({ stats }: { stats: { date: string; count: number }[] }) {
  const CELL = 11, GAP = 2, STEP = CELL + GAP;
  const { cells, months } = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 364);
    start.setDate(start.getDate() - start.getDay());
    const map = new Map(stats.map(s => [s.date, s.count]));
    const cells: { date: string; count: number; col: number; row: number }[] = [];
    const months: { label: string; col: number }[] = [];
    let lastMonth = -1;
    for (let col = 0; col < 53; col++) {
      for (let row = 0; row < 7; row++) {
        const d = new Date(start); d.setDate(start.getDate() + col * 7 + row);
        if (d > today) continue;
        const iso = d.toISOString().split('T')[0];
        cells.push({ date: iso, count: map.get(iso) || 0, col, row });
        if (row === 0 && d.getMonth() !== lastMonth) {
          months.push({ label: MONTH_NAMES[d.getMonth()], col });
          lastMonth = d.getMonth();
        }
      }
    }
    return { cells, months };
  }, [stats]);

  const W = 53 * STEP, H = 7 * STEP + 16;
  return (
    <div className="overflow-x-auto">
      <svg width={W} height={H} style={{ minWidth: W }}>
        {months.map(({ label, col }) => (
          <text key={`${label}-${col}`} x={col * STEP} y={10} fontSize={9} fill={C.onSurfaceVar}>{label}</text>
        ))}
        {cells.map(cell => (
          <rect key={cell.date}
            x={cell.col * STEP} y={16 + cell.row * STEP}
            width={CELL} height={CELL} rx={2}
            fill={HEAT_COLORS[heatLevel(cell.count)]}
            className="cursor-pointer hover:opacity-70 transition-opacity"
          >
            <title>{cell.date}: {cell.count} activities</title>
          </rect>
        ))}
      </svg>
    </div>
  );
}

// ── SVG Ring Progress ─────────────────────────────────────────────────────────
function M3Ring({ pct, color, size = 72, label }: { pct: number; color: string; size?: number; label: string }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const c = size / 2;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90 absolute inset-0">
          <circle cx={c} cy={c} r={r} fill="none" stroke={C.surfaceVar} strokeWidth={6} />
          <motion.circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={6}
            strokeLinecap="round" strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ * (1 - pct / 100) }}
            transition={{ duration: 0.8, ease: 'easeOut' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-medium" style={{ color }}>{pct}%</span>
        </div>
      </div>
      <span className="text-xs font-medium" style={{ color: C.onSurfaceVar }}>{label}</span>
    </div>
  );
}

// ── M3 Metric Card ────────────────────────────────────────────────────────────
function M3MetricCard({ label, value, unit, subtext, trend, change, bg, fg }: {
  label: string; value: number; unit?: string; subtext?: string;
  trend?: 'up' | 'down' | 'neutral'; change?: number; bg: string; fg: string;
}) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl p-4 flex flex-col gap-1" style={{ background: bg }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide" style={{ color: fg, opacity: 0.7 }}>{label}</span>
        {change !== undefined && (
          <span className="flex items-center gap-0.5 text-xs font-medium" style={{ color: fg, opacity: 0.8 }}>
            <TrendIcon className="w-3 h-3" />
            {change > 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
      <div className="text-4xl font-normal leading-none" style={{ color: fg }}>
        {value.toLocaleString()}<span className="text-lg">{unit}</span>
      </div>
      {subtext && <div className="text-xs" style={{ color: fg, opacity: 0.7 }}>{subtext}</div>}
    </motion.div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function GoogleStats() {
  const [, setLocation] = useLocation();
  const { stats } = useGlobalStats();
  const { progress: achievementProgress, nextUp } = useAchievements();
  const level = useLevel();
  const [timeRange, setTimeRange] = useState<'30' | '90' | '365'>('90');
  const days = parseInt(timeRange);

  const {
    totalCompleted, totalQuestions, overallPct, streak,
    totalSessions, globalDifficulty, moduleProgress,
    activityData, sessionHistory, changePercent,
  } = useMemo(() => {
    const allQuestions = getAllQuestions();
    const allCompletedIds = new Set<string>();
    const globalDiff = {
      beginner:     { total: 0, done: 0 },
      intermediate: { total: 0, done: 0 },
      advanced:     { total: 0, done: 0 },
    };

    const modProgress = channels.map(ch => {
      const questions = getQuestions(ch.id);
      const stored = localStorage.getItem(`progress-${ch.id}`);
      const completedIds = stored ? new Set<string>(JSON.parse(stored)) : new Set<string>();
      completedIds.forEach(id => allCompletedIds.add(id));
      questions.forEach(q => {
        const d = getQuestionDifficulty(q);
        globalDiff[d].total++;
        if (completedIds.has(q.id)) globalDiff[d].done++;
      });
      const valid = Math.min(completedIds.size, questions.length);
      const pct = questions.length > 0 ? Math.min(100, Math.round((valid / questions.length) * 100)) : 0;
      return { id: ch.id, name: ch.name, completed: valid, total: questions.length, pct };
    }).filter(m => m.total > 0).sort((a, b) => b.pct - a.pct);

    let currentStreak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      if (stats.find(x => x.date === d.toISOString().split('T')[0])) currentStreak++;
      else break;
    }

    const today = new Date();
    const actData: { date: string; count: number }[] = [];
    let curPeriod = 0, prevPeriod = 0;
    const half = Math.floor(days / 2);
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const count = stats.find(s => s.date === iso)?.count || 0;
      if (i < half) curPeriod += count; else prevPeriod += count;
      actData.push({ date: iso, count });
    }

    const sessionHist: number[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      sessionHist.push(stats.find(s => s.date === d.toISOString().split('T')[0])?.count || 0);
    }

    const chg = prevPeriod !== 0
      ? Math.round(((curPeriod - prevPeriod) / prevPeriod) * 100)
      : curPeriod > 0 ? 100 : 0;

    const validTotal = Math.min(allCompletedIds.size, allQuestions.length);
    return {
      totalCompleted: validTotal,
      totalQuestions: allQuestions.length,
      overallPct: allQuestions.length > 0 ? Math.min(100, Math.round((validTotal / allQuestions.length) * 100)) : 0,
      streak: currentStreak,
      totalSessions: stats.reduce((a, c) => a + c.count, 0),
      globalDifficulty: globalDiff,
      moduleProgress: modProgress,
      activityData: actData,
      sessionHistory: sessionHist,
      changePercent: chg,
    };
  }, [stats, days]);

  const weekLabels = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i));
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  });

  return (
    <>
      <SEOHead title="Statistics | Open Interview"
        description="Monitor your technical interview preparation progress."
        canonical="https://open-interview.github.io/stats" />
      <AppLayout title="Statistics">
        <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4" style={{ background: C.surface }}>
          <ProgressTabBar activeTab="overview" />
          {/* Page title */}
          <h1 className="text-3xl font-normal" style={{ color: C.onSurface }}>Statistics</h1>

          {/* XP / Level progress */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-5" style={{ background: C.primaryCont }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide mb-0.5" style={{ color: C.onPrimaryCont, opacity: 0.7 }}>
                  Level {level.levelProgress.currentLevel}
                </div>
                <div className="text-4xl font-normal" style={{ color: C.onPrimaryCont }}>
                  {level.levelProgress.currentXP} XP
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs" style={{ color: C.onPrimaryCont, opacity: 0.7 }}>Next level</div>
                <div className="text-sm font-medium" style={{ color: C.onPrimaryCont }}>
                  {level.levelProgress.xpForNextLevel} XP
                </div>
              </div>
            </div>
            {/* M3 linear progress */}
            <div className="h-1 rounded-full overflow-hidden" style={{ background: `${C.onPrimaryCont}30` }}>
              <motion.div className="h-full rounded-full" style={{ background: C.onPrimaryCont }}
                initial={{ width: 0 }}
                animate={{ width: `${level.levelProgress.progressPercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }} />
            </div>
            <div className="flex justify-between text-xs mt-1" style={{ color: C.onPrimaryCont, opacity: 0.6 }}>
              <span>{level.levelProgress.currentXP % 100}/100 XP to next level</span>
              {level.currentStreak > 0 && (
                <span className="flex items-center gap-1">
                  <Flame className="w-3 h-3" style={{ color: C.error }} />
                  {level.currentStreak}d streak
                </span>
              )}
            </div>
          </motion.div>

          {/* 4 metric cards — 2-col grid */}
          <div className="grid grid-cols-2 gap-3">
            <M3MetricCard label="Progress" value={overallPct} unit="%" subtext={`${totalCompleted}/${totalQuestions} questions`}
              trend={overallPct > 50 ? 'up' : 'neutral'} bg={C.secondaryCont} fg={C.onSecondaryCont} />
            <M3MetricCard label="Streak" value={streak} subtext="days"
              trend={streak > 0 ? 'up' : 'neutral'} bg={C.errorCont} fg={C.onErrorCont} />
            <M3MetricCard label="Sessions" value={totalSessions} subtext="completed"
              trend="neutral" bg={C.primaryCont} fg={C.onPrimaryCont} />
            <M3MetricCard label={`${timeRange}d Activity`}
              value={activityData.reduce((a, d) => a + d.count, 0)}
              subtext="questions solved"
              trend={changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'neutral'}
              change={changePercent} bg={C.tertiaryCont} fg={C.onTertiaryCont} />
          </div>

          {/* Activity trend — bar + line */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-5" style={{ background: C.surfaceVar }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-base font-medium" style={{ color: C.onSurface }}>Activity Trend</span>
              <span className="text-xs" style={{ color: C.onSurfaceVar }}>Last 14 days</span>
            </div>
            <M3BarChart data={sessionHistory} labels={weekLabels} height={110} />
            <div className="mt-3">
              <M3LineChart data={sessionHistory} height={60} />
            </div>
          </motion.div>

          {/* Difficulty rings */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-5" style={{ background: C.surfaceVar }}>
            <span className="text-base font-medium block mb-4" style={{ color: C.onSurface }}>By Difficulty</span>
            <div className="flex justify-around">
              {[
                { label: 'Beginner', d: globalDifficulty.beginner, color: '#34a853' },
                { label: 'Intermediate', d: globalDifficulty.intermediate, color: '#fbbc04' },
                { label: 'Advanced', d: globalDifficulty.advanced, color: C.error },
              ].map(({ label, d, color }) => {
                const pct = d.total > 0 ? Math.round((d.done / d.total) * 100) : 0;
                return (
                  <div key={label} className="flex flex-col items-center gap-1">
                    <M3Ring pct={pct} color={color} label={label} />
                    <span className="text-xs" style={{ color: C.onSurfaceVar }}>{d.done}/{d.total}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Activity heatmap */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-5" style={{ background: C.surfaceVar }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-base font-medium" style={{ color: C.onSurface }}>Activity</span>
              <div className="flex gap-1">
                {(['30', '90', '365'] as const).map(r => (
                  <button key={r} onClick={() => setTimeRange(r)}
                    className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                    style={{
                      background: timeRange === r ? C.primary : 'transparent',
                      color: timeRange === r ? '#fff' : C.onSurfaceVar,
                    }}>
                    {r === '365' ? '1Y' : r + 'D'}
                  </button>
                ))}
              </div>
            </div>
            <M3Heatmap stats={stats} />
            {/* Legend */}
            <div className="flex items-center gap-1.5 mt-2 justify-end">
              <span className="text-xs" style={{ color: C.onSurfaceVar }}>Less</span>
              {HEAT_COLORS.map((c, i) => <div key={i} className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />)}
              <span className="text-xs" style={{ color: C.onSurfaceVar }}>More</span>
            </div>
          </motion.div>

          {/* Achievements */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-5" style={{ background: C.surfaceVar }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-base font-medium" style={{ color: C.onSurface }}>Achievements</span>
              <button onClick={() => setLocation('/badges')}
                className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full hover:bg-black/10 transition-colors"
                style={{ color: C.primary }}>
                View All <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {achievementProgress.filter(a => a.isUnlocked).slice(0, 8).map((ap, i) => (
                <motion.button key={ap.achievement.id}
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05, type: 'spring', stiffness: 260 }}
                  onClick={() => setLocation('/badges')}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-black/10 transition-colors"
                  style={{ background: C.primaryCont }}>
                  <span className="text-xl">{ap.achievement.icon || '🏆'}</span>
                  <span className="text-xs font-medium text-center leading-tight line-clamp-2"
                    style={{ color: C.onPrimaryCont }}>{ap.achievement.name}</span>
                </motion.button>
              ))}
            </div>

            {nextUp.length > 0 && (
              <div className="mt-4">
                <span className="text-xs font-medium uppercase tracking-wide block mb-2" style={{ color: C.onSurfaceVar }}>
                  Almost There
                </span>
                <div className="space-y-2">
                  {nextUp.slice(0, 3).map(ap => {
                    const pct = ap.target > 0 ? Math.min(100, (ap.current / ap.target) * 100) : 0;
                    return (
                      <div key={ap.achievement.id} className="flex items-center gap-3 p-3 rounded-2xl"
                        style={{ background: C.primaryCont }}>
                        <span className="text-lg flex-shrink-0">{ap.achievement.icon || '🏆'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate" style={{ color: C.onPrimaryCont }}>
                            {ap.achievement.name}
                          </div>
                          <div className="h-1 rounded-full overflow-hidden mt-1" style={{ background: `${C.onPrimaryCont}30` }}>
                            <div className="h-full rounded-full" style={{ background: C.primary, width: `${pct}%` }} />
                          </div>
                        </div>
                        <span className="text-xs flex-shrink-0" style={{ color: C.onPrimaryCont, opacity: 0.7 }}>
                          {ap.current}/{ap.target}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>

          {/* Channel progress */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-5" style={{ background: C.surfaceVar }}>
            <span className="text-base font-medium block mb-4" style={{ color: C.onSurface }}>Channel Progress</span>
            <div className="space-y-3">
              {moduleProgress.slice(0, 10).map((m, i) => (
                <motion.button key={m.id}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setLocation(`/channel/${m.id}`)}
                  className="w-full text-left flex items-center gap-3 p-3 rounded-2xl hover:bg-black/10 transition-colors"
                  style={{ background: C.primaryCont }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium truncate" style={{ color: C.onPrimaryCont }}>{m.name}</span>
                      <span className="text-xs flex-shrink-0 ml-2" style={{ color: C.onPrimaryCont, opacity: 0.7 }}>
                        {m.completed}/{m.total}
                      </span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: `${C.onPrimaryCont}25` }}>
                      <motion.div className="h-full rounded-full"
                        style={{ background: m.pct === 100 ? C.tertiary : C.primary }}
                        initial={{ width: 0 }} animate={{ width: `${m.pct}%` }}
                        transition={{ duration: 0.5, delay: i * 0.03 }} />
                    </div>
                  </div>
                  <span className="text-xs font-medium flex-shrink-0" style={{ color: m.pct === 100 ? C.tertiary : C.primary }}>
                    {m.pct}%
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>

        </div>
      </AppLayout>
    </>
  );
}
