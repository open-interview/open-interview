import React from 'react';

export default function SuccessIllustration() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="100" cy="100" r="50" stroke="#34A853" strokeWidth="3" fill="#34A85310">
        <animate attributeName="r" values="50;52;50" dur="3s" repeatCount="indefinite" />
      </circle>
      <path d="M80 100L95 115L125 85" stroke="#34A853" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <animate attributeName="stroke-dasharray" values="0,100;100,0" dur="1s" fill="freeze" />
      </path>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <line
          key={i}
          x1="100"
          y1="100"
          x2={100 + 70 * Math.cos(angle * Math.PI / 180)}
          y2={100 + 70 * Math.sin(angle * Math.PI / 180)}
          stroke="#34A853"
          strokeWidth="1"
          opacity="0.3"
        >
          <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
        </line>
      ))}
    </svg>
  );
}
