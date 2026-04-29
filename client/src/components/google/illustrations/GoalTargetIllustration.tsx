import React from "react";

interface GoalTargetIllustrationProps {
  className?: string;
}

export const GoalTargetIllustration: React.FC<GoalTargetIllustrationProps> = ({
  className = "",
}) => {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`goal-illustration ${className}`}
    >
      <defs>
        <linearGradient id="targetGrad" x1="60" y1="60" x2="140" y2="140">
          <stop stopColor="#4285F4" />
          <stop offset="1" stopColor="#34A853" />
        </linearGradient>
      </defs>

      {/* Background */}
      <circle cx="100" cy="100" r="90" fill="#4285F4" fillOpacity="0.03" />

      {/* Target/Bullseye */}
      <g transform="translate(50, 50)">
        {/* Outer ring */}
        <circle cx="50" cy="50" r="45" fill="none" stroke="url(#targetGrad)" strokeWidth="3" />

        {/* Middle ring */}
        <circle cx="50" cy="50" r="32" fill="none" stroke="#4285F4" strokeWidth="2.5" />

        {/* Inner ring */}
        <circle cx="50" cy="50" r="20" fill="none" stroke="#34A853" strokeWidth="2" />

        {/* Bullseye center */}
        <circle cx="50" cy="50" r="10" fill="#4285F4" fillOpacity="0.2" />
        <circle cx="50" cy="50" r="5" fill="#4285F4" />

        {/* Animated hit marker */}
        <circle cx="50" cy="50" r="8" fill="none" stroke="#EA4335" strokeWidth="2" strokeOpacity="0.8" className="pulse-dot">
          <animate attributeName="r" values="8;12;8" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="strokeOpacity" values="0.8;0.2;0.8" dur="1.5s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* Arrow hitting target */}
      <path
        d="M30 105L85 95L100 80"
        stroke="#EA4335"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M85 95L80 88L92 90Z"
        fill="#EA4335"
      />

      {/* Goal flags */}
      <g transform="translate(140, 40)">
        <rect x="0" y="0" width="3" height="40" fill="#FBBC05" rx="1" />
        <path d="M3 0L25 8L3 16Z" fill="#FBBC05" />
        <text x="13" y="10" textAnchor="middle" fontSize="6" fill="white" fontWeight="bold">1</text>
      </g>

      <g transform="translate(150, 70)">
        <rect x="0" y="0" width="3" height="40" fill="#4285F4" rx="1" />
        <path d="M3 0L25 8L3 16Z" fill="#4285F4" />
        <text x="13" y="10" textAnchor="middle" fontSize="6" fill="white" fontWeight="bold">2</text>
      </g>

      <g transform="translate(145, 100)">
        <rect x="0" y="0" width="3" height="40" fill="#34A853" rx="1" />
        <path d="M3 0L25 8L3 16Z" fill="#34A853" />
        <text x="13" y="10" textAnchor="middle" fontSize="6" fill="white" fontWeight="bold">3</text>
      </g>

      {/* Progress steps */}
      <circle cx="40" cy="170" r="6" fill="#4285F4" fillOpacity="0.3" />
      <line x1="46" y1="170" x2="60" y2="170" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" />
      <circle cx="66" cy="170" r="6" fill="#4285F4" fillOpacity="0.5" />
      <line x1="72" y1="170" x2="86" y2="170" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" />
      <circle cx="92" cy="170" r="6" fill="#4285F4" fillOpacity="0.7" />
      <line x1="98" y1="170" x2="112" y2="170" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" />
      <circle cx="118" cy="170" r="6" fill="#4285F4" />
    </svg>
  );
};
