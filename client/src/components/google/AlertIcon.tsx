import React from "react";

interface AlertIconProps {
  width?: number;
  height?: number;
  className?: string;
}

export function AlertIcon({ width = 48, height = 48, className = "" }: AlertIconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      className={`alert-icon ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2L22 22H2L12 2Z"
        stroke="#EA4335"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="12" y1="8" x2="12" y2="13" stroke="#EA4335" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="15" x2="12.01" y2="15" stroke="#EA4335" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
