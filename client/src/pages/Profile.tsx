/**
 * Profile — M3 redesign with tabs: Profile / Stats / Badges
 */
import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '../components/layout/AppLayout';
import { SEOHead } from '../components/SEOHead';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { useCredits } from '../context/CreditsContext';
import { useAchievements } from '../hooks/use-achievements';
import { useGlobalStats } from '../hooks/use-progress';
import { getAllQuestions, channels, getQuestions } from '../lib/data';
import {
  User, Settings, Trophy, Target, Sparkles,
  Volume2, Shuffle, Eye, ChevronRight, Edit2, Check, X, Download,
  BookOpen, Code2, GraduationCap, Flame, BarChart2, Mic, Award
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';

// ── M3 color tokens (CSS vars from design-system) ────────────────────────────
// primary=tone40, primary-container=tone90, on-primary-container=tone10
// error-container for streak flame, surface-variant for locked badges

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── M3 Switch ────────────────────────────────────────────────────────────────
function M3Switch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className="relative inline-flex items-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 rounded-full"
      style={{ width: 52, height: 32 }}
    >
      <span
        className="absolute inset-0 rounded-full transition-colors duration-200"
        style={{ background: on ? 'var(--color-primary)' : 'var(--color-surface-variant,#e7e0ec)', border: on ? 'none' : '2px solid var(--color-outline,#79747e)' }}
      />
      <motion.span
        className="absolute rounded-full shadow-md flex items-center justify-center"
        animate={{ x: on ? 24 : 4 }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        style={{
          width: on ? 24 : 16,
          height: on ? 24 : 16,
          top: on ? 4 : 8,
          background: on ? 'var(--color-on-primary,#fff)' : 'var(--color-outline,#79747e)',
        }}
      />
    </button>
  );
}

// ── M3 List Row (settings) ───────────────────────────────────────────────────
function M3ListRow({ icon, label, description, children }: {
  icon: React.ReactNode; label: string; description?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 min-h-[56px] rounded-xl transition-colors hover:bg-[var(--color-surface-variant,#e7e0ec)]/30">
      <div className="flex items-center gap-4">
        <div className="min-w-[48px] w-10 min-h-[48px] h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--color-secondary-container,#e8def8)' }}>
          {icon}
        </div>
        <div>
          <div className="text-sm font-medium" style={{ color: 'var(--color-on-surface,#1c1b1f)' }}>{label}</div>
          {description && <div className="text-xs mt-0.5" style={{ color: 'var(--color-on-surface-variant,#49454f)' }}>{description}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

// ── M3 Metric Card ───────────────────────────────────────────────────────────
function M3MetricCard({ value, label, color }: { value: number | string; label: string; color?: string }) {
  return (
    <div className="rounded-3xl p-4 flex flex-col gap-1"
      style={{ background: 'var(--color-secondary-container,#e8def8)' }}>
      <span className="font-normal leading-none" style={{ fontSize: 36, color: color || 'var(--color-on-secondary-container,#1d192b)' }}>
        {value}
      </span>
      <span className="text-xs font-medium tracking-wide uppercase" style={{ color: 'var(--color-on-secondary-container,#1d192b)', opacity: 0.7 }}>
        {label}
      </span>
    </div>
  );
}

// ── M3 Linear Progress ───────────────────────────────────────────────────────
function M3LinearProgress({ value, max, label }: { value: number; max: number; label?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--color-on-surface-variant,#49454f)' }}>
          <span>{label}</span>
          <span>{value}/{max} XP</span>
        </div>
      )}
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-variant,#e7e0ec)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'var(--color-primary,#6750a4)' }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ── Heatmap helpers ──────────────────────────────────────────────────────────
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
// M3 primary tones: 10/40/70/90
const HEATMAP_TONES = [
  'var(--color-surface-variant,#e7e0ec)',
  'var(--color-primary-container,#eaddff)',
  'var(--color-primary,#6750a4)',
  '#4a3780',
  '#2d1f5e',
];
function activityLevel(count: number) {
  if (!count) return 0;
  if (count < 3) return 1;
  if (count < 6) return 2;
  if (count < 10) return 3;
  return 4;
}

// ── SVG Heatmap ──────────────────────────────────────────────────────────────
function SVGHeatmap({ stats }: { stats: { date: string; count: number }[] }) {
  const [tooltip, setTooltip] = useState<{ date: string; count: number; x: number; y: number } | null>(null);
  const { cells, monthLabels } = useMemo(() => {
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
    return { cells, monthLabels: months };
  }, [stats]);

  const CELL = 10, GAP = 2, TOTAL = CELL + GAP;
  const W = 53 * TOTAL, H = 7 * TOTAL + 18;

  return (
    <div className="overflow-x-auto">
      <svg width={W} height={H} style={{ minWidth: W }}>
        {monthLabels.map(({ label, col }) => (
          <text key={`${label}-${col}`} x={col * TOTAL} y={10} fontSize={9}
            fill="var(--color-on-surface-variant,#49454f)">{label}</text>
        ))}
        {cells.map(cell => (
          <rect
            key={cell.date}
            x={cell.col * TOTAL}
            y={18 + cell.row * TOTAL}
            width={CELL} height={CELL} rx={2}
            fill={HEATMAP_TONES[activityLevel(cell.count)]}
            className="cursor-pointer transition-opacity hover:opacity-80"
            onMouseEnter={e => {
              const r = (e.target as SVGRectElement).getBoundingClientRect();
              setTooltip({ date: cell.date, count: cell.count, x: r.left, y: r.top });
            }}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}
      </svg>
      {tooltip && (
        <div className="fixed z-50 pointer-events-none px-2 py-1 rounded-lg text-xs shadow-lg"
          style={{ left: tooltip.x + 12, top: tooltip.y - 28, background: 'var(--color-surface-variant,#e7e0ec)', color: 'var(--color-on-surface-variant,#49454f)' }}>
          {formatDate(tooltip.date)} · {tooltip.count} {tooltip.count === 1 ? 'activity' : 'activities'}
        </div>
      )}
    </div>
  );
}

// ── SVG Bar Chart ─────────────────────────────────────────────────────────────
function SVGBarChart({ data, height = 80 }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const W = 100, BAR_W = W / data.length - 1;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none">
      {data.map((d, i) => {
        const bh = (d.value / max) * (height - 16);
        const x = i * (W / data.length) + 0.5;
        const y = height - bh - 8;
        return (
          <g key={i}>
            <motion.rect x={`${x}%`} y={y} width={`${BAR_W}%`} height={bh} rx={2}
              fill="var(--color-primary,#6750a4)" opacity={0.85}
              initial={{ height: 0, y: height - 8 }} animate={{ height: bh, y }}
              transition={{ duration: 0.4, delay: i * 0.03 }} />
            <text x={`${x + BAR_W / 2}%`} y={height - 1} textAnchor="middle" fontSize={7}
              fill="var(--color-on-surface-variant,#49454f)">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── SVG Line Chart ────────────────────────────────────────────────────────────
function SVGLineChart({ data, height = 60 }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = height - (v / max) * (height - 8) - 4;
    return `${x},${y}`;
  }).join(' ');
  const area = `M${pts.split(' ').map((p,i) => `${i===0?'M':'L'}${p}`).join(' ')} L100,${height} L0,${height} Z`;
  const line = pts.split(' ').map((p,i) => `${i===0?'M':'L'}${p}`).join(' ');
  return (
    <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="lc-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary,#6750a4)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--color-primary,#6750a4)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#lc-area)" />
      <motion.path d={line} fill="none" stroke="var(--color-primary,#6750a4)" strokeWidth={1.5}
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />
    </svg>
  );
}

// ── Profile Tab ───────────────────────────────────────────────────────────────
function ProfileTab({ streak, totalCompleted }: { streak: number; totalCompleted: number }) {
  const [, setLocation] = useLocation();
  const { preferences, toggleShuffleQuestions, togglePrioritizeUnvisited } = useUserPreferences();
  const { balance } = useCredits();
  const { unlocked: unlockedBadges } = useAchievements();

  const [editingName, setEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(() => localStorage.getItem('user-display-name') || 'Learner');
  const [nameInput, setNameInput] = useState(displayName);

  const memberSince = useMemo(() => {
    try {
      const p = JSON.parse(localStorage.getItem('user-preferences') || '{}');
      if (p.createdAt) return new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch { /* ignore */ }
    return 'Recently';
  }, []);

  const learningSummary = useMemo(() => {
    const certKw = ['aws','kubernetes','terraform','gcp','azure','comptia','cka','ckad','cks'];
    const codeKw = ['algorithm','coding','frontend','backend'];
    let topicsStudied = 0, certsPracticed = 0, codingDone = 0;
    channels.forEach(ch => {
      const s = localStorage.getItem(`progress-${ch.id}`);
      if (!s) return;
      const completed = JSON.parse(s) as string[];
      if (!completed.length) return;
      topicsStudied++;
      const id = ch.id.toLowerCase();
      if (certKw.some(k => id.includes(k))) certsPracticed++;
      if (codeKw.some(k => id.includes(k))) codingDone += completed.length;
    });
    return { topicsStudied, certsPracticed, codingDone };
  }, []);

  const exportData = () => {
    const data: Record<string, unknown> = { exportedAt: new Date().toISOString(), xp: balance, totalCompleted };
    Object.keys(localStorage).forEach(k => { data[k] = localStorage.getItem(k); });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'open-interview-data.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const level = Math.floor(balance / 100);
  const xpInLevel = balance % 100;
  const initials = getInitials(displayName);

  const saveName = () => {
    const t = nameInput.trim() || 'Learner';
    setDisplayName(t); localStorage.setItem('user-display-name', t); setEditingName(false);
  };

  return (
    <div className="space-y-4">
      {/* M3 Large Top App Bar style profile header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="rounded-3xl p-6" style={{ background: 'var(--color-surface-variant,#e7e0ec)' }}>
        <div className="flex flex-col items-center gap-3">
          {/* 64dp avatar circle */}
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0"
            style={{ background: 'var(--color-primary-container,#eaddff)', color: 'var(--color-on-primary-container,#21005d)' }}>
            {initials}
          </div>

          {/* Display name — Headline Medium */}
          {editingName ? (
            <div className="flex items-center gap-2">
              <input autoFocus value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
                className="text-center bg-transparent border-b-2 outline-none px-2 text-2xl font-normal"
                style={{ borderColor: 'var(--color-primary,#6750a4)', color: 'var(--color-on-surface,#1c1b1f)' }} />
              <button onClick={saveName} className="p-1 rounded-full" style={{ color: 'var(--color-primary,#6750a4)' }}><Check className="w-4 h-4" /></button>
              <button onClick={() => setEditingName(false)} className="p-1 rounded-full" style={{ color: 'var(--color-error,#b3261e)' }}><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-normal" style={{ color: 'var(--color-on-surface,#1c1b1f)' }}>{displayName}</h2>
              <button onClick={() => { setNameInput(displayName); setEditingName(true); }}
                className="p-1 rounded-full transition-colors hover:bg-black/10"
                style={{ color: 'var(--color-on-surface-variant,#49454f)' }}>
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Level badge */}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-medium"
              style={{ background: 'var(--color-tertiary-container,#ffd8e4)', color: 'var(--color-on-tertiary-container,#31111d)' }}>
              Level {level}
            </span>
            <span className="text-xs" style={{ color: 'var(--color-on-surface-variant,#49454f)' }}>Member since {memberSince}</span>
          </div>

          {/* XP progress — M3 linear */}
          <div className="w-full max-w-xs">
            <M3LinearProgress value={xpInLevel} max={100} label={`Level ${level} → ${level + 1}`} />
          </div>
        </div>
      </motion.div>

      {/* Stats — 2-col metric card grid */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.35 }}>
        <div className="grid grid-cols-2 gap-3">
          <M3MetricCard value={balance} label="XP" color="var(--color-primary,#6750a4)" />
          <M3MetricCard value={totalCompleted} label="Completed" />
          <M3MetricCard value={unlockedBadges.length} label="Badges" color="var(--color-tertiary,#7d5260)" />
          <M3MetricCard value={streak} label="Day Streak" color="var(--color-error,#b3261e)" />
        </div>
      </motion.div>

      {/* Streak card — M3 error-container (warm) */}
      {streak > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.35 }}
          className="rounded-3xl p-5 flex items-center gap-4"
          style={{ background: 'var(--color-error-container,#f9dedc)' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--color-error,#b3261e)' }}>
            <Flame className="w-6 h-6" style={{ color: 'var(--color-on-error,#fff)' }} />
          </div>
          <div>
            <div className="text-4xl font-normal leading-none" style={{ color: 'var(--color-on-error-container,#410e0b)' }}>{streak}</div>
            <div className="text-xs font-medium mt-0.5" style={{ color: 'var(--color-on-error-container,#410e0b)', opacity: 0.7 }}>
              DAY STREAK
            </div>
          </div>
        </motion.div>
      )}

      {/* Achievements preview */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.35 }}
        className="rounded-3xl p-5" style={{ background: 'var(--color-surface-variant,#e7e0ec)' }}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-base font-medium" style={{ color: 'var(--color-on-surface,#1c1b1f)' }}>Achievements</span>
          <button onClick={() => setLocation('/badges')}
            className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full transition-colors hover:bg-black/10"
            style={{ color: 'var(--color-primary,#6750a4)' }}>
            View All <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        {unlockedBadges.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {unlockedBadges.slice(0, 6).map((badge, i) => {
              const { achievement } = badge;
              const iconName = (achievement.icon || 'star').split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
              const IconComp = (LucideIcons as any)[iconName] || Trophy;
              return (
                <motion.button key={achievement.id}
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 + i * 0.05, type: 'spring', stiffness: 260 }}
                  onClick={() => setLocation('/badges')}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-colors hover:bg-black/10"
                  style={{ background: 'var(--color-primary-container,#eaddff)' }}>
                  <IconComp className="w-6 h-6" style={{ color: 'var(--color-on-primary-container,#21005d)' }} />
                  <span className="text-xs font-medium text-center leading-tight line-clamp-2"
                    style={{ color: 'var(--color-on-primary-container,#21005d)' }}>
                    {achievement.name}
                  </span>
                </motion.button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-center py-4" style={{ color: 'var(--color-on-surface-variant,#49454f)' }}>
            Complete challenges to earn badges
          </p>
        )}
      </motion.div>

      {/* Learning Summary */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.35 }}
        className="rounded-3xl p-5" style={{ background: 'var(--color-surface-variant,#e7e0ec)' }}>
        <span className="text-base font-medium block mb-4" style={{ color: 'var(--color-on-surface,#1c1b1f)' }}>Learning Summary</span>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Target, label: 'Topics', value: learningSummary.topicsStudied },
            { icon: GraduationCap, label: 'Certs', value: learningSummary.certsPracticed },
            { icon: Code2, label: 'Coding', value: learningSummary.codingDone },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-2xl p-3 text-center"
              style={{ background: 'var(--color-primary-container,#eaddff)' }}>
              <Icon className="w-4 h-4 mx-auto mb-1" style={{ color: 'var(--color-on-primary-container,#21005d)' }} />
              <div className="text-2xl font-normal" style={{ color: 'var(--color-on-primary-container,#21005d)' }}>{value}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--color-on-primary-container,#21005d)', opacity: 0.7 }}>{label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Settings — M3 list with switches */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.35 }}
        className="rounded-3xl p-2" style={{ background: 'var(--color-surface-variant,#e7e0ec)' }}>
        <span className="text-base font-medium block px-4 pt-3 pb-2" style={{ color: 'var(--color-on-surface,#1c1b1f)' }}>
          Learning Preferences
        </span>
        <M3ListRow icon={<Shuffle className="w-4 h-4" style={{ color: 'var(--color-on-secondary-container,#1d192b)' }} />}
          label="Shuffle Questions" description="Randomize question order">
          <M3Switch on={preferences.shuffleQuestions !== false} onToggle={toggleShuffleQuestions} />
        </M3ListRow>
        <M3ListRow icon={<Eye className="w-4 h-4" style={{ color: 'var(--color-on-secondary-container,#1d192b)' }} />}
          label="Prioritize New" description="Show unvisited questions first">
          <M3Switch on={preferences.prioritizeUnvisited !== false} onToggle={togglePrioritizeUnvisited} />
        </M3ListRow>
        <M3ListRow icon={<Volume2 className="w-4 h-4" style={{ color: 'var(--color-on-secondary-container,#1d192b)' }} />}
          label="Auto-play Audio" description="Automatically read questions aloud">
          <M3Switch
            on={!!((preferences as unknown as Record<string, unknown>)['autoPlayTTS'])}
            onToggle={() => {
              try {
                const p = JSON.parse(localStorage.getItem('user-preferences') || '{}');
                p.autoPlayTTS = !p.autoPlayTTS;
                localStorage.setItem('user-preferences', JSON.stringify(p));
                window.location.reload();
              } catch { /* ignore */ }
            }} />
        </M3ListRow>
      </motion.div>

      {/* Data export */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.35 }}>
        <button onClick={exportData}
          className="w-full flex items-center justify-between px-5 py-4 rounded-3xl transition-colors hover:opacity-90"
          style={{ background: 'var(--color-secondary-container,#e8def8)', color: 'var(--color-on-secondary-container,#1d192b)' }}>
          <span className="text-sm font-medium">Export my data</span>
          <Download className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
}

// ── Stats Tab ─────────────────────────────────────────────────────────────────
function StatsTab({ streak, totalCompleted }: { streak: number; totalCompleted: number }) {
  const [, setLocation] = useLocation();
  const { stats } = useGlobalStats();
  const { balance } = useCredits();

  const todayCount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return stats.find(s => s.date === today)?.count || 0;
  }, [stats]);

  const { moduleProgress, certCount, voiceSessions } = useMemo(() => {
    const modProgress = channels.map(ch => {
      const questions = getQuestions(ch.id);
      const stored = localStorage.getItem(`progress-${ch.id}`);
      const completedIds = stored ? new Set(JSON.parse(stored)) : new Set();
      const valid = Math.min(completedIds.size, questions.length);
      const pct = questions.length > 0 ? Math.min(100, Math.round((valid / questions.length) * 100)) : 0;
      return { id: ch.id, name: ch.name, completed: valid, total: questions.length, pct };
    }).filter(m => m.total > 0).sort((a, b) => b.pct - a.pct);
    return {
      moduleProgress: modProgress,
      certCount: modProgress.filter(m => m.pct === 100).length,
      voiceSessions: parseInt(localStorage.getItem('voice-sessions-count') || '0', 10),
    };
  }, [stats]);

  const weeklyData = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const iso = d.toISOString().split('T')[0];
    return { label: d.toLocaleDateString('en-US', { weekday: 'short' }), value: stats.find(s => s.date === iso)?.count || 0 };
  }), [stats]);

  const dailyData = useMemo(() => Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    const iso = d.toISOString().split('T')[0];
    return stats.find(s => s.date === iso)?.count || 0;
  }), [stats]);

  const topicsMastered = moduleProgress.filter(m => m.pct === 100).length;

  return (
    <div className="space-y-4">
      {/* 2-col metric grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { value: totalCompleted, label: 'Questions', sub: `+${todayCount} today` },
          { value: topicsMastered, label: 'Mastered' },
          { value: certCount, label: 'Certs Done' },
          { value: voiceSessions, label: 'Voice Sessions' },
        ].map(({ value, label, sub }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="rounded-3xl p-4 flex flex-col gap-1"
            style={{ background: 'var(--color-secondary-container,#e8def8)' }}>
            <span className="text-4xl font-normal leading-none" style={{ color: 'var(--color-on-secondary-container,#1d192b)' }}>{value}</span>
            <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-on-secondary-container,#1d192b)', opacity: 0.7 }}>{label}</span>
            {sub && <span className="text-xs" style={{ color: 'var(--color-primary,#6750a4)' }}>{sub}</span>}
          </motion.div>
        ))}
      </div>

      {/* Activity heatmap */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.35 }}
        className="rounded-3xl p-5" style={{ background: 'var(--color-surface-variant,#e7e0ec)' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-base font-medium" style={{ color: 'var(--color-on-surface,#1c1b1f)' }}>Activity</span>
          <span className="text-xs" style={{ color: 'var(--color-on-surface-variant,#49454f)' }}>52 weeks</span>
        </div>
        <SVGHeatmap stats={stats} />
        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-2 justify-end">
          <span className="text-xs" style={{ color: 'var(--color-on-surface-variant,#49454f)' }}>Less</span>
          {HEATMAP_TONES.map((t, i) => (
            <div key={i} className="w-2.5 h-2.5 rounded-sm" style={{ background: t }} />
          ))}
          <span className="text-xs" style={{ color: 'var(--color-on-surface-variant,#49454f)' }}>More</span>
        </div>
      </motion.div>

      {/* Weekly bar + 30-day line */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.35 }}
          className="rounded-3xl p-4" style={{ background: 'var(--color-surface-variant,#e7e0ec)' }}>
          <span className="text-xs font-medium block mb-2" style={{ color: 'var(--color-on-surface-variant,#49454f)' }}>This Week</span>
          <SVGBarChart data={weeklyData} height={80} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.35 }}
          className="rounded-3xl p-4" style={{ background: 'var(--color-surface-variant,#e7e0ec)' }}>
          <span className="text-xs font-medium block mb-2" style={{ color: 'var(--color-on-surface-variant,#49454f)' }}>30-day Trend</span>
          <SVGLineChart data={dailyData} height={80} />
        </motion.div>
      </div>

      {/* Channel progress */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.35 }}
        className="rounded-3xl p-5" style={{ background: 'var(--color-surface-variant,#e7e0ec)' }}>
        <span className="text-base font-medium block mb-4" style={{ color: 'var(--color-on-surface,#1c1b1f)' }}>Channel Progress</span>
        <div className="space-y-3">
          {moduleProgress.slice(0, 8).map((mod, i) => (
            <motion.button key={mod.id}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22 + i * 0.03 }}
              onClick={() => setLocation(`/channel/${mod.id}`)}
              className="w-full text-left rounded-2xl p-3 transition-colors hover:bg-black/10"
              style={{ background: 'var(--color-primary-container,#eaddff)' }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium truncate max-w-[75%]"
                  style={{ color: 'var(--color-on-primary-container,#21005d)' }}>{mod.name}</span>
                <span className="text-xs font-medium flex-shrink-0"
                  style={{ color: mod.pct === 100 ? 'var(--color-tertiary,#7d5260)' : 'var(--color-on-primary-container,#21005d)', opacity: 0.7 }}>
                  {mod.pct === 100 ? '✓' : `${mod.pct}%`}
                </span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--color-primary-container,#eaddff)', filter: 'brightness(0.85)' }}>
                <motion.div className="h-full rounded-full"
                  style={{ background: mod.pct === 100 ? 'var(--color-tertiary,#7d5260)' : 'var(--color-primary,#6750a4)' }}
                  initial={{ width: 0 }} animate={{ width: `${mod.pct}%` }}
                  transition={{ duration: 0.6, delay: 0.3 + i * 0.04 }} />
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ── Badges Tab (inline, minimal) ──────────────────────────────────────────────
function BadgesTab() {
  const [, setLocation] = useLocation();
  const { progress: allBadges, unlocked: unlockedBadges } = useAchievements();

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl p-4" style={{ background: 'var(--color-secondary-container,#e8def8)' }}>
          <span className="text-4xl font-normal" style={{ color: 'var(--color-on-secondary-container,#1d192b)' }}>{unlockedBadges.length}</span>
          <span className="text-xs font-medium uppercase tracking-wide block mt-1" style={{ color: 'var(--color-on-secondary-container,#1d192b)', opacity: 0.7 }}>
            Earned / {allBadges.length}
          </span>
        </div>
        <button onClick={() => setLocation('/badges')}
          className="rounded-3xl p-4 flex flex-col justify-between transition-colors hover:opacity-90"
          style={{ background: 'var(--color-primary-container,#eaddff)' }}>
          <Sparkles className="w-5 h-5" style={{ color: 'var(--color-on-primary-container,#21005d)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--color-on-primary-container,#21005d)' }}>View All Badges</span>
        </button>
      </div>

      {/* Badge grid — M3 filled tonal cards, locked at 38% opacity */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {allBadges.slice(0, 12).map((bp, i) => {
          const { achievement, isUnlocked } = bp;
          const iconName = (achievement.icon || 'star').split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
          const IconComp = (LucideIcons as any)[iconName] || Trophy;
          return (
            <motion.button key={achievement.id}
              initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 260 }}
              onClick={() => setLocation('/badges')}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-colors"
              style={{
                background: 'var(--color-secondary-container,#e8def8)',
                opacity: isUnlocked ? 1 : 0.38,
              }}>
              {isUnlocked ? (
                <IconComp className="w-6 h-6" style={{ color: 'var(--color-on-secondary-container,#1d192b)' }} />
              ) : (
                <div className="relative w-6 h-6 flex items-center justify-center">
                  <IconComp className="w-6 h-6" style={{ color: 'var(--color-on-surface-variant,#49454f)' }} />
                </div>
              )}
              <span className="text-xs font-medium text-center leading-tight line-clamp-2"
                style={{ color: 'var(--color-on-secondary-container,#1d192b)' }}>
                {achievement.name}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ── M3 Primary Tabs ───────────────────────────────────────────────────────────
const TABS = ['Profile', 'Stats', 'Badges'] as const;
type Tab = typeof TABS[number];

function M3Tabs({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const idx = TABS.indexOf(active);
    const btn = container.querySelectorAll('button')[idx] as HTMLButtonElement | undefined;
    if (btn) setIndicatorStyle({ left: btn.offsetLeft, width: btn.offsetWidth });
  }, [active]);

  return (
    <div ref={containerRef} className="relative flex border-b"
      style={{ borderColor: 'var(--color-surface-variant,#e7e0ec)' }}>
      {TABS.map(tab => (
        <button key={tab} onClick={() => onChange(tab)}
          className="flex-1 py-3 text-sm font-medium transition-colors focus-visible:outline-none"
          style={{ color: active === tab ? 'var(--color-primary,#6750a4)' : 'var(--color-on-surface-variant,#49454f)' }}>
          {tab}
        </button>
      ))}
      {/* Animated indicator */}
      <motion.div className="absolute bottom-0 h-0.5 rounded-full"
        style={{ background: 'var(--color-primary,#6750a4)' }}
        animate={indicatorStyle}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }} />
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { stats } = useGlobalStats();
  const [activeTab, setActiveTab] = useState<Tab>('Profile');

  const streak = useMemo(() => {
    let s = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      if (stats.find(x => x.date === d.toISOString().split('T')[0])) s++; else break;
    }
    return s;
  }, [stats]);

  const [totalCompleted, setTotalCompleted] = useState(0);
  useEffect(() => {
    const allQ = getAllQuestions();
    const ids = new Set<string>();
    allQ.forEach(q => {
      const s = localStorage.getItem(`progress-${q.channel}`);
      if (s && new Set(JSON.parse(s)).has(q.id)) ids.add(q.id);
    });
    setTotalCompleted(ids.size);
  }, []);

  return (
    <>
      <SEOHead title="Profile & Stats" description="Your profile, settings and learning statistics"
        canonical="https://open-interview.github.io/profile" />
      <AppLayout fullWidth>
        <div className="min-h-screen" style={{ background: 'var(--color-background,#fffbfe)' }}>
          <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
            {/* M3 Large Top App Bar */}
            <div className="mb-4">
              <h1 className="text-3xl font-normal" style={{ color: 'var(--color-on-surface,#1c1b1f)' }}>Profile</h1>
            </div>

            {/* M3 Primary Tabs */}
            <M3Tabs active={activeTab} onChange={setActiveTab} />

            <div className="mt-4">
              <AnimatePresence mode="wait">
                <motion.div key={activeTab}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}>
                  {activeTab === 'Profile' && <ProfileTab streak={streak} totalCompleted={totalCompleted} />}
                  {activeTab === 'Stats' && <StatsTab streak={streak} totalCompleted={totalCompleted} />}
                  {activeTab === 'Badges' && <BadgesTab />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </AppLayout>
    </>
  );
}
