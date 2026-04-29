import React from 'react';

interface ColoredGDotsProps {
  size?: number | string;
  className?: string;
  ariaLabel?: string;
}

const ColoredGDots: React.FC<ColoredGDotsProps> = ({
  size = 40,
  className = '',
  ariaLabel = 'Google colored dots'
}) => {
  const dotSize = typeof size === 'number' ? size / 5 : 8;
  const gap = dotSize * 0.5;
  const totalWidth = dotSize * 4 + gap * 3;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${totalWidth} ${dotSize}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={ariaLabel}
    >
      <title>Google Brand Dots</title>
      <desc>Four dots in Google brand colors: blue, red, yellow, green</desc>
      <circle cx={dotSize / 2} cy={dotSize / 2} r={dotSize / 2} fill="#4285F4" />
      <circle cx={dotSize * 1.5 + gap} cy={dotSize / 2} r={dotSize / 2} fill="#EA4335" />
      <circle cx={dotSize * 2.5 + gap * 2} cy={dotSize / 2} r={dotSize / 2} fill="#FBBC04" />
      <circle cx={dotSize * 3.5 + gap * 3} cy={dotSize / 2} r={dotSize / 2} fill="#34A853" />
    </svg>
  );
};

export default ColoredGDots;
