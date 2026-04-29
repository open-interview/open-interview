import React from 'react'

interface AbstractDividerProps {
  width?: string
  height?: number
  colors?: string[]
  position?: 'top' | 'bottom'
  animated?: boolean
  className?: string
}

const GoogleColors = ['#4285F4', '#EA4335', '#FBBC04', '#34A853']

export default function AbstractDivider({
  width = '100%',
  height = 100,
  colors = GoogleColors,
  position = 'bottom',
  animated = false,
  className = ''
}: AbstractDividerProps) {
  const transform = position === 'top' ? 'rotate(180deg)' : undefined

  return (
    <div
      className={`w-full overflow-hidden ${className}`}
      style={{ width, height, transform }}
    >
      <svg
        viewBox="0 0 1200 100"
        preserveAspectRatio="none"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="0" y="0" width="1200" height="100" fill="none" />
        <circle cx="200" cy="50" r="40" fill={colors[0]} fillOpacity="0.3" style={animated ? { animation: 'abstractFloat 4s ease-in-out infinite' } : undefined} />
        <rect x="500" y="20" width="80" height="80" fill={colors[1]} fillOpacity="0.3" transform="rotate(45 540 60)" style={animated ? { animation: 'abstractFloat 4s ease-in-out 1s infinite' } : undefined} />
        <polygon points="900,20 960,80 840,80" fill={colors[2]} fillOpacity="0.3" style={animated ? { animation: 'abstractFloat 4s ease-in-out 2s infinite' } : undefined} />
        <circle cx="1050" cy="50" r="30" fill={colors[3]} fillOpacity="0.3" style={animated ? { animation: 'abstractFloat 4s ease-in-out 3s infinite' } : undefined} />
      </svg>
      {animated && (
        <style>{`
          @keyframes abstractFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
        `}</style>
      )}
    </div>
  )
}
