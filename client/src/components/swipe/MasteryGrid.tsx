import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MasteryGridProps {
  masteryData: Array<{ channel: string; percentage: number; cards: number }>;
}

const CHANNEL_COLORS: Record<string, string> = {
  algorithms: 'from-cyan-500 to-blue-500',
  backend: 'from-emerald-500 to-teal-500',
  frontend: 'from-rose-500 to-pink-500',
  'system-design': 'from-violet-500 to-purple-500',
  devops: 'from-orange-500 to-amber-500',
  database: 'from-sky-500 to-blue-500',
  behavioral: 'from-indigo-500 to-violet-500',
  'generative-ai': 'from-fuchsia-500 to-purple-500',
};

function getChannelGradient(channel: string): string {
  return CHANNEL_COLORS[channel.toLowerCase()] || 'from-violet-500 to-indigo-500';
}

export const MasteryGrid = React.memo(function MasteryGrid({ masteryData }: MasteryGridProps) {
  return (
    <div data-pagefind-ignore>
      {masteryData.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No data yet — start studying!</p>
      ) : (
        <div className="max-h-52 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
          <AnimatePresence initial={false} mode="popLayout">
            <TooltipProvider>
              {masteryData.map((item, index) => (
                <motion.div
                  key={item.channel}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: index * 0.04 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-sm text-foreground capitalize shrink-0 w-28 truncate font-medium">
                    {item.channel}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex-1 h-2 rounded-full bg-[var(--border-subtle)] overflow-hidden cursor-help">
                        <motion.div
                          className={`h-full rounded-full bg-gradient-to-r ${getChannelGradient(item.channel)}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${item.percentage}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut', delay: index * 0.04 }}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <p>{item.channel}: {item.percentage}% — {item.cards} cards</p>
                    </TooltipContent>
                  </Tooltip>
                  <span className="text-xs text-muted-foreground font-mono shrink-0 w-8 text-right font-medium">
                    {item.percentage}%
                  </span>
                </motion.div>
              ))}
            </TooltipProvider>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
});
