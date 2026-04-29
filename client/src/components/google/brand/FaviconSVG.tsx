import React from 'react';

interface FaviconSVGProps {
  size?: number | string;
  className?: string;
  ariaLabel?: string;
}

const FaviconSVG: React.FC<FaviconSVGProps> = ({
  size = 32,
  className = '',
  ariaLabel = 'Google favicon'
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={ariaLabel}
    >
      <title>Google Favicon</title>
      <desc>Google G favicon for browser tabs</desc>
      <rect x="2" y="2" width="28" height="28" rx="6" fill="white" stroke="#E0E0E0" strokeWidth="1" />
      <text
        x="16"
        y="24"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="20"
        fontWeight="700"
      >
        <tspan fill="#4285F4">G</tspan>
      </text>
    </svg>
  );
};

export default FaviconSVG;
