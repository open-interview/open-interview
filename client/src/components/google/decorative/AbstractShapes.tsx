import React from 'react';

interface AbstractShapesProps {
  className?: string;
  colors?: string[];
  style?: React.CSSProperties;
}

export default function AbstractShapes({ 
  className = '', 
  colors = ['#4285F4', '#EA4335', '#FBBC04', '#34A853'],
  style 
}: AbstractShapesProps) {
  const shapes = [
    { type: 'triangle', x: 100, y: 80, size: 40, color: colors[0], rotate: 45 },
    { type: 'circle', x: 200, y: 150, size: 30, color: colors[1], rotate: 0 },
    { type: 'line', x: 50, y: 200, size: 60, color: colors[2], rotate: -30 },
    { type: 'triangle', x: 300, y: 100, size: 35, color: colors[3], rotate: 120 },
    { type: 'circle', x: 150, y: 250, size: 25, color: colors[0], rotate: 0 },
  ];

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} style={style}>
      <svg width="100%" height="100%" viewBox="0 0 400 400">
        {shapes.map((shape, i) => {
          const delay = i * 0.5;
          if (shape.type === 'triangle') {
            return (
              <polygon
                key={i}
                points={`${shape.x},${shape.y - shape.size / 2} ${shape.x + shape.size / 2},${shape.y + shape.size / 2} ${shape.x - shape.size / 2},${shape.y + shape.size / 2}`}
                fill={shape.color}
                opacity="0.2"
                transform={`rotate(${shape.rotate} ${shape.x} ${shape.y})`}
              >
                <animateTransform 
                  attributeName="transform" 
                  type="rotate" 
                  from={`0 ${shape.x} ${shape.y}`} 
                  to={`360 ${shape.x} ${shape.y}`} 
                  dur={`${15 + i * 5}s`} 
                  repeatCount="indefinite" 
                />
              </polygon>
            );
          }
          if (shape.type === 'circle') {
            return (
              <circle
                key={i}
                cx={shape.x}
                cy={shape.y}
                r={shape.size / 2}
                fill={shape.color}
                opacity="0.15"
              >
                <animate 
                  attributeName="r" 
                  values={`${shape.size / 2};${shape.size / 2 * 1.2};${shape.size / 2}`} 
                  dur={`${3 + i}s`} 
                  repeatCount="indefinite" 
                />
              </circle>
            );
          }
          return (
            <line
              key={i}
              x1={shape.x}
              y1={shape.y}
              x2={shape.x + shape.size}
              y2={shape.y}
              stroke={shape.color}
              strokeWidth="2"
              opacity="0.2"
              transform={`rotate(${shape.rotate} ${shape.x} ${shape.y})`}
            >
              <animateTransform 
                attributeName="transform" 
                type="rotate" 
                from={`${shape.rotate} ${shape.x} ${shape.y}`} 
                to={`${shape.rotate + 360} ${shape.x} ${shape.y}`} 
                dur={`${20 + i * 5}s`} 
                repeatCount="indefinite" 
              />
            </line>
          );
        })}
      </svg>
    </div>
  );
}
