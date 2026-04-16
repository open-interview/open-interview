/**
 * Profile Page — Settings & Preferences
 */

import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { AppLayout } from '../components/layout/AppLayout';
import { SEOHead } from '../components/SEOHead';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { useCredits } from '../context/CreditsContext';
import { useAchievements } from '../hooks/use-achievements';
import { useGlobalStats } from '../hooks/use-progress';
import { getAllQuestions, channels, getQuestions } from '../lib/data';
import {
  User, Settings, Zap, Trophy, Target, Sparkles,
  Volume2, Shuffle, Eye, ChevronRight, Edit2, Check, X, Download, BookOpen, Code2, GraduationCap, Flame, Calendar
} from 'lucide-react';

// ── helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={on}
      className="w-12 h-6 rounded-full transition-all flex-shrink-0 relative"
      style={{ background: on ? 'var(--gradient-primary)' : 'var(--surface-4)' }}
    >
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
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--surface-3)' }}>
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

// ── main component ────────────────────────────────────────────────────────────

export default function ProfilePage() {
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
      const d = new Date();
      d.setDate(d.getDate() - i);
      if (stats.find(x => x.date === d.toISOString().split('T')[0])) s++;
      else break;
    }
    return s;
  }, [stats]);

  const memberSince = useMemo(() => {
    try {
      const stored = localStorage.getItem('user-preferences');
      if (stored) {
        const prefs = JSON.parse(stored);
        if (prefs.createdAt) return new Date(prefs.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
    } catch { /* ignore */ }
    return 'Recently';
  }, []);

  useEffect(() => {
    const allQuestions = getAllQuestions();
    const allCompletedIds = new Set<string>();
    allQuestions.forEach(q => {
      const stored = localStorage.getItem(`progress-${q.channel}`);
      if (stored) {
        const ids = new Set(JSON.parse(stored));
        if (ids.has(q.id)) allCompletedIds.add(q.id);
      }
    });
    setTotalCompleted(allCompletedIds.size);
  }, []);

  const learningSummary = (() => {
    const certKeywords = ['aws','kubernetes','terraform','gcp','azure','comptia','cisco','cka','ckad','cks'];
    const codeKeywords = ['algorithm','coding','frontend','backend'];
    let topicsStudied = 0, certsPracticed = 0, codingDone = 0;
    channels.forEach(ch => {
      const stored = localStorage.getItem(`progress-${ch.id}`);
      if (!stored) return;
      const completed = JSON.parse(stored) as string[];
      if (completed.length === 0) return;
      topicsStudied++;
      const id = ch.id.toLowerCase();
      if (certKeywords.some(k => id.includes(k))) certsPracticed++;
      if (codeKeywords.some(k => id.includes(k))) codingDone += completed.length;
    });
    return { topicsStudied, certsPracticed, codingDone };
  })();

  const exportData = () => {
    const data: Record<string, unknown> = { exportedAt: new Date().toISOString(), xp: balance, level, totalCompleted };
    Object.keys(localStorage).forEach(k => { data[k] = localStorage.getItem(k); });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'code-reels-data.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const level = Math.floor(balance / 100);
  const xpInLevel = balance % 100;
  const initials = getInitials(displayName);

  const saveName = () => {
    const trimmed = nameInput.trim() || 'Learner';
    setDisplayName(trimmed);
    localStorage.setItem('user-display-name', trimmed);
    setEditingName(false);
  };

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.35 },
  });

  return (
    <>
      <SEOHead
        title="Profile - Your Settings"
        description="Customize your learning experience"
        canonical="https://open-interview.github.io/profile"
      />
      <AppLayout>
        <div className="min-h-screen pb-24 lg:pb-8 bg-background text-foreground">
          <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

            {/* ── Page Header ─────────────────────────────────────────────── */}
            <div className="px-4 py-6">
              <h1 className="text-2xl font-bold">Profile</h1>
            </div>

            {/* ── Profile Card ───────────────────────────────────────────── */}
            <motion.div {...fadeUp(0)} className="glass-card rounded-[var(--radius-2xl)] p-6">
              <div className="flex flex-col items-center gap-4">
                {/* Avatar with gradient border */}
                <div className="p-0.5 rounded-full" style={{ background: 'var(--gradient-primary)' }}>
                  <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                    style={{ background: 'var(--surface-2)' }}>
                    {initials}
                  </div>
                </div>

                {/* Name (editable) */}
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={nameInput}
                      onChange={e => setNameInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
                      className="text-center text-xl font-bold bg-transparent border-b-2 outline-none px-2"
                      style={{ borderColor: 'var(--color-accent-violet)', color: 'var(--text-primary)' }}
                    />
                    <button onClick={saveName} className="p-1 rounded-full hover:bg-green-500/20 text-green-400"><Check className="w-4 h-4" /></button>
                    <button onClick={() => setEditingName(false)} className="p-1 rounded-full hover:bg-red-500/20 text-red-400"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold">{displayName}</h1>
                    <button onClick={() => { setNameInput(displayName); setEditingName(true); }}
                      className="p-1 rounded-full transition-colors hover:bg-white/10"
                      style={{ color: 'var(--text-tertiary)' }}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Software Engineer</p>

                {/* Stats summary row */}
                <div className="flex gap-6 pt-2 border-t w-full justify-center" style={{ borderColor: 'var(--color-border)' }}>
                  {[
                    { label: 'XP', value: balance, color: 'var(--color-xp)' },
                    { label: 'Level', value: level, color: 'var(--color-accent-violet-light)' },
                    { label: 'Done', value: totalCompleted, color: 'var(--color-accent-cyan)' },
                    { label: 'Badges', value: unlockedBadges.length, color: 'var(--color-success)' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="text-center">
                      <div className="text-lg font-bold" style={{ color }}>{value}</div>
                      <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* Level bar */}
                <div className="w-full">
                  <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>
                    <span>Level {level}</span><span>{xpInLevel}/100 XP</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-4)' }}>
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${xpInLevel}%` }}
                      transition={{ duration: 1 }}
                      className="h-full rounded-full"
                      style={{ background: 'var(--gradient-primary)' }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ── Achievement Showcase ────────────────────────────────────── */}
            <motion.div {...fadeUp(0.1)} className="glass-card rounded-[var(--radius-2xl)] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold flex items-center gap-2">
                  <Trophy className="w-4 h-4" style={{ color: 'var(--color-xp)' }} />
                  Achievements
                </h2>
                <button onClick={() => setLocation('/badges')}
                  className="text-xs flex items-center gap-1 transition-colors hover:opacity-80"
                  style={{ color: 'var(--color-accent-violet-light)' }}>
                  View All <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {unlockedBadges.length > 0 ? (
                <div className="grid grid-cols-6 gap-3">
                  {unlockedBadges.slice(0, 6).map((badge, i) => (
                    <motion.div key={badge.achievement.id}
                      initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.15 + i * 0.05 }}
                      title={badge.achievement.name}
                      className="aspect-square rounded-xl flex items-center justify-center text-xs font-bold cursor-pointer transition-transform hover:scale-110"
                      style={{ background: badge.achievement.gradient || 'var(--surface-3)', border: '1px solid var(--color-border)', color: '#fff' }}>
                      <Trophy className="w-5 h-5" />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-center py-4" style={{ color: 'var(--text-tertiary)' }}>
                  Complete challenges to earn badges
                </p>
              )}
            </motion.div>

            {/* ── Learning Preferences ────────────────────────────────────── */}
            <motion.div {...fadeUp(0.2)} className="glass-card rounded-[var(--radius-2xl)] p-6">
              <h2 className="font-bold mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4" style={{ color: 'var(--color-accent-cyan)' }} />
                Learning Preferences
              </h2>
              <div className="space-y-1">
                <SettingRow
                  icon={<Shuffle className="w-4 h-4" style={{ color: 'var(--color-accent-violet-light)' }} />}
                  label="Shuffle Questions"
                  description="Randomize question order">
                  <Toggle on={preferences.shuffleQuestions !== false} onToggle={toggleShuffleQuestions} />
                </SettingRow>
                <SettingRow
                  icon={<Eye className="w-4 h-4" style={{ color: 'var(--color-accent-cyan)' }} />}
                  label="Prioritize New"
                  description="Show unvisited questions first">
                  <Toggle on={preferences.prioritizeUnvisited !== false} onToggle={togglePrioritizeUnvisited} />
                </SettingRow>
                <SettingRow
                  icon={<Volume2 className="w-4 h-4" style={{ color: 'var(--color-accent-violet-light)' }} />}
                  label="Auto-play Audio"
                  description="Automatically read questions">
                  <Toggle
                    on={!!((preferences as unknown as Record<string, unknown>)['autoPlayTTS'])}
                    onToggle={() => {
                      const stored = localStorage.getItem('user-preferences');
                      try {
                        const p = stored ? JSON.parse(stored) : {};
                        p.autoPlayTTS = !p.autoPlayTTS;
                        localStorage.setItem('user-preferences', JSON.stringify(p));
                        window.location.reload();
                      } catch { /* ignore */ }
                    }}
                  />
                </SettingRow>
              </div>
            </motion.div>

            {/* ── Learning Summary ────────────────────────────────────────── */}
            <motion.div {...fadeUp(0.25)} className="glass-card rounded-[var(--radius-2xl)] p-6">
              <h2 className="font-bold mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4" style={{ color: 'var(--color-accent-cyan)' }} />
                Learning Summary
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Target, label: 'Topics Studied', value: learningSummary.topicsStudied, color: 'var(--color-accent-violet-light)', bg: 'rgba(124,58,237,0.1)' },
                  { icon: GraduationCap, label: 'Certs Practiced', value: learningSummary.certsPracticed, color: 'var(--color-xp)', bg: 'rgba(245,158,11,0.1)' },
                  { icon: Code2, label: 'Coding Done', value: learningSummary.codingDone, color: 'var(--color-accent-cyan)', bg: 'rgba(6,182,212,0.1)' },
                ].map(({ icon: Icon, label, value, color, bg }) => (
                  <div key={label} className="rounded-[var(--radius-xl)] p-4 text-center"
                    style={{ background: bg, border: `1px solid ${bg.replace('0.1', '0.25')}` }}>
                    <Icon className="w-5 h-5 mx-auto mb-1" style={{ color }} />
                    <div className="text-2xl font-black">{value}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ── Data Export ─────────────────────────────────────────────── */}
            <motion.div {...fadeUp(0.28)} className="glass-card rounded-[var(--radius-2xl)] p-6">
              <h2 className="font-bold mb-3 flex items-center gap-2">
                <Download className="w-4 h-4" style={{ color: 'var(--color-accent-cyan)' }} />
                Data
              </h2>
              <button onClick={exportData}
                className="w-full flex items-center justify-between px-4 py-3 rounded-[var(--radius-lg)] transition-colors hover:opacity-80"
                style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', color: 'var(--color-accent-cyan)' }}>
                <span className="text-sm font-medium">Export my data</span>
                <Download className="w-4 h-4" />
              </button>
            </motion.div>

            {/* ── Quick Actions ───────────────────────────────────────────── */}
            <motion.div {...fadeUp(0.3)} className="grid grid-cols-2 gap-4">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => setLocation('/stats')}
                className="p-5 rounded-[var(--radius-xl)] text-left transition-colors"
                style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)' }}>
                <Sparkles className="w-6 h-6 mb-2" style={{ color: 'var(--color-accent-violet-light)' }} />
                <div className="font-semibold text-sm">Statistics</div>
                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>View your progress</div>
              </motion.button>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => setLocation('/badges')}
                className="p-5 rounded-[var(--radius-xl)] text-left transition-colors"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
                <Trophy className="w-6 h-6 mb-2" style={{ color: 'var(--color-xp)' }} />
                <div className="font-semibold text-sm">Achievements</div>
                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>View your badges</div>
              </motion.button>
            </motion.div>

          </div>
        </div>
      </AppLayout>
    </>
  );
}
