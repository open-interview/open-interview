import { useState, useMemo } from 'react';
import { X, ChevronUp, Bug, Sparkles, Lock } from 'lucide-react';
import { Challenge, TestResult } from '@/types/challenges';
import { getProgress, addXP } from '@/lib/challenge-progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

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
    const greeting = failingTests?.length
      ? "Hmm, some tests are failing. Want a nudge in the right direction?"
      : progress?.attempts
      ? "Welcome back! You've tried this one before — you've got this!"
      : "Ready when you are! Click a hint if you get stuck.";
    return [msg(greeting)];
  });

  const xp = useMemo(() => getProgress().xp, []);

  function push(text: string) {
    setMessages(prev => [...prev, msg(text)]);
  }

  function unlockHint(level: 1 | 2 | 3) {
    const costs: Record<number, number> = { 1: 0, 2: 10, 3: 25 };
    const cost = costs[level];
    if (cost > 0 && xp < cost) {
      push(`You need ${cost} XP for this hint. Keep trying — you'll earn it!`);
      return;
    }
    if (cost > 0) addXP(-cost);
    setUnlockedLevel(level);
    push({ 1: challenge.rexHints.level1, 2: challenge.rexHints.level2, 3: challenge.rexHints.level3 }[level]);
  }

  function debugHelp() {
    if (!failingTests?.length) return;
    const t = failingTests[0];
    push(`Test #${t.testIndex + 1}: input ${JSON.stringify(t.input)}, got ${JSON.stringify(t.actual)}, expected ${JSON.stringify(t.expected)}. What edge case might this be testing?`);
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors shadow-md"
        aria-label="Open Rex AI companion"
      >
        <Sparkles className="w-3.5 h-3.5" /> Ask Rex
        <ChevronUp className="w-3.5 h-3.5 opacity-70" />
      </button>
    );
  }

  return (
    <div className="flex flex-col w-72 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-violet-600 text-white">
        <Sparkles className="w-4 h-4 shrink-0" />
        <span className="font-semibold text-sm flex-1">Rex</span>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-violet-500 text-violet-100 border-0">AI</Badge>
        <button onClick={() => setExpanded(false)} className="opacity-70 hover:opacity-100 ml-1" aria-label="Collapse">
          <ChevronUp className="w-4 h-4" />
        </button>
        {onClose && (
          <button onClick={onClose} className="opacity-70 hover:opacity-100" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="max-h-44">
        <div className="flex flex-col gap-2 p-3">
          {messages.map(m => (
            <div key={m.id} className="flex gap-2 items-start">
              <div className="w-6 h-6 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3 h-3 text-violet-400" />
              </div>
              <p className="bg-muted text-foreground text-xs rounded-2xl rounded-tl-none px-3 py-2 leading-relaxed border border-border">
                {m.text}
              </p>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Actions */}
      <div className="flex flex-col gap-1.5 p-3 border-t border-border">
        {([
          { level: 1 as const, label: 'Hint Level 1', badge: 'Free',  cost: 0  },
          { level: 2 as const, label: 'Hint Level 2', badge: '10 XP', cost: 10 },
          { level: 3 as const, label: 'Hint Level 3', badge: '25 XP', cost: 25 },
        ]).map(({ level, label, badge, cost }) => {
          const done   = unlockedLevel >= level;
          const locked = level > 1 && unlockedLevel < level - 1;
          return (
            <button
              key={level}
              onClick={() => !done && !locked && unlockHint(level)}
              disabled={done || locked}
              className={`flex items-center justify-between text-xs py-1.5 px-3 rounded-lg border transition-colors ${
                done
                  ? 'opacity-40 cursor-default border-border text-muted-foreground bg-muted'
                  : locked
                  ? 'opacity-40 cursor-not-allowed border-border text-muted-foreground bg-muted'
                  : 'border-violet-500/40 text-violet-300 bg-violet-500/10 hover:bg-violet-500/20'
              }`}
            >
              <span className="flex items-center gap-1.5">
                {locked && <Lock className="w-3 h-3" />}
                {label}
              </span>
              <span className="opacity-60 font-medium">{badge}</span>
            </button>
          );
        })}

        {failingTests?.length ? (
          <Button
            variant="outline"
            size="sm"
            onClick={debugHelp}
            className="w-full text-xs h-7 border-amber-500/40 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 hover:text-amber-300"
          >
            <Bug className="w-3 h-3 mr-1.5" /> Debug Help
          </Button>
        ) : null}
      </div>
    </div>
  );
}
