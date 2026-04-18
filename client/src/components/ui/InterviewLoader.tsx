/**
 * InterviewLoader — animated SVG art loader for Open Interview
 * Theme: neural network / knowledge graph nodes connecting
 * Keeps users engaged during async loads (>300ms)
 */

import { useState } from 'react';
import { motion } from 'framer-motion';

const TIPS = [
  'Tip: Explain your reasoning, not just the answer.',
  'Tip: Use the STAR method for behavioral questions.',
  'Tip: Ask clarifying questions before diving in.',
  'Tip: Think out loud — interviewers value your process.',
  'Tip: Pause to structure your answer before speaking.',
  'Tip: Quantify your impact with numbers when possible.',
];

interface InterviewLoaderProps {
  message?: string;
  showTip?: boolean;
}

export function InterviewLoader({ message = 'Loading...', showTip = true }: InterviewLoaderProps) {
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6" role="status" aria-label={message}>
      <NeuralSVG />
      <div className="text-center space-y-2">
        <p className="text-sm font-semibold text-foreground/80">{message}</p>
        {showTip && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.4 }}>
            <p className="text-xs text-muted-foreground/70 max-w-sm leading-relaxed">{tip}</p>
            <div className="flex gap-1 justify-center mt-2">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-violet-500/60" style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </motion.div>
        )}
      </div>
      <span className="sr-only">{message}</span>
    </div>
  );
}

function NeuralSVG() {
  return (
    <svg
      width="200"
      height="160"
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#050810" />
          <stop offset="100%" stopColor="#0f1629" />
        </linearGradient>
        <linearGradient id="progressGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>

      {/* Sky background */}
      <rect width="200" height="160" fill="url(#sky)" />

      {/* Stars */}
      {([
        [18, 12, 0.5, '4.2s', '0s'],
        [42, 8,  0.6, '3.8s', '0.7s'],
        [75, 22, 0.4, '5.1s', '1.2s'],
        [110, 10, 0.7, '4.6s', '0.3s'],
        [133, 28, 0.5, '3.5s', '1.8s'],
        [155, 15, 0.6, '4.9s', '0.9s'],
        [30, 45, 0.4, '5.3s', '2.1s'],
        [90, 50, 0.5, '4.0s', '1.5s'],
      ] as [number, number, number, string, string][]).map(([cx, cy, op, dur, begin], i) => (
        <circle key={i} cx={cx} cy={cy} r="0.8" fill="white" opacity={op}>
          <animate attributeName="opacity" values={`${op};${op * 0.3};${op}`} dur={dur} begin={begin} repeatCount="indefinite" />
        </circle>
      ))}

      {/* Moon (crescent via two overlapping circles) */}
      <circle cx="170" cy="20" r="8" fill="#1a2540" stroke="#4a6fa5" strokeWidth="1" />
      <circle cx="174" cy="18" r="7" fill="#050810" />

      {/* Ground strip */}
      <rect x="0" y="130" width="200" height="30" fill="#1a2540" />

      {/* Ground highlight line */}
      <line x1="0" y1="130" x2="200" y2="130" stroke="#2d3f6b" strokeWidth="1" />

      {/* Foundation blocks */}
      <rect x="55" y="118" width="90" height="14" rx="1" fill="#1e2d4a" stroke="#2d4a7a" strokeWidth="0.5" opacity="0">
        <animate attributeName="opacity" from="0" to="1" begin="0s" dur="0.3s" fill="freeze" />
      </rect>
      <rect x="58" y="120" width="28" height="10" rx="0.5" fill="#243558" stroke="#2d4a7a" strokeWidth="0.5" opacity="0">
        <animate attributeName="opacity" from="0" to="1" begin="0.1s" dur="0.3s" fill="freeze" />
      </rect>
      <rect x="90" y="120" width="28" height="10" rx="0.5" fill="#1e2d4a" stroke="#2d4a7a" strokeWidth="0.5" opacity="0">
        <animate attributeName="opacity" from="0" to="1" begin="0.2s" dur="0.3s" fill="freeze" />
      </rect>

      {/* Floor counter badges */}
      <text x="140" y="113" fontSize="5" fill="#4a6fa5" opacity="0" fontFamily="system-ui">1F
        <animate attributeName="opacity" from="0" to="0.7" begin="0.9s" dur="0.3s" fill="freeze" />
      </text>
      <text x="140" y="95" fontSize="5" fill="#4a6fa5" opacity="0" fontFamily="system-ui">2F
        <animate attributeName="opacity" from="0" to="0.7" begin="1.4s" dur="0.3s" fill="freeze" />
      </text>
      <text x="140" y="77" fontSize="5" fill="#4a6fa5" opacity="0" fontFamily="system-ui">3F
        <animate attributeName="opacity" from="0" to="0.7" begin="1.9s" dur="0.3s" fill="freeze" />
      </text>
      <text x="140" y="59" fontSize="5" fill="#4a6fa5" opacity="0" fontFamily="system-ui">4F
        <animate attributeName="opacity" from="0" to="0.7" begin="2.4s" dur="0.3s" fill="freeze" />
      </text>

      {/* Progress bar label */}
      <text x="100" y="145" textAnchor="middle" fontSize="7" fill="#64748b" fontFamily="system-ui">Constructing...</text>

      {/* Progress bar track */}
      <rect x="20" y="150" width="160" height="4" rx="2" fill="#1a2540" />

      {/* Progress bar fill */}
      <rect x="20" y="150" width="0" height="4" rx="2" fill="url(#progressGrad)">
        <animate attributeName="width" from="0" to="160" dur="4s" begin="0s" repeatCount="indefinite" fill="freeze" />
      </rect>
    </svg>
  );
}
