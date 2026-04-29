import React from 'react';
import FloatingShape from './FloatingShape';
import './FloatingGroup.css';

interface ShapeConfig {
  type: 'circle' | 'square' | 'triangle' | 'star' | 'hexagon';
  color?: string;
  size?: number;
  speed?: number;
  opacity?: number;
}

interface FloatingGroupProps {
  shapes?: ShapeConfig[];
  speed?: number;
  direction?: 'normal' | 'reverse';
  className?: string;
}

const defaultShapes: ShapeConfig[] = [
  { type: 'circle', color: '#4285F4', size: 60, speed: 25, opacity: 0.1 },
  { type: 'square', color: '#EA4335', size: 40, speed: 20, opacity: 0.12 },
  { type: 'triangle', color: '#FBBC04', size: 50, speed: 22, opacity: 0.1 },
  { type: 'star', color: '#34A853', size: 35, speed: 18, opacity: 0.08 },
  { type: 'hexagon', color: '#4285F4', size: 45, speed: 24, opacity: 0.1 },
  { type: 'circle', color: '#EA4335', size: 30, speed: 28, opacity: 0.15 },
  { type: 'triangle', color: '#34A853', size: 55, speed: 21, opacity: 0.09 },
  { type: 'square', color: '#FBBC04', size: 38, speed: 26, opacity: 0.11 },
];

const FloatingGroup: React.FC<FloatingGroupProps> = ({
  shapes = defaultShapes,
  speed,
  direction = 'normal',
  className = '',
}) => {
  return (
    <div className={`floating-group ${className}`}>
      {shapes.map((shape, index) => (
        <FloatingShape
          key={index}
          type={shape.type}
          color={shape.color}
          size={shape.size}
          speed={speed || shape.speed}
          opacity={shape.opacity}
          direction={direction}
        />
      ))}
    </div>
  );
};

export default FloatingGroup;
