import { RotateCcw, Brain, Check, Zap } from "lucide-react";
import { motion } from "framer-motion";

const confidenceLevels = [
  { id: "again", label: "Again", icon: <RotateCcw className="w-3 h-3" />, interval: 1 },
  { id: "hard", label: "Hard", icon: <Brain className="w-3 h-3" />, interval: 2 },
  { id: "good", label: "Good", icon: <Check className="w-3 h-3" />, interval: 4 },
  { id: "easy", label: "Easy", icon: <Zap className="w-3 h-3" />, interval: 7 },
];

const levelGradients: Record<string, string> = {
  again: "linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)",
  hard: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
  good: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  easy: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
};

interface RatingBarProps {
  onRate: (level: string) => void;
}

export function RatingBar({ onRate }: RatingBarProps) {
  return (
    <div className="space-y-2">
      <div className="text-center text-sm text-muted-foreground">
        How well did you know this?
      </div>
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {confidenceLevels.map((level) => (
          <motion.button
            key={level.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => onRate(level.id)}
            className="min-h-[44px] px-3 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all duration-150 flex items-center gap-1.5 text-white"
            style={{
              background: levelGradients[level.id],
              boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
            }}
          >
            {level.icon}
            <span className="capitalize">{level.label}</span>
            <span className="opacity-60 text-xs">+{level.interval}d</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
