/**
 * Profile & Stats — merged page with tabs
 */

import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line, CartesianGrid
} from 'recharts';
import { AppLayout } from '../components/layout/AppLayout';
import { PageHeader, SectionHeader } from '@/components/ui/page';
import { SEOHead } from '../components/SEOHead';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { useCredits } from '../context/CreditsContext';
import { useAchievements } from '../hooks/use-achievements';
import { useGlobalStats } from '../hooks/use-progress';
import { getAllQuestions, channels, getQuestions } from '../lib/data';
import {
  User, Settings, Zap, Trophy, Target, Sparkles,
  Volume2, Shuffle, Eye, ChevronRight, Edit2, Check, X, Download,
  BookOpen, Code2, GraduationCap, Flame, Calendar, BarChart2,
  Award, Mic, TrendingUp, Clock
} from 'lucide-react';

// ── helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} role="switch" aria-checked={on}
      className="w-12 h-6 rounded-full transition-all flex-shrink-0 relative"
      style={{ background: on ? 'var(--gradient-primary)' : 'var(--surface-4)' }}>
      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-6' : 'translate-x-0.5'}`} />
    </button>
  );
}

function SettingRow({ icon, label, description, children }: {
  icon: React.ReactNode; label: string; description?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-[var(--radius-md)] transition-colors hover:bg-[var(--surface-3)]">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--surface-3)' }}>
          {icon}
        </div>
        <div>
          <div className="text-sm font-medium">{label}</div>
          {description && <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{description}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

const HEATMAP_LEVELS = ['bg-white/5','bg-violet-500/30','bg-violet-500/55','bg-violet-500/80','bg-violet-400'];
const CHART_COLORS = ['#7c3aed','#6366f1','#06b6d4','#10b981','#f59e0b','#f43f5e','#8b5cf6','#0891b2'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function activityLevel(count: number) {
  if (!count) return 0;
  if (count < 3) return 1;
  if (count < 6) return 2;
  if (count < 10) return 3;
  return 4;
}

function HeatmapTooltip({ date, count }: { date: string; count: number }) {
  return (
    <div className="px-2 py-1 rounded-md text-xs font-medium pointer-events-none"
      style={{ background: 'var(--surface-4)', border: '1px solid var(--color-border)', color: 'var(--text-primary)' }}>
      {formatDate(date)} · {count} {count === 1 ? 'activity' : 'activities'}
    </div>
  );
}

// ── Profile Tab ───────────────────────────────────────────────────────────────

function ProfileTab() {
  const [, setLocation] = useLocation();
  const { preferences, toggleShuffleQuestions, togglePrioritizeUnvisited } = useUserPreferences();
  const { balance } = useCredits();
  const { unlocked: unlockedBadges } = useAchievements();
  const { stats } = useGlobalStats();
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [editingName, setEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(() => localStorage.getItem('user-display-name') || 'Learner');
  const [nameInput, setNameInput] = useState(displayName);

  const streak = useMemo(() => {
    let s = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      if (stats.find(x => x.date === d.toISOString().split('T')[0])) s++; else break;
    }
    return s;
  }, [stats]);

  const memberSince = useMemo(() => {
    try {
      const p = JSON.parse(localStorage.getItem('user-preferences') || '{}');
      if (p.createdAt) return new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch { /* ignore */ }
    return 'Recently';
  }, []);

  useEffect(() => {
    const allQ = getAllQuestions();
    const ids = new Set<string>();
    allQ.forEach(q => {
      const s = localStorage.getItem(`progress-${q.channel}`);
      if (s && new Set(JSON.parse(s)).has(q.id)) ids.add(q.id);
    });
    setTotalCompleted(ids.size);
  }, []);

  const learningSummary = useMemo(() => {
    const certKw = ['aws','kubernetes','terraform','gcp','azure','comptia','cisco','cka','ckad','cks'];
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
    const a = document.createElement('a'); a.href = url; a.download = 'code-reels-data.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const level = Math.floor(balance / 100);
  const xpInLevel = balance % 100;
  const initials = getInitials(displayName);

  const saveName = () => {
    const t = nameInput.trim() || 'Learner';
    setDisplayName(t); localStorage.setItem('user-display-name', t); setEditingName(false);
  };

  const fadeUp = (delay = 0) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.35 } });

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <motion.div {...fadeUp(0)} className="glass-card rounded-[var(--radius-2xl)] p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="p-0.5 rounded-full" style={{ background: 'var(--gradient-primary)' }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{ background: 'var(--surface-2)' }}>
              {initials}
            </div>
          </div>
          {editingName ? (
            <div className="flex items-center gap-2">
              <input autoFocus value={nameInput} onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
                className="text-center text-xl font-bold bg-transparent border-b-2 outline-none px-2"
                style={{ borderColor: 'var(--color-accent-violet)', color: 'var(--text-primary)' }} />
              <button onClick={saveName} className="p-1 rounded-full hover:bg-green-500/20 text-green-400"><Check className="w-4 h-4" /></button>
              <button onClick={() => setEditingName(false)} className="p-1 rounded-full hover:bg-red-500/20 text-red-400"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{displayName}</h2>
              <button onClick={() => { setNameInput(displayName); setEditingName(true); }}
                className="p-1 rounded-full transition-colors hover:bg-white/10" style={{ color: 'var(--text-tertiary)' }}>
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Member since {memberSince}</p>
          <div className="flex gap-6 pt-2 border-t w-full justify-center" style={{ borderColor: 'var(--color-border)' }}>
            {[
              { label: 'XP', value: balance, color: 'var(--color-xp)' },
              { label: 'Level', value: level, color: 'var(--color-accent-violet-light)' },
              { label: 'Done', value: totalCompleted, color: 'var(--color-accent-cyan)' },
              { label: 'Badges', value: unlockedBadges.length, color: 'var(--color-success)' },
              { label: 'Streak', value: streak, color: 'var(--color-streak)' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <div className="text-lg font-bold" style={{ color }}>{value}</div>
                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{label}</div>
              </div>
            ))}
          </div>
          <div className="w-full">
            <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>
              <span>Level {level}</span><span>{xpInLevel}/100 XP</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-4)' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${xpInLevel}%` }} transition={{ duration: 1 }}
                className="h-full rounded-full" style={{ background: 'var(--gradient-primary)' }} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Achievements */}
      <motion.div {...fadeUp(0.1)} className="glass-card rounded-[var(--radius-2xl)] p-6">
        <div className="flex items-center justify-between mb-4">
          <SectionHeader title="Achievements" icon={<Trophy className="w-4 h-4" style={{ color: 'var(--color-xp)' }} />} />
          <button onClick={() => setLocation('/badges')} className="text-xs flex items-center gap-1 hover:opacity-80" style={{ color: 'var(--color-accent-violet-light)' }}>
            View All <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        {unlockedBadges.length > 0 ? (
          <div className="grid grid-cols-6 gap-3">
            {unlockedBadges.slice(0, 6).map((badge, i) => (
              <motion.div key={badge.achievement.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 + i * 0.05 }}
                title={badge.achievement.name}
                className="aspect-square rounded-xl flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
                style={{ background: badge.achievement.gradient || 'var(--surface-3)', border: '1px solid var(--color-border)' }}>
                <Trophy className="w-5 h-5 text-white" />
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-center py-4" style={{ color: 'var(--text-tertiary)' }}>Complete challenges to earn badges</p>
        )}
      </motion.div>

      {/* Learning Preferences */}
      <motion.div {...fadeUp(0.2)} className="glass-card rounded-[var(--radius-2xl)] p-6">
        <SectionHeader title="Learning Preferences" icon={<Settings className="w-4 h-4" style={{ color: 'var(--color-accent-cyan)' }} />} />
        <div className="space-y-1">
          <SettingRow icon={<Shuffle className="w-4 h-4" style={{ color: 'var(--color-accent-violet-light)' }} />} label="Shuffle Questions" description="Randomize question order">
            <Toggle on={preferences.shuffleQuestions !== false} onToggle={toggleShuffleQuestions} />
          </SettingRow>
          <SettingRow icon={<Eye className="w-4 h-4" style={{ color: 'var(--color-accent-cyan)' }} />} label="Prioritize New" description="Show unvisited questions first">
            <Toggle on={preferences.prioritizeUnvisited !== false} onToggle={togglePrioritizeUnvisited} />
          </SettingRow>
          <SettingRow icon={<Volume2 className="w-4 h-4" style={{ color: 'var(--color-accent-violet-light)' }} />} label="Auto-play Audio" description="Automatically read questions">
            <Toggle on={!!((preferences as unknown as Record<string, unknown>)['autoPlayTTS'])}
              onToggle={() => {
                try {
                  const p = JSON.parse(localStorage.getItem('user-preferences') || '{}');
                  p.autoPlayTTS = !p.autoPlayTTS;
                  localStorage.setItem('user-preferences', JSON.stringify(p));
                  window.location.reload();
                } catch { /* ignore */ }
              }} />
          </SettingRow>
        </div>
      </motion.div>

      {/* Learning Summary */}
      <motion.div {...fadeUp(0.25)} className="glass-card rounded-[var(--radius-2xl)] p-6">
        <SectionHeader title="Learning Summary" icon={<BookOpen className="w-4 h-4" style={{ color: 'var(--color-accent-cyan)' }} />} />
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Target, label: 'Topics Studied', value: learningSummary.topicsStudied, color: 'var(--color-accent-violet-light)', bg: 'rgba(124,58,237,0.1)' },
            { icon: GraduationCap, label: 'Certs Practiced', value: learningSummary.certsPracticed, color: 'var(--color-xp)', bg: 'rgba(245,158,11,0.1)' },
            { icon: Code2, label: 'Coding Done', value: learningSummary.codingDone, color: 'var(--color-accent-cyan)', bg: 'rgba(6,182,212,0.1)' },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="rounded-[var(--radius-xl)] p-4 text-center" style={{ background: bg, border: `1px solid ${bg.replace('0.1', '0.25')}` }}>
              <Icon className="w-5 h-5 mx-auto mb-1" style={{ color }} />
              <div className="text-2xl font-black">{value}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Data Export */}
      <motion.div {...fadeUp(0.28)} className="glass-card rounded-[var(--radius-2xl)] p-6">
        <SectionHeader title="Data" icon={<Download className="w-4 h-4" style={{ color: 'var(--color-accent-cyan)' }} />} />
        <button onClick={exportData} className="w-full flex items-center justify-between px-4 py-3 rounded-[var(--radius-lg)] transition-colors hover:opacity-80"
          style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', color: 'var(--color-accent-cyan)' }}>
          <span className="text-sm font-medium">Export my data</span>
          <Download className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
}

// ── Stats Tab ─────────────────────────────────────────────────────────────────

function StatsTab() {
  const [, setLocation] = useLocation();
  const { stats } = useGlobalStats();
  const { balance } = useCredits();
  const { unlocked: unlockedBadges } = useAchievements();
  const [hoveredCell, setHoveredCell] = useState<{ date: string; count: number; x: number; y: number } | null>(null);

  const todayCount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return stats.find(s => s.date === today)?.count || 0;
  }, [stats]);

  const { totalCompleted, streak, moduleProgress, certCount, voiceSessions } = useMemo(() => {
    const allQ = getAllQuestions();
    const allIds = new Set<string>();
    const modProgress = channels.map(ch => {
      const questions = getQuestions(ch.id);
      const stored = localStorage.getItem(`progress-${ch.id}`);
      const completedIds = stored ? new Set(JSON.parse(stored)) : new Set();
      Array.from(completedIds).forEach(id => allIds.add(id as string));
      const valid = Math.min(completedIds.size, questions.length);
      const pct = questions.length > 0 ? Math.min(100, Math.round((valid / questions.length) * 100)) : 0;
      return { id: ch.id, name: ch.name, completed: valid, total: questions.length, pct };
    }).filter(m => m.total > 0).sort((a, b) => b.pct - a.pct);

    let currentStreak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      if (stats.find(x => x.date === d.toISOString().split('T')[0])) currentStreak++; else break;
    }
    return {
      totalCompleted: allIds.size,
      totalQuestions: allQ.length,
      streak: currentStreak,
      moduleProgress: modProgress,
      certCount: modProgress.filter(m => m.pct === 100).length,
      voiceSessions: parseInt(localStorage.getItem('voice-sessions-count') || '0', 10),
    };
  }, [stats]);

  const level = Math.floor(balance / 100);
  const topicsMastered = moduleProgress.filter(m => m.pct === 100).length;

  const { heatmapCells, monthLabels } = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    const statsMap = new Map(stats.map(s => [s.date, s.count]));
    const cells: { date: string; count: number; col: number; row: number }[] = [];
    const months: { label: string; col: number }[] = [];
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

  const weeklyData = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const iso = d.toISOString().split('T')[0];
    return { day: d.toLocaleDateString('en-US', { weekday: 'short' }), count: stats.find(s => s.date === iso)?.count || 0 };
  }), [stats]);

  const dailyData = useMemo(() => Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    const iso = d.toISOString().split('T')[0];
    return { date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count: stats.find(s => s.date === iso)?.count || 0 };
  }), [stats]);

  const recentSessions = useMemo(() => [...stats]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
    .map(s => ({ date: s.date, count: s.count, mode: s.count >= 10 ? 'test' : s.count >= 5 ? 'voice' : 'swipe' })), [stats]);

  const topicData = useMemo(() => moduleProgress.filter(m => m.completed > 0).slice(0, 8)
    .map((m, i) => ({ name: m.name, value: m.completed, color: CHART_COLORS[i % CHART_COLORS.length] })), [moduleProgress]);

  const { calendarDays, calendarMonth } = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear(); const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const statsSet = new Set(stats.map(s => s.date));
    return {
      calendarDays: Array.from({ length: daysInMonth }, (_, i) => {
        const d = i + 1;
        const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        return { day: d, iso, active: statsSet.has(iso), isToday: d === now.getDate() };
      }),
      calendarMonth: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    };
  }, [stats]);

  const fadeUp = (delay = 0) => ({ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.4 } });

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Target, label: 'Questions Answered', value: totalCompleted, sub: `+${todayCount} today`, color: 'var(--color-accent-cyan)', bg: 'rgba(6,182,212,0.12)', border: 'rgba(6,182,212,0.25)', delay: 0 },
          { icon: BarChart2, label: 'Topics Mastered', value: topicsMastered, sub: undefined, color: 'var(--color-accent-violet-light)', bg: 'rgba(124,58,237,0.12)', border: 'rgba(124,58,237,0.25)', delay: 0.05 },
          { icon: Trophy, label: 'Certifications', value: certCount, sub: undefined, color: 'var(--color-xp)', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', delay: 0.1 },
          { icon: Mic, label: 'Voice Sessions', value: voiceSessions, sub: undefined, color: 'var(--color-success)', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', delay: 0.15 },
        ].map(({ icon: Icon, label, value, sub, color, bg, border, delay }) => (
          <motion.div key={label} {...fadeUp(delay)} className="rounded-[var(--radius-xl)] p-5 flex flex-col gap-2" style={{ background: bg, border: `1px solid ${border}` }}>
            <Icon className="w-6 h-6" style={{ color }} />
            <div className="text-3xl font-black">{value}</div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</div>
            {sub && <div className="text-xs font-semibold" style={{ color }}>{sub}</div>}
          </motion.div>
        ))}
      </div>

      {/* Heatmap */}
      <motion.div {...fadeUp(0.2)} className="glass-card rounded-[var(--radius-2xl)] p-6">
        <div className="flex items-center gap-2 mb-4">
          <SectionHeader title="Activity Heatmap" icon={<Calendar className="w-5 h-5" style={{ color: 'var(--color-accent-violet-light)' }} />} />
          <span className="ml-auto text-xs" style={{ color: 'var(--text-tertiary)' }}>Last 52 weeks</span>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="relative h-5 mb-1 pl-8">
              {monthLabels.map(({ label, col }) => (
                <span key={`${label}-${col}`} className="text-xs absolute" style={{ color: 'var(--text-tertiary)', left: `${32 + col * 11}px` }}>{label}</span>
              ))}
            </div>
            <div className="flex gap-1">
              <div className="flex flex-col gap-1 mr-1 pt-0.5">
                {DAY_LABELS.map((d, i) => (
                  <div key={d} className="text-xs w-6 text-right leading-[10px]" style={{ color: i % 2 === 0 ? 'var(--text-tertiary)' : 'transparent', height: '10px' }}>{d.slice(0, 1)}</div>
                ))}
              </div>
              <div className="relative flex gap-1">
                {Array.from({ length: 53 }, (_, col) => (
                  <div key={col} className="flex flex-col gap-1">
                    {Array.from({ length: 7 }, (_, row) => {
                      const cell = heatmapCells.find(c => c.col === col && c.row === row);
                      if (!cell) return <div key={row} className="w-[10px] h-[10px]" />;
                      return (
                        <div key={row} className={`w-[10px] h-[10px] rounded-sm cursor-pointer transition-transform hover:scale-125 ${HEATMAP_LEVELS[activityLevel(cell.count)]}`}
                          onMouseEnter={e => { const r = (e.target as HTMLElement).getBoundingClientRect(); setHoveredCell({ date: cell.date, count: cell.count, x: r.left, y: r.top }); }}
                          onMouseLeave={() => setHoveredCell(null)} />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 justify-end text-xs" style={{ color: 'var(--text-tertiary)' }}>
              <span>Less</span>
              {HEATMAP_LEVELS.map((cls, i) => <div key={i} className={`w-3 h-3 rounded-sm ${cls}`} />)}
              <span>More</span>
            </div>
          </div>
        </div>
        {hoveredCell && (
          <div className="fixed z-50 pointer-events-none" style={{ left: hoveredCell.x + 14, top: hoveredCell.y - 32 }}>
            <HeatmapTooltip date={hoveredCell.date} count={hoveredCell.count} />
          </div>
        )}
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div {...fadeUp(0.25)} className="glass-card rounded-[var(--radius-2xl)] p-6">
          <SectionHeader title="Weekly Activity" icon={<BarChart2 className="w-4 h-4" style={{ color: 'var(--color-accent-cyan)' }} />} />
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weeklyData} barSize={20}>
              <XAxis dataKey="day" tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: 'var(--surface-4)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="count" name="Activities" radius={[4,4,0,0]} fill="url(#barGrad)" />
              <defs><linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7c3aed" /><stop offset="100%" stopColor="#06b6d4" /></linearGradient></defs>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
        <motion.div {...fadeUp(0.3)} className="glass-card rounded-[var(--radius-2xl)] p-6">
          <SectionHeader title="Topic Distribution" icon={<Target className="w-4 h-4" style={{ color: 'var(--color-accent-violet-light)' }} />} />
          {topicData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={topicData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={2}>
                  {topicData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--surface-4)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-sm" style={{ color: 'var(--text-tertiary)' }}>Complete some questions to see distribution</div>
          )}
        </motion.div>
      </div>

      {/* 30-day line */}
      <motion.div {...fadeUp(0.35)} className="glass-card rounded-[var(--radius-2xl)] p-6">
        <div className="flex items-center gap-2 mb-4">
          <SectionHeader title="Performance Over Time" icon={<TrendingUp className="w-4 h-4" style={{ color: 'var(--color-accent-violet-light)' }} />} />
          <span className="ml-auto text-xs font-normal" style={{ color: 'var(--text-tertiary)' }}>Last 30 days</span>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={dailyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} axisLine={false} tickLine={false} interval={6} />
            <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: 'var(--surface-4)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }} cursor={{ stroke: 'var(--color-accent-violet-light)', strokeWidth: 1 }} />
            <Line type="monotone" dataKey="count" name="Questions" stroke="#7c3aed" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#7c3aed' }} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Recent Sessions */}
      <motion.div {...fadeUp(0.4)} className="glass-card rounded-[var(--radius-2xl)] p-6">
        <SectionHeader title="Recent Sessions" icon={<Clock className="w-4 h-4" style={{ color: 'var(--color-accent-cyan)' }} />} />
        {recentSessions.length > 0 ? (
          <div className="space-y-2">
            {recentSessions.map(s => {
              const cfg = { swipe: { label: 'Swipe', color: 'var(--color-accent-violet-light)', bg: 'rgba(124,58,237,0.12)' }, voice: { label: 'Voice', color: 'var(--color-success)', bg: 'rgba(16,185,129,0.12)' }, test: { label: 'Test', color: 'var(--color-xp)', bg: 'rgba(245,158,11,0.12)' } }[s.mode];
              return (
                <div key={s.date} className="flex items-center justify-between px-4 py-3 rounded-[var(--radius-lg)]" style={{ background: 'var(--surface-2)', border: '1px solid var(--color-border)' }}>
                  <span className="text-sm font-medium">{formatDate(s.date)}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: cfg?.bg, color: cfg?.color }}>{cfg?.label}</span>
                  <span className="text-sm font-bold">{s.count} <span className="text-xs font-normal" style={{ color: 'var(--text-tertiary)' }}>questions</span></span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-center py-4" style={{ color: 'var(--text-tertiary)' }}>No sessions yet — start learning!</p>
        )}
      </motion.div>

      {/* Streak Calendar */}
      <motion.div {...fadeUp(0.42)} className="glass-card rounded-[var(--radius-2xl)] p-6">
        <div className="flex items-center justify-between mb-4">
          <SectionHeader title={calendarMonth} icon={<Flame className="w-4 h-4" style={{ color: 'var(--color-streak)' }} />} />
          <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ background: 'rgba(249,115,22,0.15)', color: 'var(--color-streak)', border: '1px solid rgba(249,115,22,0.3)' }}>{streak} day streak</span>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {DAY_LABELS.map(d => <div key={d} className="text-xs pb-1" style={{ color: 'var(--text-tertiary)' }}>{d.slice(0, 1)}</div>)}
          {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay() }, (_, i) => <div key={`e-${i}`} />)}
          {calendarDays.map(({ day, active, isToday }) => (
            <div key={day} className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium ${isToday ? 'ring-2 ring-violet-500' : ''}`}
              style={{ background: active ? 'var(--gradient-primary)' : 'var(--surface-3)', color: active ? '#fff' : 'var(--text-secondary)' }}>
              {day}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Channel Progress */}
      <motion.div {...fadeUp(0.45)}>
        <SectionHeader title="Channel Progress" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {moduleProgress.slice(0, 10).map((mod, i) => (
            <motion.button key={mod.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.04 }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setLocation(`/channel/${mod.id}`)}
              className="p-5 rounded-[var(--radius-xl)] text-left" style={{ background: 'var(--surface-2)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-sm">{mod.name}</span>
                {mod.pct === 100 && <Trophy className="w-4 h-4" style={{ color: 'var(--color-xp)' }} />}
                <span className="text-xs font-bold ml-auto" style={{ color: 'var(--text-secondary)' }}>{mod.pct}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-4)' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${mod.pct}%` }} transition={{ duration: 0.8, delay: 0.55 + i * 0.05 }}
                  className="h-full rounded-full" style={{ background: 'var(--gradient-primary)' }} />
              </div>
              <div className="text-xs mt-1.5" style={{ color: 'var(--text-tertiary)' }}>{mod.completed}/{mod.total}</div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function ProfilePage() {
  return (
    <>
      <SEOHead title="Profile & Stats" description="Your profile, settings and learning statistics" canonical="https://open-interview.github.io/profile" />
      <AppLayout>
        <div className="min-h-screen bg-background text-foreground">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <PageHeader title="Profile & Stats" subtitle="Your settings, achievements and learning progress" />
            <ProfileTab />
            <div className="mt-12">
              <StatsTab />
            </div>
          </div>
        </div>
      </AppLayout>
    </>
  );
}
