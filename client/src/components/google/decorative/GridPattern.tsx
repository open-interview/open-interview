import React from 'react';

interface GridPatternProps {
  className?: string;
  color?: string;
  size?: number;
  opacity?: number;
  style?: React.CSSProperties;
}

export default function GridPattern({ 
  className = '', 
  color = '#4285F4',
  size = 20,
  opacity = 0.1,
  style 
}: GridPatternProps) {
  return (
    <div 
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ 
        backgroundImage: `radial-gradient(circle, ${color} 1px, transparent 1px)`,
        backgroundSize: `${size}px ${size}px`,
        opacity,
        ...style 
      }}
    />
  );
}
