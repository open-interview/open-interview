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

export function MasteryGrid({ masteryData }: MasteryGridProps) {
  return (
    <div data-pagefind-ignore>
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        ── Mastery ────────
      </h3>
      {masteryData.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No data yet — start studying!</p>
      ) : (
        <div className="max-h-48 overflow-y-auto space-y-2.5 pr-1">
          <AnimatePresence initial={false} mode="popLayout">
            <TooltipProvider>
              {masteryData.map((item, index) => (
                <motion.div
                  key={item.channel}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-sm text-foreground capitalize shrink-0 w-28 truncate">
                    {item.channel}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex-1 h-2 rounded-full bg-[#2a2a2a] overflow-hidden cursor-help">
                        <motion.div
                          className="h-full rounded-full bg-purple-600"
                          initial={{ width: 0 }}
                          animate={{ width: `${item.percentage}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut', delay: index * 0.05 }}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <p>
                        {item.channel}: {item.percentage}% — {item.cards} cards
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  <span className="text-xs text-muted-foreground font-mono shrink-0 w-8 text-right">
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
}
