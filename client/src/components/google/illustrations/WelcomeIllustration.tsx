import React from "react";

interface WelcomeIllustrationProps {
  className?: string;
}

export const WelcomeIllustration: React.FC<WelcomeIllustrationProps> = ({
  className = "",
}) => {
  return (
    <svg
      viewBox="0 0 300 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`welcome-illustration ${className}`}
    >
      <defs>
        <linearGradient
          id="welcomeBg"
          x1="0"
          y1="0"
          x2="300"
          y2="300"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#4285F4" stopOpacity="0.1" />
          <stop offset="50%" stopColor="#34A853" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#FBBC05" stopOpacity="0.06" />
        </linearGradient>
        <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#4285F4" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#4285F4" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Background glow */}
      <circle cx="150" cy="150" r="140" fill="url(#welcomeBg)" />

      {/* Abstract floating shapes */}
      <circle cx="80" cy="80" r="40" fill="#4285F4" fillOpacity="0.08" className="float-slow" />
      <circle cx="230" cy="100" r="35" fill="#EA4335" fillOpacity="0.08" className="float-medium" />
      <circle cx="100" cy="220" r="45" fill="#FBBC05" fillOpacity="0.08" className="float-fast" />
      <circle cx="240" cy="220" r="38" fill="#34A853" fillOpacity="0.08" className="float-slow" />

      {/* Center element - stylized person/learning icon */}
      <circle cx="150" cy="150" r="60" fill="url(#centerGlow)" />
      <circle cx="150" cy="150" r="45" fill="#4285F4" fillOpacity="0.15" />

      {/* Abstract book/learning symbol */}
      <path
        d="M120 135C120 125 135 120 150 120C165 120 180 125 180 135"
        stroke="#4285F4"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M130 145H170"
        stroke="#4285F4"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M135 155H165"
        stroke="#4285F4"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M140 165H160"
        stroke="#4285F4"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Floating dots */}
      <circle cx="60" cy="120" r="4" fill="#4285F4" fillOpacity="0.6" className="pulse-dot">
        <animate attributeName="r" values="4;6;4" dur="3s" repeatCount="indefinite" />
        <animate attributeName="fillOpacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="240" cy="160" r="5" fill="#EA4335" fillOpacity="0.6" className="pulse-dot">
        <animate attributeName="r" values="5;7;5" dur="2.5s" repeatCount="indefinite" />
        <animate attributeName="fillOpacity" values="0.6;1;0.6" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="90" cy="200" r="3" fill="#FBBC05" fillOpacity="0.6" className="pulse-dot">
        <animate attributeName="r" values="3;5;3" dur="3.5s" repeatCount="indefinite" />
        <animate attributeName="fillOpacity" values="0.6;1;0.6" dur="3.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="210" cy="80" r="4" fill="#34A853" fillOpacity="0.6" className="pulse-dot">
        <animate attributeName="r" values="4;6;4" dur="2.8s" repeatCount="indefinite" />
        <animate attributeName="fillOpacity" values="0.6;1;0.6" dur="2.8s" repeatCount="indefinite" />
      </circle>
      <circle cx="150" cy="90" r="3" fill="#4285F4" fillOpacity="0.5" className="pulse-dot">
        <animate attributeName="r" values="3;5;3" dur="3.2s" repeatCount="indefinite" />
        <animate attributeName="fillOpacity" values="0.5;0.9;0.5" dur="3.2s" repeatCount="indefinite" />
      </circle>
      <circle cx="180" cy="240" r="4" fill="#EA4335" fillOpacity="0.5" className="pulse-dot">
        <animate attributeName="r" values="4;6;4" dur="2.7s" repeatCount="indefinite" />
        <animate attributeName="fillOpacity" values="0.5;0.9;0.5" dur="2.7s" repeatCount="indefinite" />
      </circle>

      {/* Connection lines */}
      <line x1="64" y1="120" x2="90" y2="135" stroke="#4285F4" strokeWidth="1" strokeOpacity="0.2" />
      <line x1="240" y1="160" x2="210" y2="150" stroke="#EA4335" strokeWidth="1" strokeOpacity="0.2" />
      <line x1="90" y1="200" x2="120" y2="170" stroke="#FBBC05" strokeWidth="1" strokeOpacity="0.2" />
      <line x1="210" y1="80" x2="180" y2="110" stroke="#34A853" strokeWidth="1" strokeOpacity="0.2" />
    </svg>
  );
};
