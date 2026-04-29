import { useState } from 'react';
import { Brain, Eye } from 'lucide-react';

interface RecallGateProps {
  onReveal: () => void;
}

export function RecallGate({ onReveal }: RecallGateProps) {
  const [attempt, setAttempt] = useState('');

  return (
    <div style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: 'var(--surface-2)', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="flex items-center gap-3">
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(26,115,232,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Brain className="w-4 h-4" style={{ color: '#1a73e8' }} />
        </div>
        <div>
          <p style={{ fontWeight: 500, fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>Try to recall first</p>
          <p style={{ fontSize: 12, color: '#5f6368' }}>Retrieving from memory strengthens long-term retention</p>
        </div>
      </div>

      <textarea
        value={attempt}
        onChange={e => setAttempt(e.target.value)}
        rows={3}
        placeholder="Write what you remember... (optional)"
        style={{ width: '100%', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'var(--surface-1)', color: 'var(--text-primary)', fontSize: 14, padding: 12, resize: 'none', outline: 'none', transition: 'border-color 0.2s' }}
        onFocus={e => e.currentTarget.style.borderColor = '#1a73e8'}
        onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <p style={{ fontSize: 11, color: '#5f6368', fontStyle: 'italic', display: 'none sm:block' }}>
          Active recall improves memory retention by up to 50%
        </p>
        <button
          onClick={onReveal}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', background: '#1a73e8', color: '#fff', border: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', transition: 'opacity 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <Eye className="w-4 h-4" />
          Reveal Answer
        </button>
      </div>
    </div>
  );
}
