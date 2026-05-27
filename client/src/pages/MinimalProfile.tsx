import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { StreakRing } from '@/components/swipe/StreakRing';
import { MasteryGrid } from '@/components/swipe/MasteryGrid';
import { StatRow } from '@/components/swipe/StatRow';
import { FeynmanJournal } from '@/components/swipe/FeynmanJournal';
import { CustomCardList } from '@/components/swipe/CustomCardList';
import { getSRSStats, getUserXP, getAllCards } from '@/lib/spaced-repetition';
import { migrateSRSStores } from '@/lib/srs-migration';
import { useIsMobile } from '@/hooks/use-mobile';
import type { FeynmanAttempt, CustomCardData } from '@/types/swipe';
import { getEnrolledChannels, getEnrolledCerts, getEnrollment } from '@/lib/enrollment-service'
import ChannelPicker from '@/components/channels/ChannelPicker'
import type { ReviewCard, SRSStats } from '@/lib/spaced-repetition';

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

export default function MinimalProfile() {
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();

  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<ProfileSettings>(DEFAULT_SETTINGS);
  const [feynmanAttempts, setFeynmanAttempts] = useState<FeynmanAttempt[]>([]);
  const [customCards, setCustomCards] = useState<CustomCardData[]>([]);
  const [srsStats, setSrsStats] = useState<SRSStats | null>(null);
  const [xp, setXp] = useState<ReturnType<typeof getUserXP> | null>(null);
  const [allCards, setAllCards] = useState<Map<string, ReviewCard>>(new Map());
  const [showChannelPicker, setShowChannelPicker] = useState(false)

  useEffect(() => {
    migrateSRSStores();

    try {
      const stored = localStorage.getItem('oi-profile-settings');
      if (stored) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
    } catch {}
    try {
      const stored = localStorage.getItem('oi-feynman-attempts');
      if (stored) setFeynmanAttempts(JSON.parse(stored));
    } catch {}
    try {
      const stored = localStorage.getItem('oi-custom-cards');
      if (stored) setCustomCards(JSON.parse(stored));
    } catch {}

    const stats = getSRSStats();
    const xpData = getUserXP();
    const cards = getAllCards();

    const prev = getLongestStreak();
    if (stats.reviewStreak > prev) {
      localStorage.setItem('oi-longest-streak', String(stats.reviewStreak));
    }

    setSrsStats(stats);
    setXp(xpData);
    setAllCards(cards);
    setLoading(false);
  }, []);

  const updateSettings = useCallback((patch: Partial<ProfileSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      localStorage.setItem('oi-profile-settings', JSON.stringify(next));
      return next;
    });
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
      .map(([channel, { levels }]) => ({
        channel,
        pct: Math.round((levels.reduce((a, b) => a + b, 0) / Math.max(levels.length * 5, 1)) * 100),
        cards: levels.length,
      }))
      .sort((a, b) => b.pct - a.pct);
  }, [allCards]);

  const totalReviewed = useMemo(
    () => Array.from(allCards.values()).reduce((s, c) => s + c.totalReviews, 0),
    [allCards],
  );

  const mastered = useMemo(
    () => Array.from(allCards.values()).filter(c => c.masteryLevel >= 4).length,
    [allCards],
  );

  const longestStreak = useMemo(() => {
    const current = srsStats?.reviewStreak ?? 0;
    return Math.max(current, getLongestStreak());
  }, [srsStats]);

  const handleExportAll = useCallback(() => {
    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      cards: Object.fromEntries(allCards),
      fcCards: JSON.parse(localStorage.getItem('code-reels-fc-srs') || '{}'),
      stats: JSON.parse(localStorage.getItem('code-reels-srs-stats') || '{}'),
      feynmanAttempts,
      customCards,
      settings,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'oi-full-backup.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }, [allCards, feynmanAttempts, customCards, settings]);

  const handleChannelPickerClose = () => {
    setShowChannelPicker(false)
    setSrsStats(getSRSStats())
  }

  const handleImportAll = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.cards) localStorage.setItem('code-reels-srs', JSON.stringify(data.cards));
        if (data.fcCards) localStorage.setItem('code-reels-fc-srs', JSON.stringify(data.fcCards));
        if (data.stats) localStorage.setItem('code-reels-srs-stats', JSON.stringify(data.stats));
        if (data.feynmanAttempts) {
          localStorage.setItem('oi-feynman-attempts', JSON.stringify(data.feynmanAttempts));
          setFeynmanAttempts(data.feynmanAttempts);
        }
        if (data.customCards) {
          localStorage.setItem('oi-custom-cards', JSON.stringify(data.customCards));
          setCustomCards(data.customCards);
        }
        if (data.settings) {
          localStorage.setItem('oi-profile-settings', JSON.stringify(data.settings));
          setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
        }
        setSrsStats(getSRSStats());
        setXp(getUserXP());
        setAllCards(getAllCards());
      } catch (err) {
        console.error('Import failed', err);
      }
    };
    input.click();
  }, []);

  if (loading || !srsStats || !xp) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a', color: '#fff' }}>
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-y-auto" style={{ background: '#0a0a0a', color: '#fff' }}>
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3" style={{ background: '#0a0a0a' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocation('/')}
            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Profile</h1>
        </div>
        <button
          onClick={() => setLocation('/study')}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-white/10 hover:bg-white/15 transition-colors cursor-pointer"
        >
          Go to Study
        </button>
      </div>

      <div className={isMobile ? 'px-4 pb-24 space-y-6' : 'max-w-4xl mx-auto px-6 pb-24 space-y-6'}>
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Progress
          </h2>
          <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <StreakRing streak={srsStats.reviewStreak} xp={xp.totalXP} level={xp.level} xpProgress={xp.progress} />
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Mastery
          </h2>
          <MasteryGrid masteryData={masteryByChannel.map(m => ({ channel: m.channel, percentage: m.pct, cards: m.cards }))} />
        </section>

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Stats
          </h2>
          <StatRow
            totalReviewed={totalReviewed}
            mastered={mastered}
            feynmanAttempts={feynmanAttempts.length}
            customCards={customCards.length}
            longestStreak={longestStreak}
          />
        </section>

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
            My Topics
          </h2>
          <div className="p-4 rounded-2xl space-y-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Enrolled Channels</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{getEnrolledChannels().length} channels</p>
              </div>
              <div>
                <p className="text-sm font-medium">Enrolled Certs</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{getEnrolledCerts().length} certifications</p>
              </div>
            </div>
            <button
              onClick={() => setShowChannelPicker(true)}
              className="w-full px-4 py-2 rounded-lg text-sm bg-white/10 hover:bg-white/15 transition-colors cursor-pointer"
            >
              Manage Topics
            </button>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
            My Feynman Journal
          </h2>
          <FeynmanJournal
            attempts={feynmanAttempts.slice(0, 10)}
            onClear={() => { localStorage.removeItem('oi-feynman-attempts'); setFeynmanAttempts([]); }}
          />
        </section>

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
            My Cards
          </h2>
          <CustomCardList
            cards={customCards}
            onEdit={(card) => console.log('Edit card', card)}
            onDelete={(id) => {
              const updated = customCards.filter(c => c.id !== id);
              setCustomCards(updated);
              localStorage.setItem('oi-custom-cards', JSON.stringify(updated));
            }}
            onExport={() => {
              const blob = new Blob([JSON.stringify(customCards, null, 2)], { type: 'application/json' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = 'oi-custom-cards.json';
              a.click();
            }}
            onImport={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.json';
              input.onchange = async (e: Event) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (!file) return;
                try {
                  const text = await file.text();
                  const data = JSON.parse(text) as CustomCardData[];
                  setCustomCards(data);
                  localStorage.setItem('oi-custom-cards', JSON.stringify(data));
                } catch {}
              };
              input.click();
            }}
          />
        </section>

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Data Management
          </h2>
          <div className="flex gap-3 p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <button
              onClick={handleExportAll}
              className="px-4 py-2 rounded-lg text-sm bg-white/10 hover:bg-white/15 transition-colors cursor-pointer"
            >
              Export All Data
            </button>
            <button
              onClick={handleImportAll}
              className="px-4 py-2 rounded-lg text-sm bg-white/10 hover:bg-white/15 transition-colors cursor-pointer"
            >
              Import Data
            </button>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Settings
          </h2>
          <div className="space-y-3 p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="flex items-center justify-between">
              <label htmlFor="dailyGoal" className="text-sm">Daily goal</label>
              <select
                id="dailyGoal"
                value={settings.dailyGoal}
                onChange={e => updateSettings({ dailyGoal: Number(e.target.value) })}
                className="px-3 py-1.5 rounded-lg text-sm cursor-pointer outline-none"
                style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {[5, 10, 15, 20, 25].map(n => (
                  <option key={n} value={n} style={{ background: '#1a1a1a' }}>{n} cards/day</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="defaultMode" className="text-sm">Default mode</label>
              <select
                id="defaultMode"
                value={settings.defaultMode}
                onChange={e => updateSettings({ defaultMode: e.target.value })}
                className="px-3 py-1.5 rounded-lg text-sm cursor-pointer outline-none"
                style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {['recall', 'standard', 'feynman', 'palace'].map(m => (
                  <option key={m} value={m} style={{ background: '#1a1a1a' }}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="fontSize" className="text-sm">Font size</label>
              <select
                id="fontSize"
                value={settings.fontSize}
                onChange={e => updateSettings({ fontSize: e.target.value })}
                className="px-3 py-1.5 rounded-lg text-sm cursor-pointer outline-none"
                style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {['S', 'M', 'L'].map(s => (
                  <option key={s} value={s} style={{ background: '#1a1a1a' }}>
                    {s === 'S' ? 'Small' : s === 'M' ? 'Medium' : 'Large'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {showChannelPicker && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Manage Topics
            </h2>
            <ChannelPicker onClose={handleChannelPickerClose} />
          </section>
        )}
      </div>
    </div>
  );
}
