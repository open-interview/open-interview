/**
 * FeatureGraphic - Abstract SVG illustration for features section
 * Features: node/network visualization, progress indicators, clean geometric shapes
 */
import React from 'react';
import { GoogleColors } from '../../pages/HomeGoogle';

interface FeatureGraphicProps {
  className?: string;
  variant?: 'left' | 'right' | 'center';
}

function Node({ 
  x, y, size = 8, color, label, delay = 0, progress 
}: { 
  x: number; 
  y: number; 
  size?: number; 
  color: string; 
  label?: string;
  delay?: number;
  progress?: number;
}) {
  return (
    <g className="animate-fade-in" style={{ animationDelay: `${delay}s` }}>
      {/* Outer glow */}
      <circle cx={x} cy={y} r={size + 4} fill={color} fillOpacity={0.1} />
      {/* Main node */}
      <circle cx={x} cy={y} r={size} fill={color} fillOpacity={0.2} />
      {/* Progress arc */}
      {progress !== undefined && (
        <circle 
          cx={x} 
          cy={y} 
          r={size + 6} 
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeOpacity={0.4}
          strokeDasharray={`${progress * 2 * Math.PI * (size + 6)} ${2 * Math.PI * (size + 6)}`}
          transform={`rotate(-90 ${x} ${y})`}
          className="animate-progress"
        />
      )}
      {/* Inner dot */}
      <circle cx={x} cy={y} r={3} fill={color} fillOpacity={0.6} />
      {label && (
        <text 
          x={x} 
          y={y + size + 16} 
          textAnchor="middle" 
          fill={color} 
          fillOpacity={0.5}
          fontSize="8"
          fontFamily="Roboto, sans-serif"
        >
          {label}
        </text>
      )}
    </g>
  );
}

function ConnectionLine({ x1, y1, x2, y2, color }: {
  x1: number; y1: number; x2: number; y2: number; color: string;
}) {
  return (
    <line 
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={color}
      strokeWidth={1}
      strokeOpacity={0.15}
      strokeDasharray="3 3"
    />
  );
}

function GeometricShape({ 
  x, y, size, color, delay = 0, type = 'hexagon' 
}: { 
  x: number; y: number; size: number; color: string; delay?: number;
  type?: 'hexagon' | 'diamond' | 'ring';
}) {
  const style = { animationDelay: `${delay}s` };
  
  if (type === 'hexagon') {
    const points = Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      return `${x + size * Math.cos(angle)},${y + size * Math.sin(angle)}`;
    }).join(' ');
    return (
      <polygon 
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1}
        strokeOpacity={0.2}
        className="animate-float-slow"
        style={style}
      />
    );
  }
  
  if (type === 'diamond') {
    return (
      <rect 
        x={x - size/2} y={y - size/2} width={size} height={size}
        rx={2}
        transform={`rotate(45 ${x} ${y})`}
        fill="none"
        stroke={color}
        strokeWidth={1}
        strokeOpacity={0.2}
        className="animate-float-slow"
        style={style}
      />
    );
  }
  
  return (
    <circle 
      cx={x} cy={y} r={size}
      fill="none"
      stroke={color}
      strokeWidth={1}
      strokeOpacity={0.2}
      className="animate-float-slow"
      style={style}
    />
  );
}

export default function FeatureGraphic({ className = '', variant = 'center' }: FeatureGraphicProps) {
  const isLeft = variant === 'left';
  
  const nodes = isLeft ? [
    { x: 60, y: 80, size: 10, color: GoogleColors.blue, label: 'Learn', delay: 0, progress: 0.8 },
    { x: 140, y: 120, size: 8, color: GoogleColors.red, label: 'Practice', delay: 0.2, progress: 0.6 },
    { x: 100, y: 180, size: 8, color: GoogleColors.green, label: 'Master', delay: 0.4, progress: 0.9 },
    { x: 180, y: 80, size: 6, color: GoogleColors.yellow, label: 'Grow', delay: 0.6, progress: 0.5 },
    { x: 160, y: 220, size: 7, color: GoogleColors.blue, label: 'Succeed', delay: 0.8, progress: 0.7 },
  ] : [
    { x: 180, y: 80, size: 10, color: GoogleColors.green, label: 'Learn', delay: 0, progress: 0.8 },
    { x: 100, y: 120, size: 8, color: GoogleColors.blue, label: 'Practice', delay: 0.2, progress: 0.6 },
    { x: 140, y: 180, size: 8, color: GoogleColors.red, label: 'Master', delay: 0.4, progress: 0.9 },
    { x: 60, y: 80, size: 6, color: GoogleColors.yellow, label: 'Grow', delay: 0.6, progress: 0.5 },
    { x: 80, y: 220, size: 7, color: GoogleColors.green, label: 'Succeed', delay: 0.8, progress: 0.7 },
  ];

  const connections = isLeft ? [
    { x1: 60, y1: 80, x2: 140, y2: 120, color: GoogleColors.blue },
    { x1: 140, y1: 120, x2: 100, y2: 180, color: GoogleColors.red },
    { x1: 100, y1: 180, x2: 180, y2: 80, color: GoogleColors.green },
    { x1: 180, y1: 80, x2: 160, y2: 220, color: GoogleColors.yellow },
    { x1: 140, y1: 120, x2: 160, y2: 220, color: GoogleColors.blue },
  ] : [
    { x1: 180, y1: 80, x2: 100, y2: 120, color: GoogleColors.green },
    { x1: 100, y1: 120, x2: 140, y2: 180, color: GoogleColors.blue },
    { x1: 140, y1: 180, x2: 60, y2: 80, color: GoogleColors.red },
    { x1: 60, y1: 80, x2: 80, y2: 220, color: GoogleColors.yellow },
    { x1: 100, y1: 120, x2: 80, y2: 220, color: GoogleColors.green },
  ];

  const shapes = [
    { x: 120, y: 60, size: 25, color: GoogleColors.blue, type: 'hexagon' as const, delay: 0 },
    { x: 160, y: 200, size: 20, color: GoogleColors.red, type: 'diamond' as const, delay: 1 },
    { x: 80, y: 160, size: 18, color: GoogleColors.yellow, type: 'ring' as const, delay: 2 },
  ];

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      <svg 
        width="100%" 
        height="100%" 
        viewBox={isLeft ? "0 0 240 280" : "0 0 240 280"}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Geometric shapes */}
        {shapes.map((shape, i) => (
          <GeometricShape key={`shape-${i}`} {...shape} />
        ))}

        {/* Connection lines */}
        {connections.map((conn, i) => (
          <ConnectionLine key={`conn-${i}`} {...conn} />
        ))}

        {/* Nodes */}
        {nodes.map((node, i) => (
          <Node key={`node-${i}`} {...node} />
        ))}
      </svg>
    </div>
  );
}
