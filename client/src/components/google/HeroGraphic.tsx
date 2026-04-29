/**
 * HeroGraphic - Abstract SVG decoration for hero section
 * Features: floating geometric shapes, Google 4-color blobs, particles, connected lines
 */
import React from 'react';
import { GoogleColors } from '../../pages/HomeGoogle';

interface HeroGraphicProps {
  className?: string;
}

function FloatingShape({ 
  x, y, size, color, delay = 0, shape = 'circle' 
}: { 
  x: number; 
  y: number; 
  size: number; 
  color: string; 
  delay?: number;
  shape?: 'circle' | 'square' | 'triangle';
}) {
  const baseClass = "animate-float";
  const style = { animationDelay: `${delay}s` };
  
  switch (shape) {
    case 'square':
      return (
        <rect 
          x={x - size/2} 
          y={y - size/2} 
          width={size} 
          height={size} 
          rx={size * 0.2}
          fill={color} 
          fillOpacity={0.12}
          className={baseClass}
          style={style}
        />
      );
    case 'triangle':
      const points = `${x},${y - size/2} ${x - size/2},${y + size/2} ${x + size/2},${y + size/2}`;
      return (
        <polygon 
          points={points}
          fill={color} 
          fillOpacity={0.12}
          className={baseClass}
          style={style}
        />
      );
    default:
      return (
        <circle 
          cx={x} 
          cy={y} 
          r={size/2} 
          fill={color} 
          fillOpacity={0.12}
          className={baseClass}
          style={style}
        />
      );
  }
}

function Particle({ x, y, delay = 0 }: { x: number; y: number; delay?: number }) {
  return (
    <circle 
      cx={x} 
      cy={y} 
      r={2}
      fill={GoogleColors.blue}
      fillOpacity={0.4}
      className="animate-pulse-slow"
      style={{ animationDelay: `${delay}s` }}
    />
  );
}

function ConnectingLine({ x1, y1, x2, y2, color }: { 
  x1: number; y1: number; x2: number; y2: number; color: string 
}) {
  return (
    <line 
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={color}
      strokeWidth={0.5}
      strokeOpacity={0.2}
      strokeDasharray="4 4"
      className="animate-dash"
    />
  );
}

export default function HeroGraphic({ className = '' }: HeroGraphicProps) {
  const shapes = [
    { x: 120, y: 80, size: 60, color: GoogleColors.blue, delay: 0, shape: 'circle' as const },
    { x: 280, y: 150, size: 40, color: GoogleColors.red, delay: 1, shape: 'square' as const },
    { x: 200, y: 250, size: 50, color: GoogleColors.yellow, delay: 2, shape: 'triangle' as const },
    { x: 350, y: 100, size: 35, color: GoogleColors.green, delay: 0.5, shape: 'circle' as const },
    { x: 160, y: 180, size: 45, color: GoogleColors.blue, delay: 1.5, shape: 'square' as const },
    { x: 300, y: 220, size: 30, color: GoogleColors.red, delay: 3, shape: 'triangle' as const },
  ];

  const particles = [
    { x: 100, y: 120, delay: 0 },
    { x: 180, y: 90, delay: 0.5 },
    { x: 250, y: 180, delay: 1 },
    { x: 320, y: 140, delay: 1.5 },
    { x: 150, y: 220, delay: 2 },
    { x: 280, y: 260, delay: 0.8 },
    { x: 200, y: 150, delay: 1.2 },
    { x: 340, y: 200, delay: 2.5 },
  ];

  const lines = [
    { x1: 120, y1: 80, x2: 280, y2: 150, color: GoogleColors.blue },
    { x1: 280, y1: 150, x2: 200, y2: 250, color: GoogleColors.red },
    { x1: 200, y1: 250, x2: 350, y2: 100, color: GoogleColors.yellow },
    { x1: 350, y1: 100, x2: 160, y2: 180, color: GoogleColors.green },
    { x1: 160, y1: 180, x2: 300, y2: 220, color: GoogleColors.blue },
  ];

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 440 320" 
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
      >
        <defs>
          <radialGradient id="blob-blue" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={GoogleColors.blue} stopOpacity={0.15} />
            <stop offset="100%" stopColor={GoogleColors.blue} stopOpacity={0} />
          </radialGradient>
          <radialGradient id="blob-red" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={GoogleColors.red} stopOpacity={0.12} />
            <stop offset="100%" stopColor={GoogleColors.red} stopOpacity={0} />
          </radialGradient>
          <radialGradient id="blob-yellow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={GoogleColors.yellow} stopOpacity={0.12} />
            <stop offset="100%" stopColor={GoogleColors.yellow} stopOpacity={0} />
          </radialGradient>
          <radialGradient id="blob-green" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={GoogleColors.green} stopOpacity={0.12} />
            <stop offset="100%" stopColor={GoogleColors.green} stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* Gradient blobs */}
        <circle cx="100" cy="160" r="120" fill="url(#blob-blue)" className="animate-morph" />
        <circle cx="340" cy="80" r="100" fill="url(#blob-red)" className="animate-morph" style={{ animationDelay: '2s' }} />
        <circle cx="220" cy="280" r="110" fill="url(#blob-yellow)" className="animate-morph" style={{ animationDelay: '4s' }} />
        <circle cx="380" cy="240" r="90" fill="url(#blob-green)" className="animate-morph" style={{ animationDelay: '1s' }} />

        {/* Connecting lines */}
        {lines.map((line, i) => (
          <ConnectingLine key={`line-${i}`} {...line} />
        ))}

        {/* Floating shapes */}
        {shapes.map((shape, i) => (
          <FloatingShape key={`shape-${i}`} {...shape} />
        ))}

        {/* Particles */}
        {particles.map((particle, i) => (
          <Particle key={`particle-${i}`} {...particle} />
        ))}
      </svg>
    </div>
  );
}
