import { memo, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Maximize2, Minimize2, Code2, Server, Shield, Cloud, Database, Brain, Cpu, Hash } from 'lucide-react';
import type { Question } from '@/types';
import Balancer from 'react-wrap-balancer';
import { MermaidDiagram } from '@/components/MermaidDiagram';
import { EngagementBar } from './EngagementBar';
import { PullQuote } from '@/components/feed/PullQuote';
import { StickyGradingBar } from '@/components/feed/StickyGradingBar';

interface FeedCardProps {
  question: Question;
  index: number;
  onRate?: (rating: 'again' | 'hard' | 'good' | 'easy') => void;
}

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const CATEGORY_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  'system-design': { icon: Server, color: '#60a5fa' },
  'algorithms': { icon: Cpu, color: '#a78bfa' },
  'frontend': { icon: Code2, color: '#facc15' },
  'backend': { icon: Server, color: '#34d399' },
  'database': { icon: Database, color: '#60a5fa' },
  'devops': { icon: Cloud, color: '#fb923c' },
  'kubernetes': { icon: Cloud, color: '#38bdf8' },
  'aws': { icon: Cloud, color: '#f97316' },
  'security': { icon: Shield, color: '#f87171' },
  'machine-learning': { icon: Brain, color: '#c084fc' },
  'generative-ai': { icon: Brain, color: '#818cf8' },
};

function getCategoryIcon(channel: string): { icon: React.ElementType; color: string } {
  const lower = channel.toLowerCase();
  for (const [key, val] of Object.entries(CATEGORY_ICONS)) {
    if (lower.includes(key)) return val;
  }
  return { icon: Hash, color: '#71767b' };
}

function CodeExpandModal({ code, onClose }: { code: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black/85 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="relative w-full max-w-3xl max-h-[80vh] rounded-2xl bg-[#1e1e1e] border border-[var(--tw-border)] shadow-2xl overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#2d2d2d] border-b border-[var(--tw-border)]">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span className="text-[13px] text-[#71767b] font-mono">code</span>
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
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 25 },
  },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.03 } },
};

export const FeedCard = memo(function FeedCard({ question, index, onRate }: FeedCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [codeExpanded, setCodeExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const CatIcon = getCategoryIcon(question.channel);

  const handleRate = useCallback((rating: 'again' | 'hard' | 'good' | 'easy') => {
    onRate?.(rating);
  }, [onRate]);

  const pullQuoteSource = question.explanation || question.answer;
  const pullQuoteText = pullQuoteSource ? pullQuoteSource.slice(0, 100) + '...' : '';

  return (
    <div
      ref={cardRef}
      id={`feed-card-${question.id}`}
      className="w-full border-b border-[var(--tw-border)]"
      style={{ containerType: 'inline-size', containerName: 'feed-card' }}
    >
      <style>{`
        @container feed-card (max-width: 599px) {
          .feed-diagram-float {
            float: none !important;
            width: 100% !important;
            margin-left: 0 !important;
            margin-bottom: 1rem !important;
          }
          .feed-pullquote-float {
            float: none !important;
            width: 100% !important;
            max-width: 100% !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
          }
        }
      `}</style>
      <div className="px-4 py-3">
        <div className="flex items-start gap-3 mb-1">
          <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${CatIcon.color}15` }}>
            <CatIcon.icon className="w-[18px] h-[18px]" strokeWidth={1.5} style={{ color: CatIcon.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[13px] font-bold text-[#e7e9ea]">{question.channel}</span>
              <span className="text-[13px] text-[#71767b]">&middot;</span>
              <span className="text-[13px] text-[#71767b]">{DIFFICULTY_LABELS[question.difficulty] || question.difficulty}</span>
            </div>
            {question.tags && question.tags.length > 0 && (
              <div className="flex gap-1.5 mt-0.5">
                {question.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="text-[13px] text-[#71767b]">#{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        <h3 className="text-[24px] sm:text-[28px] font-bold text-[#e7e9ea] font-serif leading-tight mb-3 mt-2">
          <Balancer>{question.question}</Balancer>
        </h3>

        {!revealed && question.diagram && (
          <div className="relative mb-3">
            <div className="max-h-[120px] overflow-hidden rounded-xl bg-[#1e1e1e]">
              <pre className="p-3 text-[12px] leading-relaxed text-[#9ca3af] font-mono">
                <code>{question.diagram.slice(0, 300)}...</code>
              </pre>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black to-transparent pointer-events-none" />
          </div>
        )}

        {!revealed && (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setRevealed(true)}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-[var(--tw-border)] bg-transparent hover:bg-[#1d1f23] transition-all cursor-pointer"
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-[15px] text-[#71767b]">Tap to reveal answer</span>
              <span className="text-[13px] text-[#71767b]">Test yourself first</span>
            </div>
          </motion.button>
        )}

        <AnimatePresence>
          {revealed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <LayoutGroup>
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {question.diagram && (
                    <motion.div
                      layout
                      variants={springItem}
                      className="float-right ml-4 mb-2 w-1/2 feed-diagram-float"
                      style={{
                        shapeOutside: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)',
                        shapeMargin: '1rem',
                      }}
                    >
                      <div className="rounded-xl bg-[#1e1e1e] overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2 bg-[#2d2d2d] border-b border-[var(--tw-border)]">
                          <span className="text-[13px] text-[#71767b]">diagram</span>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setCodeExpanded(true)}
                            className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl text-[#71767b] hover:text-[#e7e9ea] hover:bg-white/10 transition-all"
                          >
                            <Maximize2 className="w-[18px] h-[18px]" strokeWidth={1.5} />
                          </motion.button>
                        </div>
                        <div className="p-3">
                          <MermaidDiagram chart={question.diagram} className="w-full" />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <motion.div
                    variants={springItem}
                    className="text-[16px] text-[#9ca3af] leading-relaxed whitespace-pre-wrap mb-3"
                  >
                    {question.answer}
                  </motion.div>

                  {pullQuoteText && (
                    <motion.div variants={springItem}>
                      <PullQuote text={pullQuoteText} />
                    </motion.div>
                  )}

                  {question.explanation && (
                    <motion.div
                      variants={springItem}
                      className="text-[16px] text-[#9ca3af] leading-relaxed whitespace-pre-wrap mb-3"
                    >
                      {question.explanation}
                    </motion.div>
                  )}

                  {onRate && (
                    <motion.div variants={springItem}>
                      <StickyGradingBar questionId={question.id} show={revealed} onRate={handleRate} />
                    </motion.div>
                  )}

                  <motion.div variants={springItem}>
                    <EngagementBar questionId={question.id} tags={question.tags || []} />
                  </motion.div>
                </motion.div>
              </LayoutGroup>
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
