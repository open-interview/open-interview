import React from 'react'
import { ArrowLeft, Menu, Zap, User } from 'lucide-react'
import { useCredits } from '@/context/RewardContext'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

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
  const isMobile = useIsMobile()
  const { balance, formatCredits } = useCredits()

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 h-12 bg-background/80 backdrop-blur-xl border-b border-border',
        isMobile ? 'px-4' : 'px-6',
      )}
    >
      <div className="flex items-center h-full gap-3">
        {showBack && (
          <button
            aria-label="Go back"
            onClick={onBack}
            className="w-9 h-9 -ml-1 rounded-xl hover:bg-accent flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
        {title && (
          <h1 className="text-base font-semibold truncate flex-1 lg:flex-none">
            {title}
          </h1>
        )}
        <div className="flex-1 lg:flex-none" />
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" aria-hidden="true" />
            <span className="text-xs font-bold text-amber-500">{formatCredits(balance)}</span>
          </div>
          {!isMobile && (
            <Avatar className="w-8 h-8">
              <AvatarFallback>
                <User className="w-4 h-4" aria-hidden="true" />
              </AvatarFallback>
            </Avatar>
          )}
          {isMobile && (
            <button
              aria-label="Toggle menu"
              onClick={onMenuToggle}
              className="w-9 h-9 rounded-xl hover:bg-accent flex items-center justify-center"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </header>
  )
})
