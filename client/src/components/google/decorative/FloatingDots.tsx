import React from 'react';

interface FloatingDotsProps {
  className?: string;
  colors?: string[];
  count?: number;
  style?: React.CSSProperties;
}

export default function FloatingDots({ 
  className = '', 
  colors = ['#4285F4', '#EA4335', '#FBBC04', '#34A853'],
  count = 20,
  style 
}: FloatingDotsProps) {
  const dots = Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: 4 + Math.random() * 8,
    color: colors[i % colors.length],
    delay: Math.random() * 5,
    duration: 3 + Math.random() * 4,
  }));

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} style={style}>
      {dots.map(dot => (
        <div
          key={dot.id}
          style={{
            position: 'absolute',
            left: dot.left,
            top: dot.top,
            width: dot.size,
            height: dot.size,
            backgroundColor: dot.color,
            borderRadius: '50%',
            opacity: 0.4,
            animation: `float ${dot.duration}s ease-in-out ${dot.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
