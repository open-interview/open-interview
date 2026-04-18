import { useState } from 'react';
import { ChevronDown, ChevronRight, Loader2, Clock } from 'lucide-react';
import type { TestResult } from '@/types/challenges';
import type { Verdict, ScoreResult } from '@/lib/test-runner';
import { getVerdictColor, getVerdictIcon } from '@/lib/test-runner';

interface TestResultsPanelProps {
  results: TestResult[];
  stdout?: string;
  error?: string;
  executionTimeMs?: number;
  verdict?: Verdict;
  score?: ScoreResult;
  isRunning?: boolean;
}

const VERDICT_BG: Record<Verdict, string> = {
  accepted: 'bg-green-500/10 border-green-500/30',
  partial: 'bg-yellow-500/10 border-yellow-500/30',
  wrong_answer: 'bg-red-500/10 border-red-500/30',
  runtime_error: 'bg-orange-500/10 border-orange-500/30',
  time_limit_exceeded: 'bg-purple-500/10 border-purple-500/30',
};

function truncate(val: any, max = 40): { text: string; truncated: boolean } {
  const text = typeof val === 'string' ? val : JSON.stringify(val) ?? '';
  return { text: text.length > max ? text.slice(0, max) + '…' : text, truncated: text.length > max };
}

function Cell({ val }: { val: any }) {
  const { text, truncated } = truncate(val);
  return truncated ? (
    <span title={typeof val === 'string' ? val : JSON.stringify(val)} className="cursor-help underline decoration-dotted">
      {text}
    </span>
  ) : (
    <span>{text}</span>
  );
}

export default function TestResultsPanel({
  results,
  stdout,
  error,
  executionTimeMs,
  verdict,
  score,
  isRunning,
}: TestResultsPanelProps) {
  const [stdoutOpen, setStdoutOpen] = useState(false);

  if (isRunning) {
    return (
      <div className="flex items-center gap-2 p-4 text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Running tests...</span>
      </div>
    );
  }

  if (!results.length && !error) {
    return <div className="p-4 text-slate-500 text-sm">Run your code to see results.</div>;
  }

  return (
    <div className="flex flex-col gap-3 p-4 text-sm">
      {/* Verdict banner */}
      {verdict && score && (
        <div className={`rounded-lg border px-4 py-3 flex items-center justify-between ${VERDICT_BG[verdict]}`}>
          <span className={`font-semibold ${getVerdictColor(verdict)}`}>
            {getVerdictIcon(verdict)} {score.message}
          </span>
          <span className="text-slate-300 text-xs">
            +{score.totalXP} XP
            {score.timeBonusXP > 0 && <span className="text-yellow-400 ml-1">(+{score.timeBonusXP} time bonus)</span>}
          </span>
        </div>
      )}

      {/* Score + progress bar */}
      {score && (
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span>{score.passed}/{score.total} tests passing</span>
            <span>{score.percentage}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${score.percentage === 100 ? 'bg-green-500' : score.percentage > 0 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${score.percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Test results table */}
      {results.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-700">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/50 text-slate-400">
                <th className="px-3 py-2 text-left w-8">#</th>
                <th className="px-3 py-2 text-left w-16">Status</th>
                <th className="px-3 py-2 text-left">Input</th>
                <th className="px-3 py-2 text-left">Expected</th>
                <th className="px-3 py-2 text-left">Actual</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr
                  key={r.testIndex}
                  className={`border-b border-slate-700/50 last:border-0 ${!r.passed ? 'bg-red-500/5' : ''}`}
                >
                  <td className="px-3 py-2 text-slate-500">{r.testIndex + 1}</td>
                  <td className="px-3 py-2">{r.passed ? '✅' : '❌'}</td>
                  <td className="px-3 py-2 font-mono text-slate-300"><Cell val={r.input} /></td>
                  <td className="px-3 py-2 font-mono text-slate-300"><Cell val={r.expected} /></td>
                  <td className={`px-3 py-2 font-mono ${r.passed ? 'text-slate-300' : 'text-red-400'}`}>
                    <Cell val={r.error ?? r.actual} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Error */}
      {error && (
        <pre className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-red-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
          {error}
        </pre>
      )}

      {/* Stdout collapsible */}
      {stdout && (
        <div className="rounded-lg border border-slate-700 overflow-hidden">
          <button
            onClick={() => setStdoutOpen((o) => !o)}
            className="w-full flex items-center gap-1 px-3 py-2 text-xs text-slate-400 hover:bg-slate-800/50 transition-colors"
          >
            {stdoutOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            stdout
          </button>
          {stdoutOpen && (
            <pre className="px-3 pb-3 text-xs font-mono text-slate-300 whitespace-pre-wrap overflow-x-auto">
              {stdout}
            </pre>
          )}
        </div>
      )}

      {/* Execution time */}
      {executionTimeMs !== undefined && (
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Clock className="w-3 h-3" />
          {executionTimeMs}ms
        </div>
      )}
    </div>
  );
}
