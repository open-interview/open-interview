import React from 'react';

export default function BadgeIllustration() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path d="M100 50L150 75V125L100 150L50 125V75Z" stroke="#4285F4" strokeWidth="3" fill="#4285F410" strokeLinejoin="round">
        <animate attributeName="stroke-width" values="3;3.5;3" dur="3s" repeatCount="indefinite" />
      </path>
      <path d="M100 80L110 105L135 105L115 120L125 145L100 130L75 145L85 120L65 105L90 105Z" fill="#FBBC0520" stroke="#FBBC05" strokeWidth="2" strokeLinejoin="round">
        <animate attributeName="opacity" values="1;0.8;1" dur="2s" repeatCount="indefinite" />
      </path>
      <circle cx="100" cy="100" r="35" stroke="#34A853" strokeWidth="1" fill="none" opacity="0.3" />
      <circle cx="100" cy="100" r="28" stroke="#EA4335" strokeWidth="1" fill="none" opacity="0.3" />
    </svg>
  );
}
