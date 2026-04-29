import React from "react";

interface RetryIconProps {
  width?: number;
  height?: number;
  className?: string;
}

export function RetryIcon({ width = 48, height = 48, className = "" }: RetryIconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      className={`retry-icon ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M23 4V10H17"
        stroke="#EA4335"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20.49 15A9 9 0 0 1 5.64 6.36L1 10M23 14L18.36 18.64A9 9 0 0 1 3.51 15"
        stroke="#EA4335"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="10" stroke="#FBBC04" strokeWidth="1" fill="none" />
    </svg>
  );
}
