import React from 'react';
import type { CSSProperties } from 'react';
import './GradientOrb.css';

interface GradientOrbProps {
  size?: number;
  color1?: string;
  color2?: string;
  speed?: number;
  delay?: number;
  opacity?: number;
  direction?: 'normal' | 'reverse';
  style?: React.CSSProperties;
  className?: string;
}

const getRandomPosition = () => ({
  top: `${Math.random() * 80}%`,
  left: `${Math.random() * 80}%`,
});

const GradientOrb: React.FC<GradientOrbProps> = ({
  size = 300,
  color1 = '#4285F4',
  color2 = '#34A853',
  speed = 25,
  delay,
  opacity = 0.3,
  direction = 'normal',
  style,
  className = '',
}) => {
  const randomPos = getRandomPosition();
  const orbStyle = {
    '--speed': `${speed}s`,
    '--delay': `${delay ?? Math.random() * 10}s`,
    '--opacity': opacity,
    '--direction': direction,
    width: `${size}px`,
    height: `${size}px`,
    background: `radial-gradient(circle, ${color1} 0%, ${color2} 100%)`,
    top: randomPos.top,
    left: randomPos.left,
    ...style,
  } as CSSProperties;

  return <div className={`gradient-orb ${className}`} style={orbStyle} />;
};

export default GradientOrb;
