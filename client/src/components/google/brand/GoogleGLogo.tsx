import React from 'react';

interface GoogleGLogoProps {
  size?: number | string;
  className?: string;
  ariaLabel?: string;
}

const GoogleGLogo: React.FC<GoogleGLogoProps> = ({
  size = 40,
  className = '',
  ariaLabel = 'Google G logo'
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={ariaLabel}
    >
      <title>Google G Logo</title>
      <desc>Google G logo with gradient colors</desc>
      <defs>
        <linearGradient id="googleG" x1="20" y1="0" x2="20" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4285F4" />
          <stop offset="25%" stopColor="#EA4335" />
          <stop offset="50%" stopColor="#FBBC04" />
          <stop offset="75%" stopColor="#34A853" />
          <stop offset="100%" stopColor="#4285F4" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="18" stroke="url(#googleG)" strokeWidth="4" fill="none" />
      <path
        d="M20 2 A18 18 0 0 1 38 20 L20 20 Z"
        fill="#4285F4"
      />
    </svg>
  );
};

export default GoogleGLogo;
