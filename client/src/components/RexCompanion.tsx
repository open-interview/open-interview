import { useState, useMemo } from 'react';
import { X, ChevronUp, Bug } from 'lucide-react';
import { Challenge, TestResult } from '@/types/challenges';
import { getProgress, addXP } from '@/lib/challenge-progress';

interface RexCompanionProps {
  challenge: Challenge;
  currentCode: string;
  failingTests?: TestResult[];
  onClose?: () => void;
}

type Message = { id: number; text: string };

let msgId = 0;
const msg = (text: string): Message => ({ id: ++msgId, text });

export default function RexCompanion({ challenge, failingTests, onClose }: RexCompanionProps) {
  const [expanded, setExpanded] = useState(false);
  const [unlockedLevel, setUnlockedLevel] = useState(0);
  const [messages, setMessages] = useState<Message[]>(() => {
    const progress = getProgress().challenges[challenge.id];
    const greeting =
      failingTests?.length
        ? "Hmm, looks like some tests are failing. Want a nudge?"
        : progress?.attempts
        ? "Welcome back! You've tried this one before. You've got this!"
        : "Ready when you are! Click a hint if you get stuck.";
    return [msg(greeting)];
  });

  const xp = useMemo(() => getProgress().xp, []);

  function push(text: string) {
    setMessages(prev => [...prev, msg(text)]);
  }

  function unlockHint(level: 1 | 2 | 3) {
    const costs: Record<number, number> = { 1: 0, 2: 10, 3: 25 };
    const hints: Record<number, string> = {
      1: challenge.rexHints.level1,
      2: challenge.rexHints.level2,
      3: challenge.rexHints.level3,
    };
    const cost = costs[level];
    if (cost > 0 && xp < cost) {
      push(`You need ${cost} XP for this hint. Keep trying — you'll earn it!`);
      return;
    }
    if (cost > 0) addXP(-cost);
    setUnlockedLevel(level);
    push(hints[level]);
  }

  function debugHelp() {
    if (!failingTests?.length) return;
    const t = failingTests[0];
    const inputStr = JSON.stringify(t.input);
    const actualStr = JSON.stringify(t.actual);
    const expectedStr = JSON.stringify(t.expected);
    push(
      `Looking at test case #${t.testIndex + 1}... The input is ${inputStr}. Your code returned ${actualStr} but expected ${expectedStr}. Think about what edge case this might be testing.`
    );
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-full text-white text-sm font-medium shadow-lg transition-transform hover:scale-105"
        style={{ backgroundColor: '#14b8a6' }}
        aria-label="Open Rex AI companion"
      >
        🤖 <span>Ask Rex</span> <ChevronUp size={14} />
      </button>
    );
  }

  return (
    <div className="flex flex-col rounded-xl shadow-xl overflow-hidden w-72 bg-white border border-teal-100">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 text-white" style={{ backgroundColor: '#14b8a6' }}>
        <span className="text-xl">🤖</span>
        <span className="font-semibold flex-1">Rex</span>
        <button onClick={() => setExpanded(false)} className="opacity-80 hover:opacity-100" aria-label="Collapse Rex">
          <ChevronUp size={16} />
        </button>
        {onClose && (
          <button onClick={onClose} className="opacity-80 hover:opacity-100" aria-label="Close Rex">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex flex-col gap-2 p-3 max-h-48 overflow-y-auto bg-teal-50">
        {messages.map(m => (
          <div key={m.id} className="flex gap-2 items-start">
            <span className="text-base shrink-0">🤖</span>
            <p className="bg-white text-gray-700 text-sm rounded-2xl rounded-tl-none px-3 py-2 shadow-sm leading-snug">
              {m.text}
            </p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1.5 p-3 border-t border-teal-100">
        <HintButton
          label="Hint Level 1"
          badge="Free"
          disabled={unlockedLevel >= 1}
          onClick={() => unlockHint(1)}
        />
        <HintButton
          label="Hint Level 2"
          badge="10 XP"
          disabled={unlockedLevel < 1 || unlockedLevel >= 2}
          locked={unlockedLevel < 1}
          onClick={() => unlockHint(2)}
        />
        <HintButton
          label="Hint Level 3"
          badge="25 XP"
          disabled={unlockedLevel < 2 || unlockedLevel >= 3}
          locked={unlockedLevel < 2}
          onClick={() => unlockHint(3)}
        />
        {failingTests?.length ? (
          <button
            onClick={debugHelp}
            className="flex items-center justify-center gap-1.5 text-sm py-1.5 px-3 rounded-lg border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
          >
            <Bug size={14} /> Debug Help
          </button>
        ) : null}
      </div>
    </div>
  );
}

function HintButton({
  label,
  badge,
  disabled,
  locked,
  onClick,
}: {
  label: string;
  badge: string;
  disabled?: boolean;
  locked?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-between text-sm py-1.5 px-3 rounded-lg border transition-colors ${
        disabled
          ? 'opacity-40 cursor-not-allowed border-gray-200 text-gray-400 bg-gray-50'
          : 'border-teal-300 text-teal-700 bg-teal-50 hover:bg-teal-100'
      }`}
    >
      <span>{locked ? `🔒 ${label}` : label}</span>
      <span className="text-xs font-medium opacity-70">{badge}</span>
    </button>
  );
}
