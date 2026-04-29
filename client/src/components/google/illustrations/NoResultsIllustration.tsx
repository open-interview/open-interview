import React from 'react';

export default function NoResultsIllustration() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="85" cy="85" r="40" stroke="#4285F4" strokeWidth="3" fill="#4285F410">
        <animate attributeName="r" values="40;42;40" dur="3s" repeatCount="indefinite" />
      </circle>
      <line x1="115" y1="115" x2="150" y2="150" stroke="#4285F4" strokeWidth="3" strokeLinecap="round" />
      <text x="75" y="95" fontSize="28" fontWeight="bold" fill="#4285F4" fontFamily="Arial, sans-serif">
        ?
        <animate attributeName="opacity" values="1;0.6;1" dur="2s" repeatCount="indefinite" />
      </text>
      <circle cx="50" cy="60" r="3" fill="#EA4335" opacity="0.5">
        <animate attributeName="cx" values="50;45;50" dur="2s" repeatCount="indefinite" />
      </circle>
      <rect x="140" y="50" width="6" height="6" rx="1" fill="#FBBC05" opacity="0.5">
        <animate attributeName="y" values="50;45;50" dur="2.5s" begin="0.5s" repeatCount="indefinite" />
      </rect>
      <circle cx="160" cy="140" r="2" fill="#34A853" opacity="0.5">
        <animate attributeName="cy" values="140;135;140" dur="2s" begin="1s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
