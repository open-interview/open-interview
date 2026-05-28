import React from 'react'
import { motion } from 'framer-motion'
import {
  Trophy,
  Clock,
  CheckCircle,
  Zap,
  Flame,
  BarChart3,
  Home,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

export interface SessionSummaryProps {
  cardsReviewed: number
  correctCount: number
  againCount: number
  hardCount: number
  timeStarted: Date
  timeEnded: Date | null
  streak: number
  onStudyMore: () => void
  onBack: () => void
}

function formatTimeDiff(start: Date, end: Date): string {
  const diffMs = end.getTime() - start.getTime()
  const totalSeconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes === 0) return `${seconds}s`
  return `${minutes}m ${seconds}s`
}

const SessionSummary = React.memo(function SessionSummary({
  cardsReviewed,
  correctCount,
  againCount,
  hardCount,
  timeStarted,
  timeEnded,
  streak,
  onStudyMore,
  onBack,
}: SessionSummaryProps) {
  const prefersReducedMotion = useReducedMotion()

  const containerVariants = {
    hidden: prefersReducedMotion ? {} : { opacity: 0 },
    visible: {
      opacity: 1,
      transition: prefersReducedMotion ? { duration: 0 } : {
        duration: 0.4,
        staggerChildren: 0.08,
      },
    },
  }

  const itemVariants = {
    hidden: prefersReducedMotion ? {} : { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: prefersReducedMotion ? { duration: 0 } : { duration: 0.35, ease: 'easeOut' as const },
    },
  }

  const accuracy = cardsReviewed > 0 ? Math.round((correctCount / cardsReviewed) * 100) : 0

  const xpEarned = correctCount * 15 + againCount * 5 + hardCount * 10
  const xpPerLevel = 100
  const xpInCurrentLevel = xpEarned % xpPerLevel
  const xpProgress = (xpInCurrentLevel / xpPerLevel) * 100
  const currentLevel = Math.floor(xpEarned / xpPerLevel) + 1

  const stats = [
    { label: 'Cards reviewed', value: cardsReviewed, icon: BarChart3, color: 'text-violet-400' },
    { label: 'Time spent', value: timeEnded ? formatTimeDiff(timeStarted, timeEnded) : '—', icon: Clock, color: 'text-cyan-400' },
    { label: 'Accuracy', value: `${accuracy}%`, icon: CheckCircle, color: 'text-emerald-400' },
    { label: 'XP earned', value: xpEarned, icon: Zap, color: 'text-amber-400' },
    { label: 'Streak', value: `${streak} day${streak !== 1 ? 's' : ''}`, icon: Flame, color: 'text-rose-400' },
  ]

  return (
    <div className="flex items-center justify-center min-h-[500px] p-4">
      <motion.div
        className="w-full max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="flex justify-center mb-6" variants={itemVariants}>
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500/25 to-amber-600/25 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Trophy className="w-10 h-10 text-amber-400" aria-hidden={true} />
            </div>
            <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-amber-500/10 to-amber-600/5 blur-lg -z-10" />
          </div>
        </motion.div>

        <motion.h1 className="text-3xl font-bold text-center mb-8 gradient-text" variants={itemVariants}>
          Session Complete!
        </motion.h1>

        <motion.div className="grid grid-cols-2 gap-3 mb-6" variants={itemVariants}>
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="glass-card p-4 text-center rounded-xl border border-border/30">
                <Icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} aria-hidden={true} />
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            )
          })}
        </motion.div>

        <motion.div className="glass-card p-5 mb-6 rounded-xl border border-border/30" variants={itemVariants}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Level {currentLevel}</span>
            <span className="text-xs font-semibold text-amber-400">{xpEarned} XP</span>
          </div>
          <Progress value={xpProgress} className="h-2 bg-[var(--border-subtle)] [&>div]:bg-gradient-to-r [&>div]:from-amber-500 [&>div]:to-amber-400" />
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {xpInCurrentLevel} / {xpPerLevel} XP to next level
          </p>
        </motion.div>

        <motion.div className="flex gap-3" variants={itemVariants}>
          <Button onClick={onStudyMore} className="flex-1 gap-2 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white border-0 shadow-lg shadow-violet-500/20">
            <BookOpen className="w-4 h-4" aria-hidden={true} />
            Study More
          </Button>
          <Button onClick={onBack} variant="outline" className="flex-1 gap-2 border-border/40 hover:bg-accent/50">
            <Home className="w-4 h-4" aria-hidden={true} />
            Go Home
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
})

export default SessionSummary
