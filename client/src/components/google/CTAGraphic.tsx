/**
 * CTAGraphic - Call-to-action SVG decoration
 * Features: arrow/pointer element, radiating shapes, glow effect
 */
import React from 'react';
import { GoogleColors } from '../../pages/HomeGoogle';

interface CTAGraphicProps {
  className?: string;
}

function RadiatingRing({ 
  x, y, delay = 0 
}: { 
  x: number; 
  y: number; 
  delay?: number;
}) {
  return (
    <circle 
      cx={x} 
      cy={y} 
      r={20}
      fill="none"
      stroke={GoogleColors.blue}
      strokeWidth={1}
      strokeOpacity={0.3}
      className="animate-radiate"
      style={{ animationDelay: `${delay}s` }}
    />
  );
}

function GlowOrb({ 
  x, y, size, color, delay = 0 
}: { 
  x: number; 
  y: number; 
  size: number; 
  color: string; 
  delay?: number;
}) {
  return (
    <circle 
      cx={x} 
      cy={y} 
      r={size}
      fill={color}
      fillOpacity={0.15}
      className="animate-pulse-slow"
      style={{ animationDelay: `${delay}s` }}
      filter="url(#glow)"
    />
  );
}

function ArrowPointer({ x, y, color, delay = 0 }: {
  x: number; y: number; color: string; delay?: number;
}) {
  return (
    <g 
      className="animate-float" 
      style={{ animationDelay: `${delay}s` }}
      transform={`translate(${x}, ${y})`}
    >
      {/* Arrow body */}
      <line 
        x1={-20} y1={0} x2={20} y2={0}
        stroke={color}
        strokeWidth={2}
        strokeOpacity={0.4}
        strokeLinecap="round"
      />
      {/* Arrow head */}
      <polygon 
        points="20,0 12,-5 12,5"
        fill={color}
        fillOpacity={0.5}
      />
      {/* Glow dot at start */}
      <circle cx={-20} cy={0} r={3} fill={color} fillOpacity={0.6} />
    </g>
  );
}

function SmallDot({ x, y, color, delay = 0 }: {
  x: number; y: number; color: string; delay?: number;
}) {
  return (
    <circle 
      cx={x} 
      cy={y} 
      r={2}
      fill={color}
      fillOpacity={0.4}
      className="animate-pulse-slow"
      style={{ animationDelay: `${delay}s` }}
    />
  );
}

export default function CTAGraphic({ className = '' }: CTAGraphicProps) {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 400 200" 
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
      >
        <defs>
          <radialGradient id="cta-glow-center" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={GoogleColors.blue} stopOpacity={0.2} />
            <stop offset="50%" stopColor={GoogleColors.green} stopOpacity={0.1} />
            <stop offset="100%" stopColor={GoogleColors.blue} stopOpacity={0} />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Central glow */}
        <ellipse cx="200" cy="100" rx="150" ry="60" fill="url(#cta-glow-center)" className="animate-morph" />

        {/* Radiating rings */}
        <RadiatingRing x={200} y={100} delay={0} />
        <RadiatingRing x={200} y={100} delay={1} />
        <RadiatingRing x={200} y={100} delay={2} />

        {/* Glow orbs */}
        <GlowOrb x={120} y={60} size={30} color={GoogleColors.blue} delay={0} />
        <GlowOrb x={280} y={80} size={25} color={GoogleColors.red} delay={0.5} />
        <GlowOrb x={160} y={140} size={20} color={GoogleColors.yellow} delay={1} />
        <GlowOrb x={240} y={120} size={28} color={GoogleColors.green} delay={1.5} />

        {/* Arrow pointers */}
        <ArrowPointer x={100} y={100} color={GoogleColors.blue} delay={0} />
        <ArrowPointer x={300} y={100} color={GoogleColors.green} delay={0.5} />

        {/* Small decorative dots */}
        <SmallDot x={80} y={50} color={GoogleColors.yellow} delay={0} />
        <SmallDot x={320} y={60} color={GoogleColors.red} delay={0.3} />
        <SmallDot x={150} y={160} color={GoogleColors.blue} delay={0.6} />
        <SmallDot x={250} y={150} color={GoogleColors.green} delay={0.9} />
        <SmallDot x={200} y={40} color={GoogleColors.yellow} delay={1.2} />
        <SmallDot x={180} y={170} color={GoogleColors.red} delay={1.5} />

        {/* Decorative plus signs */}
        <g fillOpacity={0.15} className="animate-float-slow">
          <line x1={60} y1={100} x2={80} y2={100} stroke={GoogleColors.blue} strokeWidth={1.5} />
          <line x1={70} y1={90} x2={70} y2={110} stroke={GoogleColors.blue} strokeWidth={1.5} />
          
          <line x1={320} y1={140} x2={340} y2={140} stroke={GoogleColors.green} strokeWidth={1.5} />
          <line x1={330} y1={130} x2={330} y2={150} stroke={GoogleColors.green} strokeWidth={1.5} />
        </g>
      </svg>
    </div>
  );
}
