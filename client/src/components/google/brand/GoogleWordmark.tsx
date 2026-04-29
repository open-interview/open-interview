import React from 'react';

interface GoogleWordmarkProps {
  width?: number | string;
  height?: number | string;
  className?: string;
  ariaLabel?: string;
}

const GoogleWordmark: React.FC<GoogleWordmarkProps> = ({
  width = 200,
  height = 40,
  className = '',
  ariaLabel = 'Google'
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={ariaLabel}
    >
      <title>{ariaLabel} Wordmark</title>
      <desc>The Google wordmark in official brand colors</desc>
      <text
        fontFamily="Product Sans, Arial, sans-serif"
        fontSize="38"
        fontWeight="700"
        letterSpacing="-1"
      >
        <tspan x="0" y="30" fill="#4285F4">G</tspan>
        <tspan dx="0" fill="#EA4335">o</tspan>
        <tspan dx="0" fill="#FBBC04">o</tspan>
        <tspan dx="0" fill="#4285F4">g</tspan>
        <tspan dx="0" fill="#34A853">l</tspan>
        <tspan dx="0" fill="#EA4335">e</tspan>
      </text>
    </svg>
  );
};

export default GoogleWordmark;
