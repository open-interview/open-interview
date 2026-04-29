import React from 'react';

interface CircleAccentProps {
  className?: string;
  color?: string;
  size?: number;
  rings?: number;
  style?: React.CSSProperties;
}

export default function CircleAccent({ 
  className = '', 
  color = '#4285F4',
  size = 300,
  rings = 3,
  style 
}: CircleAccentProps) {
  return (
    <div 
      className={`absolute pointer-events-none ${className}`}
      style={{ 
        width: size, 
        height: size,
        animation: 'pulse 4s ease-in-out infinite',
        ...style 
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 300 300">
        {Array.from({ length: rings }, (_, i) => {
          const radius = (size / 2) - (i * 40);
          const opacity = 0.3 - (i * 0.08);
          return (
            <circle
              key={i}
              cx="150"
              cy="150"
              r={radius / 2}
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              opacity={opacity}
            >
              <animateTransform 
                attributeName="transform" 
                type="rotate" 
                from={`0 150 150`} 
                to={`${360} 150 150`} 
                dur={`${30 + i * 10}s`} 
                repeatCount="indefinite" 
              />
            </circle>
          );
        })}
      </svg>
    </div>
  );
}
