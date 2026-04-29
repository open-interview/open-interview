import React, { SVGProps } from 'react';

interface LogoMarkProps {
  size?: number | string;
  className?: string;
  ariaLabel?: string;
  variant?: 'light' | 'dark';
}

const LogoMark: React.FC<LogoMarkProps> = ({
  size = 40,
  className = '',
  ariaLabel = 'Google custom logo mark',
  variant = 'light'
}) => {
  const bgColor = variant === 'dark' ? '#202124' : '#FFFFFF';
  const textColor = variant === 'dark' ? '#FFFFFF' : '#202124';

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
      <title>Google Custom Logo Mark</title>
      <desc>Custom logo combining Google brand elements with {variant} mode support</desc>
      <rect x="2" y="2" width="36" height="36" rx="10" fill={bgColor} />
      <circle cx="20" cy="20" r="12" stroke="#4285F4" strokeWidth="3" fill="none" />
      <circle cx="14" cy="20" r="3" fill="#EA4335" />
      <circle cx="20" cy="17" r="3" fill="#FBBC04" />
      <circle cx="26" cy="20" r="3" fill="#34A853" />
      <circle cx="20" cy="23" r="3" fill="#4285F4" />
    </svg>
  );
};

export default LogoMark;
