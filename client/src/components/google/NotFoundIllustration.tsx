import React from "react";

interface NotFoundIllustrationProps {
  width?: number;
  height?: number;
  className?: string;
}

export function NotFoundIllustration({ width = 64, height = 64, className = "" }: NotFoundIllustrationProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      className={`not-found-illustration ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="2" y="6" width="4" height="12" rx="1" stroke="#EA4335" strokeWidth="2" />
      <line x1="2" y1="12" x2="6" y2="12" stroke="#EA4335" strokeWidth="2" />
      <circle cx="12" cy="12" r="6" stroke="#FBBC04" strokeWidth="2" />
      <rect x="18" y="6" width="4" height="12" rx="1" stroke="#EA4335" strokeWidth="2" />
      <line x1="18" y1="12" x2="22" y2="12" stroke="#EA4335" strokeWidth="2" />
    </svg>
  );
}
