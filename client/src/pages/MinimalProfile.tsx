import { useState, useMemo, useCallback } from 'react';
import { Layout } from '@/ui/Layout';
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
import ProfileSettingsPanel from '@/components/profile/ProfileSettingsPanel'
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
  const isMobile = useIsMobile();

  const [settings, setSettings] = useState<ProfileSettings>(() => {
    try {
      const stored = localStorage.getItem('oi-profile-settings');
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  const [feynmanAttempts, setFeynmanAttempts] = useState<FeynmanAttempt[]>(() => {
    try {
      const stored = localStorage.getItem('oi-feynman-attempts');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [customCards, setCustomCards] = useState<CustomCardData[]>(() => {
    try {
      const stored = localStorage.getItem('oi-custom-cards');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [showChannelPicker, setShowChannelPicker] = useState(false)

  const [srsStats, setSrsStats] = useState<SRSStats>(() => {
    migrateSRSStores();
    const stats = getSRSStats();
    const prev = getLongestStreak();
    if (stats.reviewStreak > prev) {
      localStorage.setItem('oi-longest-streak', String(stats.reviewStreak));
    }
    return stats;
  });
  const [xp, setXp] = useState(() => getUserXP());
  const [allCards, setAllCards] = useState<Map<string, ReviewCard>>(() => getAllCards());

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

  const handleOpenManageTopics = useCallback(() => setShowChannelPicker(true), [])
  const handleClearFeynman = useCallback(() => {
    localStorage.removeItem('oi-feynman-attempts');
    setFeynmanAttempts([]);
  }, [])
  const handleEditCard = useCallback((card: CustomCardData) => {
    console.log('Edit card', card)
  }, [])
  const handleDeleteCard = useCallback((id: string) => {
    const updated = customCards.filter(c => c.id !== id);
    setCustomCards(updated);
    localStorage.setItem('oi-custom-cards', JSON.stringify(updated));
  }, [customCards])
  const handleExportCards = useCallback(() => {
    const blob = new Blob([JSON.stringify(customCards, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'oi-custom-cards.json';
    a.click();
  }, [customCards])
  const handleImportCards = useCallback(() => {
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
  }, [])

  return (
    <Layout title="Profile" showBack>
      <div className={isMobile ? 'px-4 pb-24 space-y-6' : 'max-w-4xl mx-auto px-6 pb-24 space-y-6'}>
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Progress
          </h2>
          <div className="glass-card p-4">
            <StreakRing streak={srsStats.reviewStreak} xp={xp.totalXP} level={xp.level} xpProgress={xp.progress} />
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Mastery
          </h2>
          <MasteryGrid masteryData={masteryByChannel.map(m => ({ channel: m.channel, percentage: m.pct, cards: m.cards }))} />
        </section>

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
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
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            My Topics
          </h2>
          <div className="p-4 rounded-2xl space-y-3 bg-muted">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Enrolled Channels</p>
                <p className="text-xs text-muted-foreground">{getEnrolledChannels().length} channels</p>
              </div>
              <div>
                <p className="text-sm font-medium">Enrolled Certs</p>
                <p className="text-xs text-muted-foreground">{getEnrolledCerts().length} certifications</p>
              </div>
            </div>
            <button
            onClick={handleOpenManageTopics}
            className="w-full px-4 py-2 rounded-lg text-sm bg-muted hover:bg-accent transition-colors cursor-pointer"
            >
              Manage Topics
            </button>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            My Feynman Journal
          </h2>
          <FeynmanJournal
            attempts={feynmanAttempts.slice(0, 10)}
            onClear={handleClearFeynman}
          />
        </section>

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            My Cards
          </h2>
          <CustomCardList
            cards={customCards}
            onEdit={handleEditCard}
            onDelete={handleDeleteCard}
            onExport={handleExportCards}
            onImport={handleImportCards}
          />
        </section>

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Data Management
          </h2>
          <div className="flex gap-3 p-4 rounded-2xl bg-muted">
            <button
              onClick={handleExportAll}
              className="px-4 py-2 rounded-lg text-sm bg-muted hover:bg-accent transition-colors cursor-pointer"
            >
              Export All Data
            </button>
            <button
              onClick={handleImportAll}
              className="px-4 py-2 rounded-lg text-sm bg-muted hover:bg-accent transition-colors cursor-pointer"
            >
              Import Data
            </button>
          </div>
        </section>

        <ProfileSettingsPanel settings={settings} onUpdate={updateSettings} />

        {showChannelPicker && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Manage Topics
            </h2>
            <ChannelPicker onClose={handleChannelPickerClose} />
          </section>
        )}
      </div>
    </Layout>
  );
}
