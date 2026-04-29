import React from "react";

interface CelebrationIllustrationProps {
  className?: string;
}

export const CelebrationIllustration: React.FC<CelebrationIllustrationProps> = ({
  className = "",
}) => {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`celebration-illustration ${className}`}
    >
      <defs>
        <linearGradient id="celebGrad" x1="60" y1="60" x2="140" y2="140">
          <stop stopColor="#34A853" />
          <stop offset="1" stopColor="#4285F4" />
        </linearGradient>
      </defs>

      {/* Background glow */}
      <circle cx="100" cy="100" r="80" fill="#34A853" fillOpacity="0.05" />

      {/* Checkmark circle */}
      <circle cx="100" cy="90" r="40" fill="url(#celebGrad)" fillOpacity="0.1" />
      <circle cx="100" cy="90" r="32" fill="white" stroke="#34A853" strokeWidth="3" />

      {/* Animated checkmark */}
      <path
        d="M85 90L95 100L115 80"
        stroke="#34A853"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="check-draw"
      >
        <animate
          attributeName="stroke-dasharray"
          values="0 60; 60 0"
          dur="0.8s"
          fill="freeze"
        />
      </path>

      {/* Confetti pieces */}
      {/* Left side confetti */}
      <rect x="30" y="40" width="6" height="12" rx="1" fill="#4285F4" transform="rotate(-20 33 46)" className="confetti-piece confetti-1">
        <animate attributeName="y" values="40;60;40" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
      </rect>
      <rect x="50" y="30" width="5" height="10" rx="1" fill="#EA4335" transform="rotate(15 52 35)" className="confetti-piece confetti-2">
        <animate attributeName="y" values="30;55;30" dur="2.3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0.4;1" dur="2.3s" repeatCount="indefinite" />
      </rect>
      <circle cx="25" cy="70" r="4" fill="#FBBC05" className="confetti-piece confetti-3">
        <animate attributeName="cy" values="70;85;70" dur="1.8s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0.5;1" dur="1.8s" repeatCount="indefinite" />
      </circle>

      {/* Right side confetti */}
      <rect x="165" y="35" width="6" height="12" rx="1" fill="#34A853" transform="rotate(25 168 41)" className="confetti-piece confetti-4">
        <animate attributeName="y" values="35;58;35" dur="2.1s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0.3;1" dur="2.1s" repeatCount="indefinite" />
      </rect>
      <rect x="145" y="45" width="5" height="10" rx="1" fill="#4285F4" transform="rotate(-10 147 50)" className="confetti-piece confetti-5">
        <animate attributeName="y" values="45;65;45" dur="2.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0.4;1" dur="2.5s" repeatCount="indefinite" />
      </rect>
      <circle cx="170" cy="75" r="4" fill="#EA4335" className="confetti-piece confetti-6">
        <animate attributeName="cy" values="75;90;75" dur="1.9s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0.5;1" dur="1.9s" repeatCount="indefinite" />
      </circle>

      {/* Top confetti */}
      <rect x="90" y="20" width="5" height="10" rx="1" fill="#FBBC05" transform="rotate(30 92 25)" className="confetti-piece confetti-7">
        <animate attributeName="y" values="20;40;20" dur="2.2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0.3;1" dur="2.2s" repeatCount="indefinite" />
      </rect>
      <rect x="110" y="25" width="6" height="12" rx="1" fill="#34A853" transform="rotate(-15 113 31)" className="confetti-piece confetti-8">
        <animate attributeName="y" values="25;45;25" dur="2.4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0.4;1" dur="2.4s" repeatCount="indefinite" />
      </rect>

      {/* Celebration rings */}
      <circle cx="100" cy="90" r="45" fill="none" stroke="#34A853" strokeWidth="1" strokeOpacity="0.3" className="success-ring ring-1">
        <animate attributeName="r" values="45;55;45" dur="2s" repeatCount="indefinite" />
        <animate attributeName="strokeOpacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="100" cy="90" r="50" fill="none" stroke="#4285F4" strokeWidth="1" strokeOpacity="0.2" className="success-ring ring-2">
        <animate attributeName="r" values="50;62;50" dur="2.5s" repeatCount="indefinite" />
        <animate attributeName="strokeOpacity" values="0.2;0;0.2" dur="2.5s" repeatCount="indefinite" />
      </circle>

      {/* Sparkles */}
      <path d="M70 50L72 45L74 50L72 55Z" fill="#FBBC05" fillOpacity="0.7">
        <animate attributeName="fillOpacity" values="0.7;1;0.7" dur="1.5s" repeatCount="indefinite" />
      </path>
      <path d="M130 55L132 50L134 55L132 60Z" fill="#EA4335" fillOpacity="0.7">
        <animate attributeName="fillOpacity" values="0.7;1;0.7" dur="1.8s" repeatCount="indefinite" />
      </path>
      <path d="M100 45L102 40L104 45L102 50Z" fill="#4285F4" fillOpacity="0.7">
        <animate attributeName="fillOpacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
      </path>
    </svg>
  );
};
