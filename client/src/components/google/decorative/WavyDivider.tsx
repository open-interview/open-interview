import React from 'react';

interface WavyDividerProps {
  className?: string;
  color?: string;
  height?: number;
  flip?: boolean;
  style?: React.CSSProperties;
}

export default function WavyDivider({ 
  className = '', 
  color = '#4285F4',
  height = 100,
  flip = false,
  style 
}: WavyDividerProps) {
  return (
    <div 
      className={`absolute left-0 right-0 pointer-events-none ${className}`}
      style={{ 
        height, 
        transform: flip ? 'scaleY(-1)' : undefined,
        ...style 
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 1440 100" preserveAspectRatio="none">
        <path 
          d="M0,50 C360,100 720,0 1080,50 C1260,75 1440,25 1440,50 L1440,100 L0,100 Z" 
          fill={color} 
          opacity="0.2"
        >
          <animate 
            attributeName="d" 
            dur="10s" 
            repeatCount="indefinite"
            values="
              M0,50 C360,100 720,0 1080,50 C1260,75 1440,25 1440,50 L1440,100 L0,100 Z;
              M0,50 C360,0 720,100 1080,50 C1260,25 1440,75 1440,50 L1440,100 L0,100 Z;
              M0,50 C360,100 720,0 1080,50 C1260,75 1440,25 1440,50 L1440,100 L0,100 Z
            "
          />
        </path>
      </svg>
    </div>
  );
}
