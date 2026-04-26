import { useState } from 'react';
import { Brain, Eye } from 'lucide-react';

interface RecallGateProps {
  onReveal: () => void;
}

export function RecallGate({ onReveal }: RecallGateProps) {
  const [attempt, setAttempt] = useState('');

  return (
    <div className="rounded-2xl border border-border bg-muted/30 backdrop-blur-sm p-6 flex flex-col gap-5">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Brain className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-sm text-foreground">Try to recall first</p>
          <p className="text-xs text-muted-foreground">Retrieving from memory strengthens long-term retention</p>
        </div>
      </div>

      <textarea
        value={attempt}
        onChange={e => setAttempt(e.target.value)}
        rows={3}
        placeholder="Write what you remember... (optional)"
        className="w-full rounded-xl border border-border bg-background text-sm p-3 resize-none focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50"
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground italic hidden sm:block">
          Active recall improves memory retention by up to 50%
        </p>
        <button
          onClick={onReveal}
          className="cursor-pointer flex items-center gap-2 px-5 py-2.5 min-h-[44px] bg-primary text-primary-foreground font-semibold rounded-xl text-sm transition-opacity hover:opacity-90 flex-shrink-0"
        >
          <Eye className="w-4 h-4" />
          Reveal Answer
        </button>
      </div>
    </div>
  );
}
