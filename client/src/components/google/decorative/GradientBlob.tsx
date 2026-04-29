import React from 'react';

interface GradientBlobProps {
  className?: string;
  colors?: [string, string];
  size?: number;
  style?: React.CSSProperties;
}

export default function GradientBlob({ 
  className = '', 
  colors = ['#4285F4', '#9C27B0'],
  size = 500,
  style 
}: GradientBlobProps) {
  return (
    <div 
      className={`absolute pointer-events-none ${className}`}
      style={{ 
        width: size, 
        height: size,
        animation: 'float 8s ease-in-out infinite',
        ...style 
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 500 500" fill="none">
        <defs>
          <linearGradient id="blobGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors[0]} stopOpacity="0.3" />
            <stop offset="100%" stopColor={colors[1]} stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <path 
          d="M421.5 250.5C421.5 348.6 342.6 427.5 244.5 427.5C146.4 427.5 67.5 348.6 67.5 250.5C67.5 152.4 146.4 73.5 244.5 73.5C342.6 73.5 421.5 152.4 421.5 250.5Z" 
          fill="url(#blobGradient)"
          transform="scale(1.2) rotate(15 250 250)"
        >
          <animateTransform 
            attributeName="transform" 
            type="rotate" 
            from="0 250 250" 
            to="360 250 250" 
            dur="20s" 
            repeatCount="indefinite" 
          />
        </path>
      </svg>
    </div>
  );
}
