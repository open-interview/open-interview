import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { getBadgeById, RARITY_COLORS } from '@/lib/challenge-badges';

interface XPCelebrationProps {
  xpEarned: number;
  newLevel?: number;
  leveledUp: boolean;
  badgesEarned: string[]; // badge IDs
  onClose: () => void;
}

// Deterministic confetti pieces so SSR/hydration is stable
const CONFETTI = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  left: `${(i * 2.5) % 100}%`,
  delay: `${(i * 0.07) % 1.5}s`,
  duration: `${1.2 + (i % 5) * 0.3}s`,
  color: ['bg-teal-400', 'bg-indigo-400', 'bg-yellow-400', 'bg-pink-400', 'bg-purple-400'][i % 5],
  size: i % 3 === 0 ? 'w-3 h-3' : 'w-2 h-2',
}));

export default function XPCelebration({
  xpEarned,
  newLevel,
  leveledUp,
  badgesEarned,
  onClose,
}: XPCelebrationProps) {
  const prefersReducedMotion = useReducedMotion();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Challenge solved celebration"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Confetti */}
      {!prefersReducedMotion && (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {CONFETTI.map((p) => (
          <div
            key={p.id}
            className={`absolute top-0 rounded-sm ${p.color} ${p.size} animate-bounce opacity-80`}
            style={{
              left: p.left,
              animationDelay: p.delay,
              animationDuration: p.duration,
            }}
          />
        ))}
      </div>
      )}

      {/* Card */}
      <div className="relative z-10 mx-4 w-full max-w-sm rounded-2xl bg-gradient-to-b from-indigo-900 to-teal-900 p-8 text-center shadow-2xl ring-1 ring-white/10">

        {/* XP earned */}
        <div className={`mb-2 ${prefersReducedMotion ? '' : 'animate-bounce'} text-6xl font-black text-teal-300 drop-shadow-lg`}>
          +{xpEarned} XP
        </div>
        <p className="mb-6 text-sm font-medium text-indigo-200 uppercase tracking-widest">
          Challenge Solved!
        </p>

        {/* Level up */}
        {leveledUp && newLevel !== undefined && (
          <div className="mb-6 rounded-xl bg-yellow-400/10 px-4 py-3 ring-1 ring-yellow-400/30">
            <div className="flex items-center justify-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className={`${prefersReducedMotion ? 'hidden' : 'animate-ping'} absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75`} />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-yellow-400" />
              </span>
              <span className="text-lg font-bold text-yellow-300">Level Up!</span>
            </div>
            <p className="mt-1 text-sm text-yellow-200">
              You are now level <span className="font-bold">{newLevel}</span>
            </p>
          </div>
        )}

        {/* Badges earned */}
        {badgesEarned.length > 0 && (
          <div className="mb-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-indigo-300">
              New Badge{badgesEarned.length > 1 ? 's' : ''} Unlocked
            </p>
            <div className="flex flex-col gap-2">
              {badgesEarned.map((id) => {
                const badge = getBadgeById(id);
                if (!badge) return null;
                return (
                  <div
                    key={id}
                    className="flex items-center gap-3 rounded-lg bg-white/5 px-4 py-2 ring-1 ring-white/10"
                  >
                    <span className="text-2xl" role="img" aria-label={badge.name}>
                      {badge.icon}
                    </span>
                    <div className="text-left">
                      <p className={`text-sm font-semibold ${RARITY_COLORS[badge.rarity]}`}>
                        {badge.name}
                      </p>
                      <p className="text-xs text-indigo-300">{badge.description}</p>
                    </div>
                    <span className={`ml-auto text-xs font-medium capitalize ${RARITY_COLORS[badge.rarity]}`}>
                      {badge.rarity}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full rounded-xl bg-teal-500 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:ring-offset-2 focus:ring-offset-indigo-900 active:scale-95"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
