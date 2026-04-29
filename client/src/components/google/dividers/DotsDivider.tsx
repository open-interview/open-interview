import React from 'react'

interface DotsDividerProps {
  width?: string
  height?: number
  color?: string
  position?: 'top' | 'bottom'
  animated?: boolean
  dotSize?: number
  spacing?: number
  className?: string
}

export default function DotsDivider({
  width = '100%',
  height = 30,
  color = '#FBBC04',
  position = 'bottom',
  animated = false,
  dotSize = 4,
  spacing = 20,
  className = ''
}: DotsDividerProps) {
  const transform = position === 'top' ? 'rotate(180deg)' : undefined
  const dots = Math.floor(1200 / spacing)

  return (
    <div
      className={`w-full overflow-hidden ${className}`}
      style={{ width, height, transform }}
    >
      <svg
        viewBox="0 0 1200 30"
        preserveAspectRatio="none"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        {Array.from({ length: dots }).map((_, i) => (
          <circle
            key={i}
            cx={i * spacing + spacing / 2}
            cy="15"
            r={dotSize}
            fill={color}
            style={
              animated
                ? {
                    animation: `dotPulse 1.5s ease-in-out ${i * 0.1}s infinite alternate`
                  }
                : undefined
            }
          />
        ))}
      </svg>
      {animated && (
        <style>{`
          @keyframes dotPulse {
            0% { r: ${dotSize}; opacity: 0.4; }
            100% { r: ${dotSize * 1.5}; opacity: 1; }
          }
        `}</style>
      )}
    </div>
  )
}
