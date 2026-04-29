import React from 'react';
import type { CSSProperties } from 'react';
import './BackgroundDots.css';

interface DotConfig {
  top: string;
  left: string;
  size: number;
  color: string;
  opacity: number;
  speed: number;
  delay: number;
}

interface BackgroundDotsProps {
  count?: number;
  speed?: number;
  direction?: 'normal' | 'reverse';
  dotSize?: number;
  colors?: string[];
  className?: string;
}

const googleColors = ['#4285F4', '#EA4335', '#FBBC04', '#34A853'];

const generateDots = (
  count: number,
  speed: number,
  dotSize: number,
  colors: string[]
): DotConfig[] => {
  return Array.from({ length: count }, () => ({
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: Math.random() * dotSize + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    opacity: Math.random() * 0.2 + 0.05,
    speed: speed + Math.random() * 10,
    delay: Math.random() * 10,
  }));
};

const BackgroundDots: React.FC<BackgroundDotsProps> = ({
  count = 30,
  speed = 15,
  direction = 'normal',
  dotSize = 8,
  colors = googleColors,
  className = '',
}) => {
  const dots = generateDots(count, speed, dotSize, colors);

  return (
    <div className={`background-dots ${className}`}>
      {dots.map((dot, index) => (
        <div
          key={index}
          className="dot"
          style={{
            '--speed': `${dot.speed}s`,
            '--delay': `${dot.delay}s`,
            '--direction': direction,
            top: dot.top,
            left: dot.left,
            width: `${dot.size}px`,
            height: `${dot.size}px`,
            backgroundColor: dot.color,
            opacity: dot.opacity,
          } as CSSProperties}
        />
      ))}
    </div>
  );
};

export default BackgroundDots;
