import React from 'react'

interface WaveDividerProps {
  width?: string
  height?: number
  colors?: string[]
  position?: 'top' | 'bottom'
  animated?: boolean
  className?: string
}

const GoogleColors = ['#4285F4', '#EA4335', '#FBBC04', '#34A853']

export default function WaveDivider({
  width = '100%',
  height = 80,
  colors = GoogleColors,
  position = 'bottom',
  animated = false,
  className = ''
}: WaveDividerProps) {
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
        {colors.map((color, i) => (
          <path
            key={i}
            d="M0,60 C200,120 400,0 600,60 C800,120 1000,0 1200,60 L1200,120 L0,120 Z"
            fill={color}
            fillOpacity={0.7 - i * 0.15}
            style={
              animated
                ? {
                    animation: `waveSlide 3s ease-in-out ${i * 0.3}s infinite alternate`,
                    transformOrigin: 'center'
                  }
                : undefined
            }
          />
        ))}
      </svg>
      {animated && (
        <style>{`
          @keyframes waveSlide {
            0% { transform: translateX(0); }
            100% { transform: translateX(-30px); }
          }
        `}</style>
      )}
    </div>
  )
}
