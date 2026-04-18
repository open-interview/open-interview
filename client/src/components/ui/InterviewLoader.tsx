/**
 * InterviewLoader — animated SVG art loader for Open Interview
 * Theme: neural network / knowledge graph nodes connecting
 * Keeps users engaged during async loads (>300ms)
 */

import { useEffect, useState } from 'react';

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
        <p className="text-sm font-medium text-muted-foreground">{message}</p>
        {showTip && (
          <p className="text-xs text-muted-foreground/60 max-w-xs">{tip}</p>
        )}
      </div>
      <span className="sr-only">{message}</span>
    </div>
  );
}

function NeuralSVG() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        {/* Violet glow filter */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Gradient for edges */}
        <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
        </linearGradient>

        {/* Pulse gradient for nodes */}
        <radialGradient id="nodeGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </radialGradient>

        {/* Traveling dot along path */}
        <radialGradient id="dotGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#06b6d4" />
        </radialGradient>
      </defs>

      {/* ── Background subtle grid ── */}
      <g opacity="0.06" stroke="#7c3aed" strokeWidth="0.5">
        {[20, 40, 60, 80, 100].map(x => (
          <line key={`v${x}`} x1={x} y1="0" x2={x} y2="120" />
        ))}
        {[20, 40, 60, 80, 100].map(y => (
          <line key={`h${y}`} x1="0" y1={y} x2="120" y2={y} />
        ))}
      </g>

      {/* ── Edges (connections between nodes) ── */}
      {/* Center → Top-left */}
      <line x1="60" y1="60" x2="25" y2="28" stroke="url(#edgeGrad)" strokeWidth="1.5" strokeOpacity="0.4">
        <animate attributeName="stroke-opacity" values="0.2;0.7;0.2" dur="2.4s" repeatCount="indefinite" />
      </line>
      {/* Center → Top-right */}
      <line x1="60" y1="60" x2="95" y2="28" stroke="url(#edgeGrad)" strokeWidth="1.5" strokeOpacity="0.4">
        <animate attributeName="stroke-opacity" values="0.2;0.7;0.2" dur="2.1s" begin="0.3s" repeatCount="indefinite" />
      </line>
      {/* Center → Bottom-left */}
      <line x1="60" y1="60" x2="22" y2="88" stroke="url(#edgeGrad)" strokeWidth="1.5" strokeOpacity="0.4">
        <animate attributeName="stroke-opacity" values="0.2;0.7;0.2" dur="1.9s" begin="0.6s" repeatCount="indefinite" />
      </line>
      {/* Center → Bottom-right */}
      <line x1="60" y1="60" x2="98" y2="88" stroke="url(#edgeGrad)" strokeWidth="1.5" strokeOpacity="0.4">
        <animate attributeName="stroke-opacity" values="0.2;0.7;0.2" dur="2.6s" begin="0.9s" repeatCount="indefinite" />
      </line>
      {/* Center → Right */}
      <line x1="60" y1="60" x2="105" y2="58" stroke="url(#edgeGrad)" strokeWidth="1.5" strokeOpacity="0.4">
        <animate attributeName="stroke-opacity" values="0.2;0.7;0.2" dur="2.2s" begin="0.4s" repeatCount="indefinite" />
      </line>
      {/* Center → Left */}
      <line x1="60" y1="60" x2="15" y2="58" stroke="url(#edgeGrad)" strokeWidth="1.5" strokeOpacity="0.4">
        <animate attributeName="stroke-opacity" values="0.2;0.7;0.2" dur="2.0s" begin="0.7s" repeatCount="indefinite" />
      </line>
      {/* Outer cross-connections */}
      <line x1="25" y1="28" x2="95" y2="28" stroke="#7c3aed" strokeWidth="1" strokeOpacity="0.2">
        <animate attributeName="stroke-opacity" values="0.1;0.4;0.1" dur="3s" repeatCount="indefinite" />
      </line>
      <line x1="22" y1="88" x2="98" y2="88" stroke="#06b6d4" strokeWidth="1" strokeOpacity="0.2">
        <animate attributeName="stroke-opacity" values="0.1;0.4;0.1" dur="3.2s" begin="0.5s" repeatCount="indefinite" />
      </line>

      {/* ── Traveling signal dots along edges ── */}
      {/* Center → Top-right */}
      <circle r="2.5" fill="url(#dotGrad)" filter="url(#glow)">
        <animateMotion dur="1.8s" repeatCount="indefinite" begin="0s">
          <mpath href="#path-c-tr" />
        </animateMotion>
      </circle>
      <path id="path-c-tr" d="M60,60 L95,28" fill="none" />

      {/* Center → Bottom-left */}
      <circle r="2" fill="#a78bfa" filter="url(#glow)">
        <animateMotion dur="2.1s" repeatCount="indefinite" begin="0.7s">
          <mpath href="#path-c-bl" />
        </animateMotion>
      </circle>
      <path id="path-c-bl" d="M60,60 L22,88" fill="none" />

      {/* Center → Right */}
      <circle r="2" fill="#06b6d4" filter="url(#glow)">
        <animateMotion dur="1.5s" repeatCount="indefinite" begin="0.3s">
          <mpath href="#path-c-r" />
        </animateMotion>
      </circle>
      <path id="path-c-r" d="M60,60 L105,58" fill="none" />

      {/* ── Outer satellite nodes ── */}
      {/* Top-left */}
      <circle cx="25" cy="28" r="5" fill="#0f1629" stroke="#7c3aed" strokeWidth="1.5">
        <animate attributeName="r" values="5;6.5;5" dur="2.4s" repeatCount="indefinite" />
        <animate attributeName="stroke-opacity" values="0.6;1;0.6" dur="2.4s" repeatCount="indefinite" />
      </circle>
      {/* Top-right */}
      <circle cx="95" cy="28" r="5" fill="#0f1629" stroke="#06b6d4" strokeWidth="1.5">
        <animate attributeName="r" values="5;6.5;5" dur="2.1s" begin="0.4s" repeatCount="indefinite" />
        <animate attributeName="stroke-opacity" values="0.6;1;0.6" dur="2.1s" begin="0.4s" repeatCount="indefinite" />
      </circle>
      {/* Left */}
      <circle cx="15" cy="58" r="4" fill="#0f1629" stroke="#7c3aed" strokeWidth="1.5">
        <animate attributeName="r" values="4;5.5;4" dur="1.9s" begin="0.8s" repeatCount="indefinite" />
      </circle>
      {/* Right */}
      <circle cx="105" cy="58" r="4" fill="#0f1629" stroke="#06b6d4" strokeWidth="1.5">
        <animate attributeName="r" values="4;5.5;4" dur="2.3s" begin="0.2s" repeatCount="indefinite" />
      </circle>
      {/* Bottom-left */}
      <circle cx="22" cy="88" r="5" fill="#0f1629" stroke="#7c3aed" strokeWidth="1.5">
        <animate attributeName="r" values="5;6.5;5" dur="2.6s" begin="1s" repeatCount="indefinite" />
      </circle>
      {/* Bottom-right */}
      <circle cx="98" cy="88" r="5" fill="#0f1629" stroke="#06b6d4" strokeWidth="1.5">
        <animate attributeName="r" values="5;6.5;5" dur="2.0s" begin="0.6s" repeatCount="indefinite" />
      </circle>

      {/* ── Center node — main brain/hub ── */}
      {/* Outer pulse ring */}
      <circle cx="60" cy="60" r="22" fill="none" stroke="#7c3aed" strokeWidth="1" strokeOpacity="0.3">
        <animate attributeName="r" values="18;26;18" dur="2s" repeatCount="indefinite" />
        <animate attributeName="stroke-opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
      </circle>
      {/* Mid ring */}
      <circle cx="60" cy="60" r="16" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeOpacity="0.5">
        <animate attributeName="r" values="14;18;14" dur="2s" begin="0.3s" repeatCount="indefinite" />
        <animate attributeName="stroke-opacity" values="0.6;0.2;0.6" dur="2s" begin="0.3s" repeatCount="indefinite" />
      </circle>
      {/* Core fill */}
      <circle cx="60" cy="60" r="12" fill="url(#nodeGrad)" filter="url(#glow)">
        <animate attributeName="r" values="11;13;11" dur="2s" repeatCount="indefinite" />
      </circle>

      {/* ── Center icon: brain/circuit symbol ── */}
      {/* Simple stylized "Q" for questions / interview */}
      <text
        x="60"
        y="65"
        textAnchor="middle"
        fontSize="13"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
        fill="white"
        opacity="0.95"
      >
        ?
      </text>
    </svg>
  );
}
