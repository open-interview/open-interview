import React from 'react';
import type { CSSProperties } from 'react';
import './FloatingShape.css';

export type ShapeType = 'circle' | 'square' | 'triangle' | 'star' | 'hexagon';

export interface FloatingShapeProps {
  type: ShapeType;
  color?: string;
  size?: number;
  speed?: number;
  delay?: number;
  opacity?: number;
  direction?: 'normal' | 'reverse';
  style?: React.CSSProperties;
}

const colors = {
  blue: '#4285F4',
  red: '#EA4335',
  yellow: '#FBBC04',
  green: '#34A853',
};

const getRandomPosition = () => ({
  top: `${Math.random() * 100}%`,
  left: `${Math.random() * 100}%`,
});

const FloatingShape: React.FC<FloatingShapeProps> = ({
  type,
  color = colors.blue,
  size = 40,
  speed = 20,
  delay,
  opacity = 0.15,
  direction = 'normal',
  style,
}) => {
  const randomPos = getRandomPosition();
  const shapeStyle = {
    '--speed': `${speed}s`,
    '--delay': `${delay ?? Math.random() * 10}s`,
    '--opacity': opacity,
    '--color': color,
    '--size': `${size}px`,
    width: type === 'triangle' ? 'auto' : `${size}px`,
    height: `${size}px`,
    top: randomPos.top,
    left: randomPos.left,
    animationDirection: direction,
    ...style,
  } as React.CSSProperties;

  return <div className={`floating-shape ${type}`} style={shapeStyle} />;
};

export default FloatingShape;
