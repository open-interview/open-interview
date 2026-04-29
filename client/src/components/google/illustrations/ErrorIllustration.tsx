import React from 'react';

export default function ErrorIllustration() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path d="M100 50L150 150H50Z" stroke="#EA4335" strokeWidth="3" fill="#EA433510" strokeLinejoin="round">
        <animate attributeName="opacity" values="1;0.8;1" dur="2s" repeatCount="indefinite" />
      </path>
      <line x1="100" y1="85" x2="100" y2="120" stroke="#EA4335" strokeWidth="3" strokeLinecap="round" />
      <circle cx="100" cy="135" r="3" fill="#EA4335" />
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <circle
          key={i}
          cx={100 + 60 * Math.cos(angle * Math.PI / 180)}
          cy={100 + 60 * Math.sin(angle * Math.PI / 180)}
          r="3"
          fill="#EA4335"
          opacity="0.4"
        >
          <animate attributeName="opacity" values="0.4;0.7;0.4" dur="2s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}
