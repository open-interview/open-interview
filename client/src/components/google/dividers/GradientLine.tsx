import React from 'react'

interface GradientLineProps {
  width?: string
  height?: number
  colors?: string[]
  position?: 'top' | 'bottom'
  animated?: boolean
  className?: string
}

const GoogleColors = ['#4285F4', '#EA4335', '#FBBC04', '#34A853']

export default function GradientLine({
  width = '100%',
  height = 8,
  colors = GoogleColors,
  position = 'bottom',
  animated = false,
  className = ''
}: GradientLineProps) {
  const transform = position === 'top' ? 'rotate(180deg)' : undefined

  return (
    <div
      className={`w-full overflow-hidden ${className}`}
      style={{ width, height, transform }}
    >
      <svg
        viewBox="0 0 1200 8"
        preserveAspectRatio="none"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="gradientLine" x1="0%" y1="0%" x2="100%" y2="0%">
            {colors.map((color, i) => (
              <stop
                key={i}
                offset={`${(i / (colors.length - 1)) * 100}%`}
                stopColor={color}
              />
            ))}
          </linearGradient>
        </defs>
        <rect
          x="0"
          y="0"
          width="1200"
          height="8"
          fill="url(#gradientLine)"
          style={
            animated
              ? {
                  animation: 'gradientShift 3s ease-in-out infinite'
                }
              : undefined
          }
        />
      </svg>
      {animated && (
        <style>{`
          @keyframes gradientShift {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }
        `}</style>
      )}
    </div>
  )
}
