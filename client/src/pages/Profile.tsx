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
import * as LucideIcons from 'lucide-react';

// ── helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div className="flex rounded-full overflow-hidden border border-border bg-surface-3">
      {(['On', 'Off'] as const).map((label) => {
        const active = label === 'On' ? on : !on;
        return (
          <button
            key={label}
            onClick={() => { if (label === 'On' ? !on : on) onToggle(); }}
            className={`px-4 py-2 min-h-[44px] text-xs font-semibold transition-all duration-200 cursor-pointer rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${active ? 'bg-gradient-primary text-white' : 'text-foreground/70'}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function SettingRow({ icon, label, description, children }: {
  icon: React.ReactNode; label: string; description?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3 px-4 min-h-[44px] rounded-xl transition-colors duration-200 hover:bg-surface-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-surface-3">
          {icon}
        </div>
        <div>
          <div className="text-base font-medium">{label}</div>
          {description && <div className="text-xs text-foreground/70">{description}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

const HEATMAP_LEVELS = ['bg-white/5','bg-primary/30','bg-primary/55','bg-primary/80','bg-primary'];
const CHART_COLORS = ['#1a73e8','#4285F4','#06b6d4','#34A853','#FBBC05','#EA4335','#8ab4f8','#0891b2'];
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
    <div className="px-2 py-1 rounded-md text-xs font-medium pointer-events-none bg-surface-4 border border-border text-foreground">
      {formatDate(date)} · {count} {count === 1 ? 'activity' : 'activities'}
    </div>
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
      <motion.div {...fadeUp(0)}
        className="glass-card rounded-2xl p-6 shadow-sm"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="p-0.5 rounded-full bg-gradient-primary">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white bg-surface-2">
              {initials}
            </div>
          </div>
          {editingName ? (
            <div className="flex items-center gap-2">
              <input autoFocus value={nameInput} onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
                className="text-center text-xl font-bold bg-transparent border-b-2 border-accent-violet outline-none px-2 text-foreground" />
              <button onClick={saveName} className="p-1 rounded-full hover:bg-green-500/20 text-green-400"><Check className="w-4 h-4" /></button>
              <button onClick={() => setEditingName(false)} className="p-1 rounded-full hover:bg-red-500/20 text-red-400"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{displayName}</h2>
              <button onClick={() => { setNameInput(displayName); setEditingName(true); }}
                className="p-1 rounded-full transition-colors hover:bg-white/10 text-foreground/70">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <p className="text-base text-foreground/70">Member since {memberSince}</p>
          <div className="flex gap-6 pt-2 border-t w-full justify-center border-border">
            {[
              { label: 'XP', value: balance, className: 'text-xp' },
              { label: 'Level', value: level, className: 'text-accent-violet-light' },
              { label: 'Done', value: totalCompleted, className: 'text-accent-cyan' },
              { label: 'Badges', value: unlockedBadges.length, className: 'text-success' },
              { label: 'Streak', value: streak, className: 'text-streak' },
            ].map(({ label, value, className }) => (
              <div key={label} className="text-center">
                <div className={`text-lg font-bold ${className}`}>{value}</div>
                <div className="text-xs text-foreground/70">{label}</div>
              </div>
            ))}
          </div>
          <div className="w-full">
            <div className="flex justify-end text-xs mb-1 text-foreground/70">
              <span>{xpInLevel}/100 XP</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden bg-surface-4">
              <motion.div initial={{ width: 0 }} animate={{ width: `${xpInLevel}%` }} transition={{ duration: 1 }}
                className="h-full rounded-full bg-gradient-primary" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Achievements */}
      <motion.div {...fadeUp(0.1)} className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <SectionHeader title="Achievements" icon={<Trophy className="w-4 h-4 text-xp" />} />
          <button onClick={() => setLocation('/badges')} className="text-xs flex items-center gap-1 min-h-[44px] px-3 py-1.5 rounded-xl cursor-pointer hover:opacity-80 transition-opacity duration-200 text-accent-violet-light focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            View All <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        {unlockedBadges.length > 0 ? (
          <div className="grid grid-cols-3 gap-4">
            {unlockedBadges.slice(0, 6).map((badge, i) => {
              const { achievement } = badge;
              // Tier ring colors
              const tierRing: Record<string, string> = {
                bronze: 'text-orange-700', silver: 'text-gray-400', gold: 'text-yellow-400', platinum: 'text-gray-300', diamond: 'text-cyan-300'
              };
              const ringClass = tierRing[achievement.tier] || achievement.color || 'text-primary';
              const ringBg = { bronze: '#cd7f32', silver: '#c0c0c0', gold: '#ffd700', platinum: '#e5e4e2', diamond: '#b9f2ff' }[achievement.tier] || achievement.color || '#7c3aed';
              // Resolve lucide icon
              const iconName = (achievement.icon || 'star').split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
              const IconComp = (LucideIcons as any)[iconName] || Trophy;
              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.06, type: 'spring', stiffness: 200 }}
                  className="flex flex-col items-center gap-2 cursor-pointer group transition-opacity duration-200"
                  title={achievement.description}
                  onClick={() => setLocation('/badges')}
                >
                  {/* Medal circle — Apple Watch style */}
                  <div className="relative" style={{ width: 72, height: 72 }}>
                    {/* Outer glow ring */}
                    <div className="absolute inset-0 rounded-full opacity-30 blur-sm group-hover:opacity-60 transition-opacity"
                      style={{ background: ringBg }} />
                    {/* Tier ring */}
                    <svg width={72} height={72} className="absolute inset-0 -rotate-90">
                      <circle cx={36} cy={36} r={32} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={4} />
                      <circle cx={36} cy={36} r={32} fill="none" stroke={ringBg} strokeWidth={4}
                        strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 32}`} strokeDashoffset={0} />
                    </svg>
                    {/* Inner medal face */}
                     <div className={`absolute rounded-full flex items-center justify-center bg-gradient-to-br ${achievement.gradient || 'from-primary to-primary'}`}
                      style={{ inset: 6 }}>
                      <IconComp className="text-white drop-shadow w-7 h-7" />
                    </div>
                    {/* Tier badge dot */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-2 border-surface-1 flex items-center justify-center text-xs font-black shadow"
                      style={{ background: ringBg, color: achievement.tier === 'silver' || achievement.tier === 'platinum' ? '#333' : '#fff' }}>
                      {achievement.tier[0].toUpperCase()}
                    </div>
                  </div>
                  {/* Name */}
                  <span className="text-xs font-semibold text-center leading-tight line-clamp-2 w-full text-foreground">
                    {achievement.name}
                  </span>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <p className="text-base text-center py-4 text-foreground/70">Complete challenges to earn badges</p>
        )}
      </motion.div>

      {/* Learning Preferences */}
      <motion.div {...fadeUp(0.2)} className="glass-card rounded-2xl p-6">
        <SectionHeader title="Learning Preferences" icon={<Settings className="w-4 h-4 text-accent-cyan" />} />
        <div className="space-y-1">
          <SettingRow icon={<Shuffle className="w-4 h-4 text-accent-violet-light" />} label="Shuffle Questions" description="Randomize question order">
            <Toggle on={preferences.shuffleQuestions !== false} onToggle={toggleShuffleQuestions} />
          </SettingRow>
          <SettingRow icon={<Eye className="w-4 h-4 text-accent-cyan" />} label="Prioritize New" description="Show unvisited questions first">
            <Toggle on={preferences.prioritizeUnvisited !== false} onToggle={togglePrioritizeUnvisited} />
          </SettingRow>
          <SettingRow icon={<Volume2 className="w-4 h-4 text-accent-violet-light" />} label="Auto-play Audio" description="Automatically read questions">
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
      <motion.div {...fadeUp(0.25)} className="glass-card rounded-2xl p-6">
        <SectionHeader title="Learning Summary" icon={<BookOpen className="w-4 h-4 text-accent-cyan" />} />
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Target, label: 'Topics Studied', value: learningSummary.topicsStudied, color: 'text-accent-violet-light', bg: 'bg-surface-3' },
            { icon: GraduationCap, label: 'Certs Practiced', value: learningSummary.certsPracticed, color: 'text-xp', bg: 'bg-amber-500/10' },
            { icon: Code2, label: 'Coding Done', value: learningSummary.codingDone, color: 'text-accent-cyan', bg: 'bg-cyan-500/10' },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className={`rounded-xl p-4 text-center ${bg} border border-border`}>
              <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
              <div className="text-2xl font-black">{value}</div>
              <div className="text-xs mt-0.5 text-foreground/70">{label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Data Export */}
      <motion.div {...fadeUp(0.28)} className="glass-card rounded-2xl p-6">
        <SectionHeader title="Data" icon={<Download className="w-4 h-4 text-accent-cyan" />} />
        <button onClick={exportData} className="w-full flex items-center justify-between px-4 py-3 min-h-[44px] rounded-xl cursor-pointer transition-opacity duration-200 hover:opacity-80 bg-cyan-500/10 border border-cyan-500/25 text-accent-cyan focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <span className="text-base font-medium">Export my data</span>
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
  const { unlocked: unlockedBadges } = useAchievements();
  const [hoveredCell, setHoveredCell] = useState<{ date: string; count: number; x: number; y: number } | null>(null);

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
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">

      {/* 4 stat chips */}
      {[
        { icon: Target,    label: 'Questions',  value: totalCompleted, sub: `+${todayCount}`, color: 'text-cyan-500', bg: 'bg-cyan-500/10'  },
        { icon: BarChart2, label: 'Mastered',   value: topicsMastered, sub: undefined,        color: 'text-primary', bg: 'bg-surface-3' },
        { icon: Trophy,    label: 'Certs',      value: certCount,      sub: undefined,        color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { icon: Mic,       label: 'Voice',      value: voiceSessions,  sub: undefined,        color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
      ].map(({ icon: Icon, label, value, sub, color, bg }, i) => (
        <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
          className={`rounded-2xl p-3 flex flex-col gap-0.5 ${bg} border border-border`}>
          <Icon className={`${color} w-3.5 h-3.5`} />
          <div className="text-lg font-black leading-none mt-1">{value}</div>
          <div className="text-xs text-foreground/70">{label}</div>
          {sub && <div className={`text-xs font-semibold ${color}`}>{sub}</div>}
        </motion.div>
      ))}

      {/* Heatmap — full width */}
       <motion.div {...fadeUp(0.2)} className="glass-card rounded-2xl p-3 col-span-2 sm:col-span-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-foreground/70">Activity</span>
          <span className="text-xs text-foreground/70">52 weeks</span>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[520px]">
            <div className="relative h-3.5 mb-0.5 pl-6">
              {monthLabels.map(({ label, col }) => (
                <span key={`${label}-${col}`} className="text-xs absolute text-foreground/70" style={{ left: `${24 + col * 9}px` }}>{label}</span>
              ))}
            </div>
            <div className="flex gap-0.5">
              <div className="flex flex-col gap-0.5 mr-0.5">
                {DAY_LABELS.map((d, i) => (
                  <div key={d} className="text-xs w-4 text-right" style={{ color: i % 2 === 0 ? 'var(--text-tertiary)' : 'transparent', height: '8px', lineHeight: '8px' }}>{d[0]}</div>
                ))}
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: 53 }, (_, col) => (
                  <div key={col} className="flex flex-col gap-0.5">
                    {Array.from({ length: 7 }, (_, row) => {
                      const cell = heatmapCells.find(c => c.col === col && c.row === row);
                      if (!cell) return <div key={row} style={{ width: 8, height: 8 }} />;
                      return <div key={row} className={`rounded-[1px] cursor-pointer hover:scale-125 transition-transform ${HEATMAP_LEVELS[activityLevel(cell.count)]}`}
                        style={{ width: 8, height: 8 }}
                        onMouseEnter={e => { const r = (e.target as HTMLElement).getBoundingClientRect(); setHoveredCell({ date: cell.date, count: cell.count, x: r.left, y: r.top }); }}
                        onMouseLeave={() => setHoveredCell(null)} />;
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {hoveredCell && (
          <div className="fixed z-50 pointer-events-none" style={{ left: hoveredCell.x + 12, top: hoveredCell.y - 28 }}>
            <HeatmapTooltip date={hoveredCell.date} count={hoveredCell.count} />
          </div>
        )}
      </motion.div>

      {/* Weekly bar widget */}
       <motion.div {...fadeUp(0.25)} className="glass-card rounded-2xl p-3 col-span-1 sm:col-span-2 shadow-sm">
        <div className="text-xs font-semibold mb-2 text-foreground/70">This Week</div>
        <ResponsiveContainer width="100%" height={90}>
          <BarChart data={weeklyData} barSize={12} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
            <XAxis dataKey="day" tick={{ fill: 'var(--text-tertiary)', fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip contentStyle={{ background: 'var(--surface-4)', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: 10 }} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="count" radius={[3,3,0,0]} fill="url(#bG)" />
            <defs><linearGradient id="bG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7c3aed"/><stop offset="100%" stopColor="#06b6d4"/></linearGradient></defs>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Topic distribution widget */}
       <motion.div {...fadeUp(0.28)} className="glass-card rounded-2xl p-3 col-span-1 sm:col-span-2 shadow-sm">
        <div className="text-xs font-semibold mb-2 text-foreground/70">Topics</div>
        {topicData.length > 0 ? (() => {
          const total = topicData.reduce((s, d) => s + d.value, 0);
          return (
            <div className="space-y-1.5">
              {topicData.slice(0, 5).map((d, i) => {
                const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="truncate max-w-[65%] text-foreground/70">{d.name}</span>
                      <span style={{ color: d.color }}>{pct}%</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden bg-surface-3">
                      <motion.div className="h-full rounded-full" style={{ background: d.color }}
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5, delay: i * 0.04 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })() : <div className="text-xs text-center py-4 text-foreground/70">No data yet</div>}
      </motion.div>

      {/* 30-day line — spans full width */}
       <motion.div {...fadeUp(0.32)} className="glass-card rounded-2xl p-3 col-span-2 sm:col-span-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-foreground/70">30-day trend</span>
        </div>
        <ResponsiveContainer width="100%" height={80}>
          <LineChart data={dailyData} margin={{ top: 2, right: 2, left: -28, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: 'var(--text-tertiary)', fontSize: 9 }} axisLine={false} tickLine={false} interval={9} />
            <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 9 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: 'var(--surface-4)', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: 10 }} cursor={{ stroke: '#7c3aed', strokeWidth: 1 }} />
            <Line type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={1.5} dot={false} activeDot={{ r: 2, fill: '#7c3aed' }} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Recent sessions widget */}
       <motion.div {...fadeUp(0.36)} className="glass-card rounded-2xl p-3 col-span-1 sm:col-span-2 shadow-sm">
        <div className="text-xs font-semibold mb-2 text-foreground/70">Recent Sessions</div>
        {recentSessions.length > 0 ? (
          <div className="space-y-1">
            {recentSessions.slice(0, 4).map(s => {
              const cfg = { swipe: { label: 'Swipe', color: 'text-primary' }, voice: { label: 'Voice', color: 'text-emerald-500' }, test: { label: 'Test', color: 'text-amber-500' } }[s.mode];
              return (
                <div key={s.date} className="flex items-center justify-between text-xs">
                  <span className="text-foreground/70">{formatDate(s.date)}</span>
                  <span className={`font-semibold ${cfg?.color}`}>{cfg?.label}</span>
                  <span className="font-bold">{s.count}q</span>
                </div>
              );
            })}
          </div>
        ) : <div className="text-xs text-center py-2 text-foreground/70">No sessions yet</div>}
      </motion.div>

      {/* Calendar widget */}
       <motion.div {...fadeUp(0.38)} className="glass-card rounded-2xl p-3 col-span-1 sm:col-span-2 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-foreground/70">{calendarMonth}</span>
          <span className="text-xs font-bold text-streak">{streak}d 🔥</span>
        </div>
        <div className="grid grid-cols-7 gap-0.5 mb-0.5">
          {['S','M','T','W','T','F','S'].map((d, i) => (
            <div key={i} className="text-center text-xs text-foreground/70">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay() }, (_, i) => <div key={`e-${i}`} />)}
          {calendarDays.map(({ day, active, isToday }) => (
            <div key={day} className={`flex items-center justify-center rounded text-xs font-medium ${isToday ? 'ring-2 ring-primary' : ''} ${active ? 'bg-primary text-white' : isToday ? 'bg-primary/10 text-primary' : 'bg-surface-2 text-foreground/70'}`}
              style={{ aspectRatio: '1' }}>
              {day}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Channel progress — full width */}
       <motion.div {...fadeUp(0.42)} className="glass-card rounded-2xl p-3 col-span-2 sm:col-span-4 shadow-sm">
        <div className="text-xs font-semibold mb-2 text-foreground/70">Channel Progress</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {moduleProgress.slice(0, 8).map((mod, i) => (
            <motion.button key={mod.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.44 + i * 0.03 }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => setLocation(`/channel/${mod.id}`)}
              className="p-3 min-h-[56px] rounded-2xl text-left cursor-pointer bg-surface-2 border border-border focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium truncate max-w-[75%]">{mod.name}</span>
                <span className={`text-xs font-bold flex-shrink-0 ${mod.pct === 100 ? 'text-amber-500' : 'text-foreground/70'}`}>
                  {mod.pct === 100 ? '✓' : `${mod.pct}%`}
                </span>
              </div>
              <div className="h-0.5 rounded-full overflow-hidden bg-surface-4">
                <motion.div initial={{ width: 0 }} animate={{ width: `${mod.pct}%` }} transition={{ duration: 0.6, delay: 0.5 + i * 0.04 }}
                  className={`h-full rounded-full ${mod.pct === 100 ? 'bg-amber-500' : 'bg-primary'}`} />
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { stats } = useGlobalStats();

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
      <SEOHead title="Profile & Stats" description="Your profile, settings and learning statistics" canonical="https://open-interview.github.io/profile" />
      <AppLayout fullWidth>
        <div className="min-h-screen bg-background text-foreground">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-24">
            <PageHeader title="Profile & Stats" subtitle="Your settings, achievements and learning progress" />
            <ProfileTab streak={streak} totalCompleted={totalCompleted} />
            <div className="mt-12">
              <StatsTab streak={streak} totalCompleted={totalCompleted} />
            </div>
          </div>
        </div>
      </AppLayout>
    </>
  );
}
