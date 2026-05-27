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

const containerVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut' as const,
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' as const },
  },
}

export default function SessionSummary({
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
  const accuracy =
    cardsReviewed > 0
      ? Math.round((correctCount / cardsReviewed) * 100)
      : 0

  const xpEarned = correctCount * 15 + againCount * 5 + hardCount * 10
  const xpPerLevel = 100
  const xpInCurrentLevel = xpEarned % xpPerLevel
  const xpProgress = (xpInCurrentLevel / xpPerLevel) * 100
  const currentLevel = Math.floor(xpEarned / xpPerLevel) + 1

  const stats = [
    { label: 'Cards reviewed', value: cardsReviewed, icon: BarChart3 },
    {
      label: 'Time spent',
      value: timeEnded ? formatTimeDiff(timeStarted, timeEnded) : '—',
      icon: Clock,
    },
    { label: 'Accuracy', value: `${accuracy}%`, icon: CheckCircle },
    { label: 'XP earned', value: xpEarned, icon: Zap },
    { label: 'Streak', value: `${streak} day${streak !== 1 ? 's' : ''}`, icon: Flame },
  ]

  return (
    <div className="flex items-center justify-center min-h-[500px] p-4 bg-gray-900">
      <motion.div
        className="w-full max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="flex justify-center mb-6" variants={itemVariants}>
          <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Trophy className="w-10 h-10 text-amber-400" />
          </div>
        </motion.div>

        <motion.h1
          className="text-3xl font-bold text-white text-center mb-8"
          variants={itemVariants}
        >
          Session Complete!
        </motion.h1>

        <motion.div className="grid grid-cols-2 gap-3 mb-6" variants={itemVariants}>
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 text-center"
              >
                <Icon className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
              </div>
            )
          })}
        </motion.div>

        <motion.div
          className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 mb-6"
          variants={itemVariants}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Level {currentLevel}</span>
            <span className="text-sm text-gray-400">{xpEarned} XP</span>
          </div>
          <Progress value={xpProgress} className="h-2" />
          <p className="text-xs text-gray-500 mt-2 text-center">
            {xpInCurrentLevel} / {xpPerLevel} XP to next level
          </p>
        </motion.div>

        <motion.div className="flex gap-3" variants={itemVariants}>
          <Button onClick={onStudyMore} variant="default" className="flex-1 gap-2">
            <BookOpen className="w-4 h-4" />
            Study More
          </Button>
          <Button onClick={onBack} variant="outline" className="flex-1 gap-2">
            <Home className="w-4 h-4" />
            Go Home
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}


