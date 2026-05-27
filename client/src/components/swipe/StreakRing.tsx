import { motion } from 'framer-motion';

interface StreakRingProps {
  streak: number;
  xp: number;
  level: number;
  xpProgress: number;
}

export function StreakRing({ streak, xp, level, xpProgress }: StreakRingProps) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(streak / 100, 1);
  const strokeDashoffset = circumference * (1 - progress);
  const ringStroke = streak > 0 ? '#10b981' : '#6b7280';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col items-center mb-6"
    >
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            className="stroke-[#2a2a2a]"
            strokeWidth="8"
          />
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={ringStroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{streak}</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground mt-1">Day streak</span>

      <div className="flex items-center gap-4 mt-4 text-sm">
        <span className="text-muted-foreground">{xp} XP</span>
        <span className="text-muted-foreground">Level {level}</span>
      </div>

      <div className="w-40 h-1.5 rounded-full bg-[#2a2a2a] overflow-hidden mt-2">
        <motion.div
          className="h-full rounded-full bg-amber-500"
          initial={{ width: 0 }}
          animate={{ width: `${xpProgress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
        />
      </div>
    </motion.div>
  );
}
