import React from 'react'

interface CurveDividerProps {
  width?: string
  height?: number
  color?: string
  position?: 'top' | 'bottom'
  animated?: boolean
  className?: string
}

export default function CurveDivider({
  width = '100%',
  height = 80,
  color = '#4285F4',
  position = 'bottom',
  animated = false,
  className = ''
}: CurveDividerProps) {
  const transform = position === 'top' ? 'rotate(180deg)' : undefined

  return (
    <div
      className={`w-full overflow-hidden ${className}`}
      style={{ width, height, transform }}
    >
      <svg
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z"
          fill={color}
          style={
            animated
              ? {
                  animation: 'curvePulse 2s ease-in-out infinite'
                }
              : undefined
          }
        />
      </svg>
      {animated && (
        <style>{`
          @keyframes curvePulse {
            0%, 100% { d: path("M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z"); }
            50% { d: path("M0,50 C300,110 900,10 1200,50 L1200,120 L0,120 Z"); }
          }
        `}</style>
      )}
    </div>
  )
}
