import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Minimize2, Code2, Server, Shield, Cloud, Database, Brain, Cpu, Hash, Network, ChevronDown } from 'lucide-react';
import type { Question } from '@/types';
import Balancer from 'react-wrap-balancer';
import { MermaidDiagram } from '@/components/MermaidDiagram';
import { EngagementBar } from './EngagementBar';
import { StickyGradingBar } from '@/components/feed/StickyGradingBar';

interface FeedCardProps {
  question: Question;
  index: number;
  onRate?: (rating: 'again' | 'hard' | 'good' | 'easy') => void;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner:     'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  intermediate: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  advanced:     'text-rose-400 bg-rose-500/10 border-rose-500/20',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced',
};

const CATEGORY_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  'system-design':    { icon: Network,   color: '#60a5fa' },
  'algorithms':       { icon: Cpu,       color: '#a78bfa' },
  'frontend':         { icon: Code2,     color: '#facc15' },
  'backend':          { icon: Server,    color: '#34d399' },
  'database':         { icon: Database,  color: '#60a5fa' },
  'devops':           { icon: Cloud,     color: '#fb923c' },
  'kubernetes':       { icon: Cloud,     color: '#38bdf8' },
  'cka':              { icon: Cloud,     color: '#38bdf8' },
  'ckad':             { icon: Cloud,     color: '#38bdf8' },
  'aws':              { icon: Cloud,     color: '#f97316' },
  'security':         { icon: Shield,    color: '#f87171' },
  'machine-learning': { icon: Brain,     color: '#c084fc' },
  'generative-ai':    { icon: Brain,     color: '#818cf8' },
};

function getCategoryIcon(channel: string): { icon: React.ElementType; color: string } {
  const lower = channel.toLowerCase();
  for (const [key, val] of Object.entries(CATEGORY_ICONS)) {
    if (lower.includes(key)) return val;
  }
  return { icon: Hash, color: '#71767b' };
}

function formatChannelName(channel: string) {
  return channel.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function CodeExpandModal({ code, onClose }: { code: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black/85 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        className="relative w-full max-w-3xl max-h-[80vh] rounded-2xl bg-[#1e1e1e] border border-[var(--tw-border)] shadow-2xl overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#2d2d2d] border-b border-[var(--tw-border)]">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-cyan-400" />
            <span className="text-[13px] text-[#71767b] font-mono">diagram</span>
          </div>
          <button onClick={onClose} className="w-11 h-11 flex items-center justify-center rounded-xl text-[#71767b] hover:text-[#e7e9ea] hover:bg-white/10 transition-all">
            <Minimize2 className="w-[18px] h-[18px]" />
          </button>
        </div>
        <pre className="p-5 overflow-auto max-h-[calc(80vh-53px)] text-[14px] leading-relaxed"><code className="text-[#9ca3af] font-mono">{code}</code></pre>
      </motion.div>
    </motion.div>
  );
}

const springItem = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 25 } },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

export const FeedCard = memo(function FeedCard({ question, index, onRate }: FeedCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [codeExpanded, setCodeExpanded] = useState(false);
  const CatIcon = getCategoryIcon(question.channel);
  const difficulty = question.difficulty ?? 'beginner';

  const handleRate = useCallback((rating: 'again' | 'hard' | 'good' | 'easy') => {
    onRate?.(rating);
  }, [onRate]);

  // Deduplicate: don't show explanation if it's identical to the answer
  const showExplanation = question.explanation && question.explanation.trim() !== question.answer?.trim();

  return (
    <div
      id={`feed-card-${question.id}`}
      className="w-full border-b border-[var(--tw-border)]"
    >
      <div className="px-4 pt-4 pb-3">

        {/* Card header: icon + meta */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${CatIcon.color}18` }}
          >
            <CatIcon.icon className="w-[18px] h-[18px]" strokeWidth={1.5} style={{ color: CatIcon.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[13px] font-semibold text-[#e7e9ea]">{formatChannelName(question.channel)}</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${DIFFICULTY_COLORS[difficulty] ?? DIFFICULTY_COLORS.beginner}`}
              >
                {DIFFICULTY_LABELS[difficulty] ?? difficulty}
              </span>
            </div>
            {question.tags && question.tags.length > 0 && (
              <div className="flex gap-1.5 mt-1 flex-wrap">
                {question.tags.slice(0, 4).map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] text-[#71767b] bg-[#16181c] border border-[var(--tw-border)]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Question title */}
        <h3 className="text-[22px] sm:text-[26px] font-bold text-[#e7e9ea] leading-snug mb-4">
          <Balancer>{question.question}</Balancer>
        </h3>

        {/* Pre-reveal: diagram hint badge */}
        {!revealed && question.diagram && (
          <div className="mb-3 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#16181c] border border-[var(--tw-border)]">
            <div className="w-6 h-6 rounded-md bg-cyan-500/15 flex items-center justify-center shrink-0">
              <Network className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <span className="text-[13px] text-[#71767b]">Architecture diagram included</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#71767b]/50 ml-auto" />
          </div>
        )}

        {/* Reveal button */}
        {!revealed && (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setRevealed(true)}
            className="w-full py-4 rounded-2xl border border-dashed border-[#2f3336] hover:border-[#536471] bg-[#16181c]/50 hover:bg-[#1d1f23] transition-all cursor-pointer group"
          >
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-[15px] font-medium text-[#e7e9ea] group-hover:text-white transition-colors">Tap to reveal answer</span>
              <span className="text-[12px] text-[#71767b]">Test yourself first — recall scores build memory</span>
            </div>
          </motion.button>
        )}

        {/* Revealed content */}
        <AnimatePresence>
          {revealed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.18 }}
            >
              <motion.div variants={containerVariants} initial="hidden" animate="visible">

                {/* Diagram (full rendered) */}
                {question.diagram && (
                  <motion.div variants={springItem} className="mb-4">
                    <div className="rounded-xl bg-[#1e1e1e] overflow-hidden border border-[var(--tw-border)]">
                      <div className="flex items-center justify-between px-3 py-2 bg-[#2d2d2d] border-b border-[var(--tw-border)]">
                        <div className="flex items-center gap-1.5">
                          <Network className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="text-[12px] text-[#71767b] font-medium">diagram</span>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => setCodeExpanded(true)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#71767b] hover:text-[#e7e9ea] hover:bg-white/10 transition-all"
                        >
                          <Maximize2 className="w-[14px] h-[14px]" strokeWidth={1.5} />
                        </motion.button>
                      </div>
                      <div className="p-3">
                        <MermaidDiagram chart={question.diagram} className="w-full" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Answer text */}
                <motion.div variants={springItem} className="text-[15px] text-[#c9d1d9] leading-relaxed mb-4">
                  {question.answer}
                </motion.div>

                {/* Explanation (only if different from answer) */}
                {showExplanation && (
                  <motion.div
                    variants={springItem}
                    className="text-[14px] text-[#8b949e] leading-relaxed mb-4 border-l-2 border-[#2f3336] pl-4"
                  >
                    {question.explanation}
                  </motion.div>
                )}

                {/* Self-grade */}
                {onRate && (
                  <motion.div variants={springItem}>
                    <StickyGradingBar questionId={question.id} show={revealed} onRate={handleRate} />
                  </motion.div>
                )}

                {/* Engagement bar */}
                <motion.div variants={springItem}>
                  <EngagementBar questionId={question.id} tags={question.tags || []} />
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {codeExpanded && <CodeExpandModal code={question.diagram || question.answer} onClose={() => setCodeExpanded(false)} />}
      </AnimatePresence>
    </div>
  );
});
