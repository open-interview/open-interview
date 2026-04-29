import React from 'react';
import type { CSSProperties } from 'react';
import './ParticleField.css';

interface ParticleConfig {
  top: string;
  left: string;
  size: number;
  color: string;
  speed: number;
  delay: number;
  startOpacity: number;
  endOpacity: number;
}

interface ParticleFieldProps {
  count?: number;
  speed?: number;
  direction?: 'normal' | 'reverse';
  particleSize?: number;
  colors?: string[];
  className?: string;
}

const googleColors = ['#4285F4', '#EA4335', '#FBBC04', '#34A853'];

const generateParticles = (
  count: number,
  speed: number,
  particleSize: number,
  colors: string[]
): ParticleConfig[] => {
  return Array.from({ length: count }, () => ({
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: Math.random() * particleSize + 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    speed: speed + Math.random() * 20,
    delay: Math.random() * 15,
    startOpacity: Math.random() * 0.3 + 0.1,
    endOpacity: Math.random() * 0.2 + 0.05,
  }));
};

const ParticleField: React.FC<ParticleFieldProps> = ({
  count = 50,
  speed = 30,
  direction = 'normal',
  particleSize = 6,
  colors = googleColors,
  className = '',
}) => {
  const particles = generateParticles(count, speed, particleSize, colors);

  return (
    <div className={`particle-field ${className}`}>
      {particles.map((particle, index) => (
        <div
          key={index}
          className="particle"
          style={{
            '--speed': `${particle.speed}s`,
            '--delay': `${particle.delay}s`,
            '--direction': direction,
            '--start-opacity': particle.startOpacity,
            '--end-opacity': particle.endOpacity,
            top: particle.top,
            left: particle.left,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
          } as CSSProperties}
        />
      ))}
    </div>
  );
};

export default ParticleField;
