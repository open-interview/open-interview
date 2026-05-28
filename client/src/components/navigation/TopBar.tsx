import React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

interface TopBarProps {
  title?: string
  showBack?: boolean
  onBack?: () => void
  onMenuToggle?: () => void
}

export const TopBar = React.memo(function TopBar({
  title,
  showBack,
  onBack,
  onMenuToggle,
}: TopBarProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <header className="sticky top-0 z-40 h-12 bg-[var(--surface)]/80 backdrop-blur-xl border-b border-[var(--border)] flex items-center justify-between px-4">
      {title ? (
        <h1 className="text-[15px] font-semibold text-[var(--fg)] font-[var(--font-heading)]">{title}</h1>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-1.5 text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  )
})
