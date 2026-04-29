import React from "react";

interface PersonalizedLearningIllustrationProps {
  className?: string;
}

export const PersonalizedLearningIllustration: React.FC<PersonalizedLearningIllustrationProps> = ({
  className = "",
}) => {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`feature-illustration ${className}`}
    >
      <defs>
        <linearGradient id="bookGrad" x1="60" y1="60" x2="140" y2="140">
          <stop stopColor="#4285F4" />
          <stop offset="1" stopColor="#34A853" />
        </linearGradient>
      </defs>

      {/* Background circle */}
      <circle cx="100" cy="100" r="80" fill="#4285F4" fillOpacity="0.05" />

      {/* Open book */}
      <g transform="translate(50, 60)">
        {/* Book base */}
        <path
          d="M10 30C10 20 30 10 50 10C70 10 90 20 90 30L90 70C90 80 70 90 50 90C30 90 10 80 10 70Z"
          fill="#4285F4"
          fillOpacity="0.1"
          stroke="#4285F4"
          strokeWidth="2"
        />

        {/* Left page */}
        <path
          d="M10 30C10 20 30 10 50 10C70 10 90 20 90 30"
          stroke="#4285F4"
          strokeWidth="2"
          fill="none"
        />

        {/* Text lines on left page */}
        <line x1="25" y1="40" x2="55" y2="40" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" />
        <line x1="25" y1="48" x2="50" y2="48" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" />
        <line x1="25" y1="56" x2="55" y2="56" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" />
        <line x1="25" y1="64" x2="45" y2="64" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" />

        {/* Personalization dots */}
        <circle cx="35" cy="35" r="3" fill="#EA4335" className="pulse-dot">
          <animate attributeName="r" values="3;4;3" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="55" cy="45" r="2.5" fill="#FBBC05" className="pulse-dot">
          <animate attributeName="r" values="2.5;3.5;2.5" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="40" cy="60" r="2" fill="#34A853" className="pulse-dot">
          <animate attributeName="r" values="2;3;2" dur="3s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* Brain/lightbulb icon */}
      <circle cx="150" cy="70" r="25" fill="#FBBC05" fillOpacity="0.15" />
      <path
        d="M140 65C140 60 144 58 148 58C152 58 156 60 156 65C156 68 154 70 150 72V76"
        stroke="#FBBC05"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <line x1="146" y1="78" x2="154" y2="78" stroke="#FBBC05" strokeWidth="2" strokeLinecap="round" />
      <line x1="146" y1="81" x2="154" y2="81" stroke="#FBBC05" strokeWidth="2" strokeLinecap="round" />

      {/* Path/flow lines */}
      <path
        d="M100 140C110 150 120 155 130 150C140 145 145 140 150 145"
        stroke="#34A853"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        strokeDasharray="4 4"
        className="dash-flow"
      />
    </svg>
  );
};
