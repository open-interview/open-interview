import { useState } from 'react';
import { Brain, ChevronDown, ChevronUp, Check } from 'lucide-react';
import type { BlogQuizQuestion } from '../../data/blog-quizzes';

interface BlogKnowledgeCheckProps {
  questions: BlogQuizQuestion[];
}

export function BlogKnowledgeCheck({ questions }: BlogKnowledgeCheckProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [recalled, setRecalled] = useState<Record<string, boolean>>({});
  const [hints, setHints] = useState<Record<string, boolean>>({});

  const recalledCount = Object.values(recalled).filter(Boolean).length;

  return (
    <section className="mt-12 border-t border-[var(--color-border)] pt-10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <Brain className="w-5 h-5 text-[var(--color-accent)]" />
          <h2 className="text-xl font-bold text-[var(--color-ink)]">Knowledge Check</h2>
        </div>
        <span className="text-sm text-[var(--color-ink-muted)] font-medium">
          {recalledCount} / {questions.length} recalled
        </span>
      </div>
      <p className="text-sm text-[var(--color-ink-muted)] mb-6">
        Try to answer from memory before revealing each hint. This strengthens long-term retention.
      </p>

      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div
            key={q.id}
            className={`rounded-xl border p-5 transition-all duration-200 ${
              recalled[q.id]
                ? 'border-green-400/40 bg-green-50 dark:bg-green-950/20'
                : 'border-[var(--color-border)] bg-[var(--color-surface-raised)]'
            }`}
          >
            <div className="flex items-start gap-3 mb-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--color-accent)]/15 text-[var(--color-accent)] text-xs font-bold flex items-center justify-center mt-0.5">
                {idx + 1}
              </span>
              <p className="font-semibold text-[var(--color-ink)] text-sm leading-relaxed">{q.prompt}</p>
            </div>

            <textarea
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm p-3 resize-none focus:outline-none focus:border-[var(--color-accent)] transition-colors placeholder:text-[var(--color-ink-muted)]/50 text-[var(--color-ink)] mb-3"
              rows={3}
              placeholder="Write your answer from memory..."
              value={answers[q.id] ?? ''}
              onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
              disabled={recalled[q.id]}
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

              {!recalled[q.id] && (
                <button
                  onClick={() => setRecalled(prev => ({ ...prev, [q.id]: true }))}
                  className="cursor-pointer flex items-center gap-1.5 text-xs font-semibold text-white bg-[var(--color-accent)] rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity"
                >
                  <Check className="w-3.5 h-3.5" /> Mark as Recalled
                </button>
              )}

              {recalled[q.id] && (
                <span className="flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400">
                  <Check className="w-3.5 h-3.5" /> Recalled
                </span>
              )}
            </div>

            {hints[q.id] && (
              <div className="mt-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] p-3">
                <p className="text-xs text-[var(--color-ink-muted)] italic">{q.hint}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {recalledCount === questions.length && questions.length > 0 && (
        <div className="mt-6 rounded-xl border border-green-400/40 bg-green-50 dark:bg-green-950/20 p-4 text-center">
          <p className="text-sm font-semibold text-green-700 dark:text-green-400">
            All recalled! Great work reinforcing this content.
          </p>
        </div>
      )}
    </section>
  );
}
