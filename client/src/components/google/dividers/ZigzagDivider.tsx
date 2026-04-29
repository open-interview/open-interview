import React from 'react'

interface ZigzagDividerProps {
  width?: string
  height?: number
  color?: string
  position?: 'top' | 'bottom'
  animated?: boolean
  className?: string
}

export default function ZigzagDivider({
  width = '100%',
  height = 40,
  color = '#EA4335',
  position = 'bottom',
  animated = false,
  className = ''
}: ZigzagDividerProps) {
  const transform = position === 'top' ? 'rotate(180deg)' : undefined

  return (
    <div
      className={`w-full overflow-hidden ${className}`}
      style={{ width, height, transform }}
    >
      <svg
        viewBox="0 0 1200 40"
        preserveAspectRatio="none"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        <polyline
          points="0,20 50,0 100,20 150,0 200,20 250,0 300,20 350,0 400,20 450,0 500,20 550,0 600,20 650,0 700,20 750,0 800,20 850,0 900,20 950,0 1000,20 1050,0 1100,20 1150,0 1200,20"
          fill="none"
          stroke={color}
          strokeWidth="3"
          style={
            animated
              ? {
                  animation: 'zigzagDash 2s linear infinite'
                }
              : undefined
          }
        />
      </svg>
      {animated && (
        <style>{`
          @keyframes zigzagDash {
            0% { stroke-dasharray: 0, 1000; stroke-dashoffset: 0; }
            100% { stroke-dasharray: 1000, 0; stroke-dashoffset: -1000; }
          }
        `}</style>
      )}
    </div>
  )
}
