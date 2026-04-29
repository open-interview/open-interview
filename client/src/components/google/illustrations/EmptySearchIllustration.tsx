import React from 'react';

export default function EmptySearchIllustration() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="85" cy="85" r="45" stroke="#4285F4" strokeWidth="3" fill="#4285F410">
        <animate attributeName="r" values="45;47;45" dur="3s" repeatCount="indefinite" />
      </circle>
      <line x1="120" y1="120" x2="155" y2="155" stroke="#4285F4" strokeWidth="3" strokeLinecap="round">
        <animate attributeName="stroke-width" values="3;4;3" dur="3s" repeatCount="indefinite" />
      </line>
      <circle cx="60" cy="60" r="4" fill="#EA4335" opacity="0.6">
        <animate attributeName="cy" values="60;55;60" dur="2s" repeatCount="indefinite" />
      </circle>
      <rect x="130" y="50" width="8" height="8" rx="2" fill="#FBBC05" opacity="0.6">
        <animate attributeName="y" values="50;45;50" dur="2.5s" begin="0.5s" repeatCount="indefinite" />
      </rect>
      <circle cx="150" cy="140" r="3" fill="#34A853" opacity="0.6">
        <animate attributeName="cx" values="150;145;150" dur="2s" begin="1s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
