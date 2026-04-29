import { motion } from 'framer-motion';
import type { ConfidenceRating } from '../../lib/spaced-repetition';

// ─── Question Number Badge ───────────────────────────────────────────────
export function QuestionNumberBadge({
  number,
  total,
}: {
  number: number;
  total: number;
}) {
  const size = 36;
  const stroke = 2.5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? (number + 1) / total : 0;
  const offset = circumference * (1 - progress);

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
       <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
         <circle
           cx={size / 2} cy={size / 2} r={radius}
           fill="none" stroke="rgba(26,115,232,0.12)" strokeWidth={stroke}
         />
         <motion.circle
           cx={size / 2} cy={size / 2} r={radius}
           fill="none" stroke="#1a73e8" strokeWidth={stroke}
           strokeDasharray={circumference}
           strokeDashoffset={offset}
           strokeLinecap="round"
           initial={{ strokeDashoffset: circumference }}
           animate={{ strokeDashoffset: offset }}
           transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
           transform={`rotate(-90 ${size / 2} ${size / 2})`}
         />
       </svg>
      <span
        style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 600, color: '#1a73e8',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {number + 1}
      </span>
    </div>
  );
}

// ─── Circular Timer ──────────────────────────────────────────────────────
export function CircularTimer({
  seconds,
  totalSeconds,
  size = 32,
}: {
  seconds: number;
  totalSeconds: number;
  size?: number;
}) {
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = totalSeconds > 0 ? Math.max(0, seconds / totalSeconds) : 0;
  const offset = circumference * (1 - progress);
  const color = '#1a73e8';

  return (
     <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }} aria-hidden="true">
       <circle
         cx={size / 2} cy={size / 2} r={radius}
         fill="none" stroke="rgba(26,115,232,0.12)" strokeWidth={stroke}
       />
       <motion.circle
         cx={size / 2} cy={size / 2} r={radius}
         fill="none" stroke={color} strokeWidth={stroke}
         strokeDasharray={circumference}
         strokeDashoffset={offset}
         strokeLinecap="round"
         transition={{ duration: 0.4, ease: 'linear' }}
         transform={`rotate(-90 ${size / 2} ${size / 2})`}
       />
       <text
         x="50%" y="50%" textAnchor="middle" dy="0.35em"
         fill="var(--text-tertiary)" fontSize={9} fontWeight={600}
         fontFamily="var(--font-mono, monospace)"
       >
         {Math.max(0, Math.ceil(seconds))}
       </text>
     </svg>
  );
}

// ─── Confidence Indicator Circles ────────────────────────────────────────
const CONFIDENCE_CFG: Record<ConfidenceRating, { color: string; bg: string; label: string }> = {
  again:  { color: '#f87171', bg: 'rgba(239,68,68,0.15)', label: 'Again' },
  hard:   { color: '#fbbf24', bg: 'rgba(245,158,11,0.15)', label: 'Hard' },
  good:   { color: '#34d399', bg: 'rgba(16,185,129,0.15)', label: 'Good' },
  easy:   { color: '#60a5fa', bg: 'rgba(59,130,246,0.15)', label: 'Easy' },
};

export function ConfidenceCircles({
  activeRating,
  onSelect,
  disabled = false,
}: {
  activeRating?: ConfidenceRating;
  onSelect?: (rating: ConfidenceRating) => void;
  disabled?: boolean;
}) {
  const ratings: ConfidenceRating[] = ['again', 'hard', 'good', 'easy'];
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      {ratings.map((r) => {
        const cfg = CONFIDENCE_CFG[r];
        const isActive = activeRating === r;
        return (
          <motion.button
            key={r}
            onClick={() => !disabled && onSelect?.(r)}
            disabled={disabled}
            whileHover={!disabled ? { scale: 1.15 } : {}}
            whileTap={!disabled ? { scale: 0.9 } : {}}
            animate={isActive ? { scale: [1, 1.2, 1], transition: { duration: 0.4 } } : {}}
            style={{
              width: 40, height: 40, borderRadius: '50%',
              background: isActive ? cfg.color : cfg.bg,
              border: `2px solid ${isActive ? cfg.color : 'transparent'}`,
              cursor: disabled ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 0, transition: 'background 0.2s, border-color 0.2s',
              opacity: isActive ? 1 : 0.5,
              position: 'relative',
            }}
            aria-label={cfg.label}
            title={cfg.label}
          >
            {/* Inner animated ring */}
            {isActive && (
              <motion.span
                initial={{ scale: 0.8, opacity: 0.6 }}
                animate={{ scale: 1.6, opacity: 0 }}
                transition={{ duration: 1, repeat: Infinity }}
                style={{
                  position: 'absolute', inset: -4, borderRadius: '50%',
                  border: `2px solid ${cfg.color}`,
                }}
              />
            )}
            <span style={{
              fontSize: 10, fontWeight: 700, color: isActive ? '#fff' : cfg.color,
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              {r.charAt(0)}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── Progress Bar SVG ───────────────────────────────────────────────
export function ProgressBarSVG({
  progress,
  height = 6,
  animated = true,
}: {
  progress: number;  // 0–100
  height?: number;
  animated?: boolean;
}) {
  const w = 100; // viewBox width percentage
  return (
    <div style={{ width: '100%', height, borderRadius: height / 2, overflow: 'hidden', background: 'rgba(26,115,232,0.12)' }}>
       <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" aria-hidden="true">
         <motion.rect
           x={0} y={0}
           width={progress}
           height={height}
           fill="#1a73e8"
           rx={height / 2} ry={height / 2}
           initial={{ width: 0 }}
           animate={{ width: progress }}
           transition={animated ? { duration: 0.5, ease: [0.4, 0, 0.2, 1] } : { duration: 0 }}
         />
       </svg>
    </div>
  );
}

// ─── Correct / Incorrect SVG ────────────────────────────────────────────
export function ResultIcon({
  correct,
  size = 48,
}: {
  correct: boolean;
  size?: number;
}) {
  if (correct) {
    return (
       <motion.svg
         width={size} height={size} viewBox="0 0 48 48"
         initial={{ scale: 0, rotate: -45 }}
         animate={{ scale: 1, rotate: 0 }}
         transition={{ type: 'spring', stiffness: 300, damping: 20 }}
         role="img"
         aria-label="Correct answer"
       >
         <circle cx={24} cy={24} r={22} fill="rgba(16,185,129,0.15)" stroke="#34d399" strokeWidth={2} />
         <motion.path
           d="M14 24l7 7 13-13"
           fill="none" stroke="#34d399" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"
           initial={{ pathLength: 0 }}
           animate={{ pathLength: 1 }}
           transition={{ duration: 0.5, ease: 'easeOut' }}
         />
       </motion.svg>
    );
  }
   return (
     <motion.svg
       width={size} height={size} viewBox="0 0 48 48"
       initial={{ scale: 0, rotate: 45 }}
       animate={{ scale: 1, rotate: 0 }}
       transition={{ type: 'spring', stiffness: 300, damping: 20 }}
       role="img"
       aria-label="Incorrect answer"
     >
       <circle cx={24} cy={24} r={22} fill="rgba(239,68,68,0.15)" stroke="#f87171" strokeWidth={2} />
       <motion.line
         x1={16} y1={16} x2={32} y2={32}
         stroke="#f87171" strokeWidth={3} strokeLinecap="round"
         initial={{ pathLength: 0 }}
         animate={{ pathLength: 1 }}
         transition={{ duration: 0.4, ease: 'easeOut' }}
       />
       <motion.line
         x1={32} y1={16} x2={16} y2={32}
         stroke="#f87171" strokeWidth={3} strokeLinecap="round"
         initial={{ pathLength: 0 }}
         animate={{ pathLength: 1 }}
         transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
       />
     </motion.svg>
   );
}

// ─── Streak Flame SVG ────────────────────────────────────────────────────
export function StreakFlameSVG({
  streak,
  size = 24,
  animate = true,
}: {
  streak: number;
  size?: number;
  animate?: boolean;
}) {
  const flameSize = size * 0.8;
  return (
    <motion.div
      style={{ display: 'flex', alignItems: 'center', gap: 4 }}
      whileHover={animate ? { scale: 1.05 } : {}}
    >
       <motion.svg
         width={size} height={size} viewBox="0 0 24 24"
         animate={animate ? { scale: [1, 1.08, 1], transition: { duration: 1.5, repeat: Infinity } } : {}}
         role="img"
         aria-label={`Streak flame: ${streak} day${streak !== 1 ? 's' : ''}`}
       >
         <motion.path
           d="M12 2c0 0-4 4.5-4 9a4 4 0 0 0 8 0c0-1.5-1-3-2-4.5C13.5 4.5 12 2 12 2z"
           fill="#f97316"
           initial={{ opacity: 0.7 }}
           animate={{ opacity: [0.7, 1, 0.7] }}
           transition={{ duration: 1, repeat: Infinity }}
         />
         <path
           d="M12 8c0 0-2 2.5-2 5a2 2 0 0 0 4 0c0-1-0.5-1.8-1-2.5C12.8 9.5 12 8 12 8z"
           fill="#fed7aa"
         />
       </motion.svg>
      {streak > 0 && (
        <motion.span
          style={{ fontSize: 13, fontWeight: 700, color: '#f97316', fontVariantNumeric: 'tabular-nums' }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          key={streak}
        >
          {streak}
        </motion.span>
      )}
    </motion.div>
  );
}

// ─── Points / XP Badge SVG ───────────────────────────────────────────────
export function PointsBadgeSVG({
  points,
  size = 20,
}: {
  points: number;
  size?: number;
}) {
  return (
    <motion.div
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: 'linear-gradient(135deg, rgba(234,179,8,0.2), rgba(234,179,8,0.08))',
        border: '1px solid rgba(234,179,8,0.3)',
        borderRadius: 20, padding: '3px 10px 3px 6px',
      }}
      whileHover={{ scale: 1.05 }}
    >
       <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
         <polygon points="10,1 12.5,7.5 19,7.5 14,12 16,19 10,15 4,19 6,12 1,7.5 7.5,7.5" fill="#FBBC05" />
       </svg>
      <motion.span
        style={{ fontSize: 12, fontWeight: 700, color: '#FBBC05', fontVariantNumeric: 'tabular-nums' }}
        key={points}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      >
        +{points}
      </motion.span>
    </motion.div>
  );
}

// ─── Animated Counter (for scores / XP) ─────────────────────────────────
export function AnimatedCounter({
  value,
  duration = 0.6,
}: {
  value: number;
  duration?: number;
}) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, type: 'spring', stiffness: 300, damping: 20 }}
      style={{ fontVariantNumeric: 'tabular-nums' }}
    >
      {value}
    </motion.span>
  );
}

// ─── Reveal Overlay Animation ────────────────────────────────────────────
export function RevealOverlay({
  show,
  children,
}: {
  show: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
      animate={show ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      style={{ width: '100%' }}
    >
      {children}
    </motion.div>
  );
}
