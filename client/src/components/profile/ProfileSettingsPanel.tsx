import { memo } from 'react'

interface ProfileSettings {
  dailyGoal: number
  defaultMode: string
  fontSize: string
}

interface ProfileSettingsPanelProps {
  settings: ProfileSettings
  onUpdate: (patch: Partial<ProfileSettings>) => void
}

const DAILY_GOAL_OPTIONS = [5, 10, 15, 20, 25]
const MODE_OPTIONS = ['recall', 'standard', 'feynman', 'palace']
const FONT_OPTIONS = ['S', 'M', 'L'] as const

function ProfileSettingsPanel({ settings, onUpdate }: ProfileSettingsPanelProps) {
  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Settings
      </h2>
      <div className="space-y-3 p-4 rounded-2xl bg-muted">
        <div className="flex items-center justify-between">
          <label htmlFor="dailyGoal" className="text-sm">Daily goal</label>
          <select
            id="dailyGoal"
            value={settings.dailyGoal}
            onChange={e => onUpdate({ dailyGoal: Number(e.target.value) })}
            className="px-3 py-1.5 rounded-lg text-sm cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
            style={{ background: 'var(--muted)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
          >
            {DAILY_GOAL_OPTIONS.map(n => (
              <option key={n} value={n} style={{ background: 'var(--surface-base)' }}>{n} cards/day</option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-between">
          <label htmlFor="defaultMode" className="text-sm">Default mode</label>
          <select
            id="defaultMode"
            value={settings.defaultMode}
            onChange={e => onUpdate({ defaultMode: e.target.value })}
            className="px-3 py-1.5 rounded-lg text-sm cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
            style={{ background: 'var(--muted)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
          >
            {MODE_OPTIONS.map(m => (
              <option key={m} value={m} style={{ background: 'var(--surface-base)' }}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-between">
          <label htmlFor="fontSize" className="text-sm">Font size</label>
          <select
            id="fontSize"
            value={settings.fontSize}
            onChange={e => onUpdate({ fontSize: e.target.value })}
            className="px-3 py-1.5 rounded-lg text-sm cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
            style={{ background: 'var(--muted)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
          >
            {FONT_OPTIONS.map(s => (
              <option key={s} value={s} style={{ background: 'var(--surface-base)' }}>
                {s === 'S' ? 'Small' : s === 'M' ? 'Medium' : 'Large'}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  )
}

export default memo(ProfileSettingsPanel)
