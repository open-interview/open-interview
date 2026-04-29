import React from "react";

interface NetworkErrorIllustrationProps {
  width?: number;
  height?: number;
  className?: string;
}

export function NetworkErrorIllustration({ width = 64, height = 64, className = "" }: NetworkErrorIllustrationProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      className={`network-error-illustration ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 16C4.34315 16 3 14.6569 3 13C3 11.3431 4.34315 10 6 10C6 7.23858 8.23858 5 11 5C12.8565 5 14.6375 6.11875 15.6585 7.5M17 10C18.6569 10 20 11.3431 20 13C20 14.6569 18.6569 16 17 16H7"
        stroke="#EA4335"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="2" y1="2" x2="22" y2="22" stroke="#FBBC04" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
