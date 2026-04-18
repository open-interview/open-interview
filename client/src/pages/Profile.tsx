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
    <div className="flex rounded-full overflow-hidden border" style={{ borderColor: 'var(--color-border)', background: 'var(--surface-3)' }}>
      {(['On', 'Off'] as const).map((label) => {
        const active = label === 'On' ? on : !on;
        return (
          <button
            key={label}
            onClick={() => { if (label === 'On' ? !on : on) onToggle(); }}
            className="px-4 py-2 min-h-[44px] text-xs font-semibold transition-all duration-200 cursor-pointer"
            style={{
              background: active ? 'var(--gradient-primary)' : 'transparent',
              color: active ? '#fff' : 'var(--text-tertiary)',
            }}
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
    <div className="flex items-center justify-between py-3 px-4 min-h-[44px] rounded-[var(--radius-md)] transition-colors duration-200 hover:bg-[var(--surface-3)]">
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
            <div className="flex justify-end text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>
              <span>{xpInLevel}/100 XP</span>
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
          <button onClick={() => setLocation('/badges')} className="text-xs flex items-center gap-1 min-h-[44px] px-2 cursor-pointer hover:opacity-80 transition-opacity duration-200" style={{ color: 'var(--color-accent-violet-light)' }}>
            View All <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        {unlockedBadges.length > 0 ? (
          <div className="grid grid-cols-3 gap-4">
            {unlockedBadges.slice(0, 6).map((badge, i) => {
              const { achievement } = badge;
              // Tier ring colors
              const tierRing: Record<string, string> = {
                bronze: '#cd7f32', silver: '#c0c0c0', gold: '#ffd700', platinum: '#e5e4e2', diamond: '#b9f2ff'
              };
              const ringColor = tierRing[achievement.tier] || achievement.color || '#7c3aed';
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
                      style={{ background: ringColor }} />
                    {/* Tier ring */}
                    <svg width={72} height={72} className="absolute inset-0 -rotate-90">
                      <circle cx={36} cy={36} r={32} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={4} />
                      <circle cx={36} cy={36} r={32} fill="none" stroke={ringColor} strokeWidth={4}
                        strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 32}`} strokeDashoffset={0} />
                    </svg>
                    {/* Inner medal face */}
                    <div className={`absolute rounded-full flex items-center justify-center bg-gradient-to-br ${achievement.gradient || 'from-violet-500 to-purple-700'} shadow-lg`}
                      style={{ inset: 6 }}>
                      <IconComp className="text-white drop-shadow" style={{ width: 28, height: 28 }} />
                    </div>
                    {/* Tier badge dot */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[8px] font-black shadow"
                      style={{ background: ringColor, borderColor: 'var(--surface-1)', color: achievement.tier === 'silver' || achievement.tier === 'platinum' ? '#333' : '#fff' }}>
                      {achievement.tier[0].toUpperCase()}
                    </div>
                  </div>
                  {/* Name */}
                  <span className="text-[10px] font-semibold text-center leading-tight line-clamp-2 w-full"
                    style={{ color: 'var(--text-primary)' }}>
                    {achievement.name}
                  </span>
                </motion.div>
              );
            })}
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
        <button onClick={exportData} className="w-full flex items-center justify-between px-4 py-3 min-h-[44px] rounded-[var(--radius-lg)] cursor-pointer transition-opacity duration-200 hover:opacity-80"
          style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', color: 'var(--color-accent-cyan)' }}>
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
        { icon: Target,    label: 'Questions',  value: totalCompleted, sub: `+${todayCount}`, color: '#06b6d4', bg: 'rgba(6,182,212,0.08)'  },
        { icon: BarChart2, label: 'Mastered',   value: topicsMastered, sub: undefined,        color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
        { icon: Trophy,    label: 'Certs',      value: certCount,      sub: undefined,        color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
        { icon: Mic,       label: 'Voice',      value: voiceSessions,  sub: undefined,        color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
      ].map(({ icon: Icon, label, value, sub, color, bg }, i) => (
        <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
          className="rounded-2xl p-3 flex flex-col gap-0.5" style={{ background: bg, border: `1px solid ${color}20` }}>
          <Icon style={{ color, width: 13, height: 13 }} />
          <div className="text-lg font-black leading-none mt-1">{value}</div>
          <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{label}</div>
          {sub && <div className="text-[9px] font-semibold" style={{ color }}>{sub}</div>}
        </motion.div>
      ))}

      {/* Heatmap — full width */}
      <motion.div {...fadeUp(0.2)} className="glass-card rounded-2xl p-3 col-span-2 sm:col-span-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Activity</span>
          <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>52 weeks</span>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[520px]">
            <div className="relative h-3.5 mb-0.5 pl-6">
              {monthLabels.map(({ label, col }) => (
                <span key={`${label}-${col}`} className="text-[9px] absolute" style={{ color: 'var(--text-tertiary)', left: `${24 + col * 9}px` }}>{label}</span>
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
      <motion.div {...fadeUp(0.25)} className="glass-card rounded-2xl p-3 col-span-1 sm:col-span-2">
        <div className="text-[10px] font-semibold mb-2" style={{ color: 'var(--text-tertiary)' }}>This Week</div>
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
      <motion.div {...fadeUp(0.28)} className="glass-card rounded-2xl p-3 col-span-1 sm:col-span-2">
        <div className="text-[10px] font-semibold mb-2" style={{ color: 'var(--text-tertiary)' }}>Topics</div>
        {topicData.length > 0 ? (() => {
          const total = topicData.reduce((s, d) => s + d.value, 0);
          return (
            <div className="space-y-1.5">
              {topicData.slice(0, 5).map((d, i) => {
                const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-[9px] mb-0.5">
                      <span className="truncate max-w-[65%]" style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                      <span style={{ color: d.color }}>{pct}%</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
                      <motion.div className="h-full rounded-full" style={{ background: d.color }}
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5, delay: i * 0.04 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })() : <div className="text-[10px] text-center py-4" style={{ color: 'var(--text-tertiary)' }}>No data yet</div>}
      </motion.div>

      {/* 30-day line — spans full width */}
      <motion.div {...fadeUp(0.32)} className="glass-card rounded-2xl p-3 col-span-2 sm:col-span-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold" style={{ color: 'var(--text-tertiary)' }}>30-day trend</span>
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
      <motion.div {...fadeUp(0.36)} className="glass-card rounded-2xl p-3 col-span-1 sm:col-span-2">
        <div className="text-[10px] font-semibold mb-2" style={{ color: 'var(--text-tertiary)' }}>Recent Sessions</div>
        {recentSessions.length > 0 ? (
          <div className="space-y-1">
            {recentSessions.slice(0, 4).map(s => {
              const cfg = { swipe: { label: 'Swipe', color: '#7c3aed' }, voice: { label: 'Voice', color: '#10b981' }, test: { label: 'Test', color: '#f59e0b' } }[s.mode];
              return (
                <div key={s.date} className="flex items-center justify-between text-[10px]">
                  <span style={{ color: 'var(--text-tertiary)' }}>{formatDate(s.date)}</span>
                  <span className="font-semibold" style={{ color: cfg?.color }}>{cfg?.label}</span>
                  <span className="font-bold">{s.count}q</span>
                </div>
              );
            })}
          </div>
        ) : <div className="text-[10px] text-center py-2" style={{ color: 'var(--text-tertiary)' }}>No sessions yet</div>}
      </motion.div>

      {/* Calendar widget */}
      <motion.div {...fadeUp(0.38)} className="glass-card rounded-2xl p-3 col-span-1 sm:col-span-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold" style={{ color: 'var(--text-tertiary)' }}>{calendarMonth}</span>
          <span className="text-[10px] font-bold" style={{ color: 'var(--color-streak)' }}>{streak}d 🔥</span>
        </div>
        <div className="grid grid-cols-7 gap-0.5 mb-0.5">
          {['S','M','T','W','T','F','S'].map((d, i) => (
            <div key={i} className="text-center text-[8px]" style={{ color: 'var(--text-tertiary)' }}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay() }, (_, i) => <div key={`e-${i}`} />)}
          {calendarDays.map(({ day, active, isToday }) => (
            <div key={day} className={`flex items-center justify-center rounded text-[9px] font-medium ${isToday ? 'ring-1 ring-violet-500' : ''}`}
              style={{
                aspectRatio: '1',
                background: active ? (isToday ? '#7c3aed' : 'rgba(124,58,237,0.5)') : isToday ? 'rgba(124,58,237,0.12)' : 'var(--surface-2)',
                color: active ? '#fff' : isToday ? '#a78bfa' : 'var(--text-tertiary)',
              }}>
              {day}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Channel progress — full width */}
      <motion.div {...fadeUp(0.42)} className="glass-card rounded-2xl p-3 col-span-2 sm:col-span-4">
        <div className="text-[10px] font-semibold mb-2" style={{ color: 'var(--text-tertiary)' }}>Channel Progress</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {moduleProgress.slice(0, 8).map((mod, i) => (
            <motion.button key={mod.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.44 + i * 0.03 }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => setLocation(`/channel/${mod.id}`)}
              className="p-3 min-h-[56px] rounded-2xl text-left cursor-pointer" style={{ background: 'var(--surface-2)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-medium truncate max-w-[75%]">{mod.name}</span>
                <span className="text-[9px] font-bold flex-shrink-0" style={{ color: mod.pct === 100 ? '#f59e0b' : 'var(--text-tertiary)' }}>
                  {mod.pct === 100 ? '✓' : `${mod.pct}%`}
                </span>
              </div>
              <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-4)' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${mod.pct}%` }} transition={{ duration: 0.6, delay: 0.5 + i * 0.04 }}
                  className="h-full rounded-full" style={{ background: mod.pct === 100 ? '#f59e0b' : '#7c3aed' }} />
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
