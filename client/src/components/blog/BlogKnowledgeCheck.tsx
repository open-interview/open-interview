import { useState } from 'react';
import { Brain, ChevronDown, ChevronUp, Check, RotateCcw, X } from 'lucide-react';
import type { BlogQuizQuestion } from '../../data/blog-quizzes';

interface BlogKnowledgeCheckProps {
  questions: BlogQuizQuestion[];
}

export function BlogKnowledgeCheck({ questions }: BlogKnowledgeCheckProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [recalled, setRecalled] = useState<Record<string, boolean>>({});
  const [skipped, setSkipped] = useState<Record<string, boolean>>({});
  const [hints, setHints] = useState<Record<string, boolean>>({});

  const recalledCount = Object.values(recalled).filter(Boolean).length;
  const skippedCount = Object.values(skipped).filter(Boolean).length;
  const answeredCount = recalledCount + skippedCount;
  const isComplete = answeredCount === questions.length && questions.length > 0;
  const scorePercent = questions.length > 0 ? Math.round((recalledCount / questions.length) * 100) : 0;

  const reset = () => {
    setAnswers({});
    setRecalled({});
    setSkipped({});
    setHints({});
  };

  return (
    <section className="mt-12 border-t border-[var(--color-border)] pt-10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <Brain className="w-5 h-5 text-[var(--color-accent)]" />
          <h2 className="text-xl font-bold text-[var(--color-ink)]">Knowledge Check</h2>
        </div>
        <div className="flex items-center gap-3">
          {/* Score pill */}
          <span className={`text-sm font-semibold px-2.5 py-0.5 rounded-full ${
            recalledCount === 0
              ? 'bg-[var(--color-surface-raised)] text-[var(--color-ink-muted)]'
              : recalledCount === questions.length
              ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
              : 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
          }`}>
            {recalledCount} / {questions.length}
          </span>
          {answeredCount > 0 && (
            <button
              onClick={reset}
              className="cursor-pointer flex items-center gap-1 text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
              aria-label="Try again"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Try Again
            </button>
          )}
        </div>
      </div>
      <p className="text-sm text-[var(--color-ink-muted)] mb-6">
        Try to answer from memory before revealing each hint. This strengthens long-term retention.
      </p>

      <div className="space-y-4">
        {questions.map((q, idx) => {
          const isRecalled = recalled[q.id];
          const isSkipped = skipped[q.id];
          const isDone = isRecalled || isSkipped;

          return (
            <div
              key={q.id}
              className={`rounded-xl border p-5 transition-all duration-200 ${
                isRecalled
                  ? 'border-green-400/50 bg-green-50 dark:bg-green-950/20'
                  : isSkipped
                  ? 'border-red-300/50 bg-red-50/50 dark:bg-red-950/10'
                  : 'border-[var(--color-border)] bg-[var(--color-surface-raised)]'
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                <span className={`shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center mt-0.5 ${
                  isRecalled
                    ? 'bg-green-500 text-white'
                    : isSkipped
                    ? 'bg-red-400 text-white'
                    : 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
                }`}>
                  {isRecalled ? <Check className="w-3.5 h-3.5" /> : isSkipped ? <X className="w-3.5 h-3.5" /> : idx + 1}
                </span>
                <p className="font-semibold text-[var(--color-ink)] text-sm leading-relaxed">{q.prompt}</p>
              </div>

              <textarea
                className={`w-full rounded-lg border text-sm p-3 resize-none focus:outline-none transition-colors placeholder:text-[var(--color-ink-muted)]/50 text-[var(--color-ink)] mb-3 ${
                  isRecalled
                    ? 'border-green-400/40 bg-green-50/50 dark:bg-green-950/10'
                    : isSkipped
                    ? 'border-red-300/40 bg-red-50/30 dark:bg-red-950/10'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] focus:border-[var(--color-accent)]'
                }`}
                rows={3}
                placeholder="Write your answer from memory..."
                value={answers[q.id] ?? ''}
                onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                disabled={isDone}
              />

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setHints(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                  className="cursor-pointer flex items-center gap-1.5 text-xs font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 transition-colors"
                >
                  {hints[q.id]
                    ? <><ChevronUp className="w-3.5 h-3.5" /> Hide hint</>
                    : <><ChevronDown className="w-3.5 h-3.5" /> Show hint</>
                  }
                </button>

                {!isDone && (
                  <>
                    <button
                      onClick={() => setRecalled(prev => ({ ...prev, [q.id]: true }))}
                      className="cursor-pointer flex items-center gap-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg px-3 py-1.5 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" /> Got it
                    </button>
                    <button
                      onClick={() => setSkipped(prev => ({ ...prev, [q.id]: true }))}
                      className="cursor-pointer flex items-center gap-1.5 text-xs font-medium text-[var(--color-ink-muted)] hover:text-red-500 border border-[var(--color-border)] rounded-lg px-3 py-1.5 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" /> Missed it
                    </button>
                  </>
                )}

                {isRecalled && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400">
                    <Check className="w-3.5 h-3.5" /> Recalled
                  </span>
                )}
                {isSkipped && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-red-500 dark:text-red-400">
                    <X className="w-3.5 h-3.5" /> Missed
                  </span>
                )}
              </div>

              {hints[q.id] && (
                <div className="mt-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] p-3">
                  <p className="text-xs text-[var(--color-ink-muted)] italic">{q.hint}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isComplete && (
        <div className={`mt-6 rounded-xl border p-5 text-center ${
          scorePercent === 100
            ? 'border-green-400/40 bg-green-50 dark:bg-green-950/20'
            : scorePercent >= 60
            ? 'border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5'
            : 'border-red-300/40 bg-red-50/50 dark:bg-red-950/10'
        }`}>
          <p className={`text-2xl font-bold mb-1 ${
            scorePercent === 100 ? 'text-green-600 dark:text-green-400'
            : scorePercent >= 60 ? 'text-[var(--color-accent)]'
            : 'text-red-500'
          }`}>{scorePercent}%</p>
          <p className="text-sm font-medium text-[var(--color-ink)]">
            {recalledCount} of {questions.length} recalled
          </p>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1">
            {scorePercent === 100 ? 'Perfect score! Great work.' : scorePercent >= 60 ? 'Good effort — review the missed ones.' : 'Keep practicing to strengthen retention.'}
          </p>
          <button
            onClick={reset}
            className="cursor-pointer mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[var(--color-accent)] rounded-lg px-4 py-2 hover:opacity-90 transition-opacity"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Try Again
          </button>
        </div>
      )}
    </section>
  );
}
