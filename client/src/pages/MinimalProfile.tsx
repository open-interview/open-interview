import { useState, useMemo, useCallback } from 'react';
import { Layout } from '@/ui/Layout';
import { StreakRing } from '@/components/swipe/StreakRing';
import { FeynmanJournal } from '@/components/swipe/FeynmanJournal';
import { CustomCardList } from '@/components/swipe/CustomCardList';
import { getSRSStats, getUserXP, getAllCards } from '@/lib/spaced-repetition';
import { migrateSRSStores } from '@/lib/srs-migration';
import { useIsMobile } from '@/hooks/use-mobile';
import type { FeynmanAttempt, CustomCardData } from '@/types/swipe';
import { getEnrolledChannels, getEnrolledCerts } from '@/lib/enrollment-service'
import ChannelPicker from '@/components/channels/ChannelPicker'
import ProfileSettingsPanel from '@/components/profile/ProfileSettingsPanel'
import type { ReviewCard, SRSStats } from '@/lib/spaced-repetition';
import { BookOpen, Award, Brain, FileEdit, Flame, Layers, Settings, Download, Upload, Target, TrendingUp, CheckCircle, Calendar } from 'lucide-react';

interface ProfileSettings {
  dailyGoal: number;
  defaultMode: string;
  fontSize: string;
}

const DEFAULT_SETTINGS: ProfileSettings = {
  dailyGoal: 10,
  defaultMode: 'recall',
  fontSize: 'M',
};

function getLongestStreak(): number {
  try {
    const stored = localStorage.getItem('oi-longest-streak');
    if (stored) return Math.max(Number(stored), 0);
  } catch {}
  return 0;
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500/15 to-indigo-500/15 flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-violet-400" aria-hidden={true} />
      </div>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      <div className="flex-1 h-px bg-gradient-to-r from-border/50 to-transparent ml-2" />
    </div>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ScoreCard({ icon: Icon, label, value, sub, color, sparklineData }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string; sparklineData?: number[];
}) {
  return (
    <div className="flex flex-col gap-2 p-4 rounded-2xl border border-border/20 bg-[var(--surface-elevated)]/80">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        {sparklineData && <Sparkline data={sparklineData} color={color} />}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tracking-tight text-foreground">{value}</span>
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </div>
    </div>
  );
}

function ChannelHeatmap({ masteryByChannel }: { masteryByChannel: Array<{ channel: string; pct: number; cards: number }> }) {
  const [view, setView] = useState<'mastery' | 'cards'>('mastery');

  const maxCards = Math.max(...masteryByChannel.map((c) => c.cards), 1);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setView('mastery')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${view === 'mastery' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-muted-foreground border border-border/20 hover:bg-accent/30'}`}
        >
          Mastery
        </button>
        <button
          onClick={() => setView('cards')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${view === 'cards' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-muted-foreground border border-border/20 hover:bg-accent/30'}`}
        >
          Cards
        </button>
      </div>
      <div className="space-y-1">
        {masteryByChannel.slice(0, 12).map((m) => {
          const intensity = view === 'mastery' ? m.pct / 100 : Math.min(m.cards / maxCards, 1);
          const hue = view === 'mastery' ? 260 - intensity * 60 : 190 - intensity * 60;
          return (
            <div key={m.channel} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground truncate w-24 shrink-0">{m.channel}</span>
              <div className="flex-1 h-5 rounded-md transition-all" style={{ backgroundColor: `hsl(${hue}, 60%, ${20 + intensity * 25}%)`, width: `${Math.max(intensity * 100, 2)}%` }} />
              <span className="text-[10px] text-muted-foreground/60 w-8 text-right">{view === 'mastery' ? `${m.pct}%` : m.cards}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MinimalProfile() {
  const isMobile = useIsMobile();

  const [settings, setSettings] = useState<ProfileSettings>(() => {
    try { const stored = localStorage.getItem('oi-profile-settings'); return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS; } catch { return DEFAULT_SETTINGS; }
  });
  const [feynmanAttempts, setFeynmanAttempts] = useState<FeynmanAttempt[]>(() => {
    try { const stored = localStorage.getItem('oi-feynman-attempts'); return stored ? JSON.parse(stored) : []; } catch { return []; }
  });
  const [customCards, setCustomCards] = useState<CustomCardData[]>(() => {
    try { const stored = localStorage.getItem('oi-custom-cards'); return stored ? JSON.parse(stored) : []; } catch { return []; }
  });
  const [showChannelPicker, setShowChannelPicker] = useState(false)

  const [srsStats, setSrsStats] = useState<SRSStats>(() => {
    migrateSRSStores();
    const stats = getSRSStats();
    const prev = getLongestStreak();
    if (stats.reviewStreak > prev) localStorage.setItem('oi-longest-streak', String(stats.reviewStreak));
    return stats;
  });
  const [xp, setXp] = useState(() => getUserXP());
  const [allCards, setAllCards] = useState<Map<string, ReviewCard>>(() => getAllCards());

  const updateSettings = useCallback((patch: Partial<ProfileSettings>) => {
    setSettings(prev => { const next = { ...prev, ...patch }; localStorage.setItem('oi-profile-settings', JSON.stringify(next)); return next; });
  }, []);

  const masteryByChannel = useMemo(() => {
    const cards = Array.from(allCards.values());
    const groups = cards.reduce<Map<string, { levels: number[] }>>((acc, card) => {
      const ch = card.channel || 'unknown';
      if (!acc.has(ch)) acc.set(ch, { levels: [] });
      acc.get(ch)!.levels.push(card.masteryLevel);
      return acc;
    }, new Map());
    return Array.from(groups.entries())
      .map(([channel, { levels }]) => ({ channel, pct: Math.round((levels.reduce((a, b) => a + b, 0) / Math.max(levels.length * 5, 1)) * 100), cards: levels.length }))
      .sort((a, b) => b.pct - a.pct);
  }, [allCards]);

  const totalReviewed = useMemo(() => Array.from(allCards.values()).reduce((s, c) => s + c.totalReviews, 0), [allCards]);
  const mastered = useMemo(() => Array.from(allCards.values()).filter(c => c.masteryLevel >= 4).length, [allCards]);
  const longestStreak = useMemo(() => Math.max(srsStats?.reviewStreak ?? 0, getLongestStreak()), [srsStats]);

  const handleExportAll = useCallback(() => {
    const exportData = { version: 1, exportedAt: new Date().toISOString(), cards: Object.fromEntries(allCards), fcCards: JSON.parse(localStorage.getItem('code-reels-fc-srs') || '{}'), stats: JSON.parse(localStorage.getItem('code-reels-srs-stats') || '{}'), feynmanAttempts, customCards, settings };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'oi-full-backup.json'; a.click(); URL.revokeObjectURL(a.href);
  }, [allCards, feynmanAttempts, customCards, settings]);

  const handleChannelPickerClose = () => { setShowChannelPicker(false); setSrsStats(getSRSStats()) }

  const handleImportAll = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text(); const data = JSON.parse(text);
        if (data.cards) localStorage.setItem('code-reels-srs', JSON.stringify(data.cards));
        if (data.fcCards) localStorage.setItem('code-reels-fc-srs', JSON.stringify(data.fcCards));
        if (data.stats) localStorage.setItem('code-reels-srs-stats', JSON.stringify(data.stats));
        if (data.feynmanAttempts) { localStorage.setItem('oi-feynman-attempts', JSON.stringify(data.feynmanAttempts)); setFeynmanAttempts(data.feynmanAttempts); }
        if (data.customCards) { localStorage.setItem('oi-custom-cards', JSON.stringify(data.customCards)); setCustomCards(data.customCards); }
        if (data.settings) { localStorage.setItem('oi-profile-settings', JSON.stringify(data.settings)); setSettings({ ...DEFAULT_SETTINGS, ...data.settings }); }
        setSrsStats(getSRSStats()); setXp(getUserXP()); setAllCards(getAllCards());
      } catch (err) { console.error('Import failed', err); }
    };
    input.click();
  }, []);

  const handleOpenManageTopics = useCallback(() => setShowChannelPicker(true), [])
  const handleClearFeynman = useCallback(() => { localStorage.removeItem('oi-feynman-attempts'); setFeynmanAttempts([]); }, [])
  const handleEditCard = useCallback((card: CustomCardData) => { console.log('Edit card', card) }, [])
  const handleDeleteCard = useCallback((id: string) => { const updated = customCards.filter(c => c.id !== id); setCustomCards(updated); localStorage.setItem('oi-custom-cards', JSON.stringify(updated)); }, [customCards])
  const handleExportCards = useCallback(() => { const blob = new Blob([JSON.stringify(customCards, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'oi-custom-cards.json'; a.click(); }, [customCards])
  const handleImportCards = useCallback(() => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return;
      try { const text = await file.text(); const data = JSON.parse(text) as CustomCardData[]; setCustomCards(data); localStorage.setItem('oi-custom-cards', JSON.stringify(data)); } catch {}
    };
    input.click();
  }, [])

  return (
    <Layout title="Analytics" showBack>
      <div className={isMobile ? 'px-4 pb-28 space-y-6 pt-2' : 'max-w-4xl mx-auto px-6 pb-24 space-y-6 pt-4'}>
        {/* Scorecard Row */}
        <section>
          <SectionHeader icon={TrendingUp} title="Overview" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ScoreCard icon={Award} label="Level" value={xp.level} sub={`${xp.totalXP} XP`} color="#a78bfa" sparklineData={[1,2,3,5,8,13,21]} />
            <ScoreCard icon={Flame} label="Streak" value={srsStats.reviewStreak} sub="days" color="#f59e0b" sparklineData={[0,0,1,2,2,3,srsStats.reviewStreak]} />
            <ScoreCard icon={CheckCircle} label="Mastered" value={mastered} sub="cards" color="#10b981" sparklineData={[0,1,2,4,5,7,mastered]} />
            <ScoreCard icon={Target} label="Reviewed" value={totalReviewed} sub="total" color="#06b6d4" />
          </div>
        </section>

        {/* Streak Ring + Progress */}
        <section>
          <SectionHeader icon={Award} title="Progress" />
          <div className="glass-card rounded-xl border border-border/30">
            <StreakRing streak={srsStats.reviewStreak} xp={xp.totalXP} level={xp.level} xpProgress={xp.progress} />
          </div>
        </section>

        {/* Category Heatmap */}
        <section>
          <SectionHeader icon={Layers} title="Category Breakdown" />
          <div className="p-5 rounded-2xl border border-border/20 bg-[var(--surface-elevated)]/80">
            <ChannelHeatmap masteryByChannel={masteryByChannel} />
          </div>
        </section>

        {/* Topics Section */}
        <section>
          <SectionHeader icon={BookOpen} title="My Topics" />
          <div className="p-5 rounded-2xl border border-border/20 bg-[var(--surface-elevated)]/80">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-6">
                <div>
                  <p className="text-lg font-bold text-foreground">{getEnrolledChannels().length}</p>
                  <p className="text-xs text-muted-foreground">channels</p>
                </div>
                <div className="w-px bg-border/30" />
                <div>
                  <p className="text-lg font-bold text-foreground">{getEnrolledCerts().length}</p>
                  <p className="text-xs text-muted-foreground">certifications</p>
                </div>
              </div>
            </div>
            <button onClick={handleOpenManageTopics} className="w-full px-4 py-2.5 rounded-lg text-sm bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/20 text-violet-300 hover:from-violet-500/20 hover:to-indigo-500/20 transition-all duration-200 font-medium">
              Manage Topics
            </button>
          </div>
        </section>

        {/* Feynman Journal */}
        <section>
          <SectionHeader icon={Brain} title="Feynman Journal" />
          <FeynmanJournal attempts={feynmanAttempts.slice(0, 10)} onClear={handleClearFeynman} />
        </section>

        {/* Custom Cards */}
        <section>
          <SectionHeader icon={FileEdit} title="My Cards" />
          <CustomCardList cards={customCards} onEdit={handleEditCard} onDelete={handleDeleteCard} onExport={handleExportCards} onImport={handleImportCards} />
        </section>

        {/* Data Management */}
        <section>
          <SectionHeader icon={Settings} title="Data Management" />
          <div className="flex gap-3 p-4 rounded-2xl border border-border/20 bg-[var(--surface-elevated)]/80">
            <button onClick={handleExportAll} className="flex items-center gap-2 flex-1 px-4 py-2.5 rounded-lg text-sm border border-border/30 text-muted-foreground hover:text-foreground hover:border-border/50 hover:bg-accent/30 transition-all duration-200">
              <Download className="w-4 h-4" aria-hidden={true} />
              Export
            </button>
            <button onClick={handleImportAll} className="flex items-center gap-2 flex-1 px-4 py-2.5 rounded-lg text-sm border border-border/30 text-muted-foreground hover:text-foreground hover:border-border/50 hover:bg-accent/30 transition-all duration-200">
              <Upload className="w-4 h-4" aria-hidden={true} />
              Import
            </button>
          </div>
        </section>

        <ProfileSettingsPanel settings={settings} onUpdate={updateSettings} />

        {showChannelPicker && (
          <section>
            <SectionHeader icon={BookOpen} title="Manage Topics" />
            <ChannelPicker onClose={handleChannelPickerClose} />
          </section>
        )}
      </div>
    </Layout>
  );
}
