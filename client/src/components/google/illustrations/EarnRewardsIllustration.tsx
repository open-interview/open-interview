import React from "react";

interface EarnRewardsIllustrationProps {
  className?: string;
}

export const EarnRewardsIllustration: React.FC<EarnRewardsIllustrationProps> = ({
  className = "",
}) => {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`feature-illustration ${className}`}
    >
      {/* Background circle */}
      <circle cx="100" cy="100" r="80" fill="#FBBC05" fillOpacity="0.05" />

      {/* Trophy/star base */}
      <g transform="translate(70, 50)">
        {/* Star */}
        <path
          d="M30 10L37 27L55 27L40 37L45 55L30 45L15 55L20 37L5 27L23 27Z"
          fill="#FBBC05"
          className="pulse-dot"
        >
          <animate attributeName="fillOpacity" values="1;0.7;1" dur="2s" repeatCount="indefinite" />
        </path>

        {/* Badge circle */}
        <circle cx="30" cy="70" r="20" fill="#FBBC05" fillOpacity="0.15" stroke="#FBBC05" strokeWidth="2" />
        <circle cx="30" cy="70" r="12" fill="#FBBC05" fillOpacity="0.3" />
        <text x="30" y="75" textAnchor="middle" fontSize="14" fill="#FBBC05" fontWeight="bold">★</text>
      </g>

      {/* Floating badges */}
      <circle cx="50" cy="50" r="12" fill="#4285F4" fillOpacity="0.15" stroke="#4285F4" strokeWidth="1.5">
        <animate attributeName="cy" values="50;45;50" dur="3s" repeatCount="indefinite" />
      </circle>
      <text x="50" y="54" textAnchor="middle" fontSize="10" fill="#4285F4">1</text>

      <circle cx="150" cy="60" r="12" fill="#EA4335" fillOpacity="0.15" stroke="#EA4335" strokeWidth="1.5">
        <animate attributeName="cy" values="60;55;60" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <text x="150" y="64" textAnchor="middle" fontSize="10" fill="#EA4335">2</text>

      <circle cx="160" cy="140" r="12" fill="#34A853" fillOpacity="0.15" stroke="#34A853" strokeWidth="1.5">
        <animate attributeName="cy" values="140;135;140" dur="3.5s" repeatCount="indefinite" />
      </circle>
      <text x="160" y="144" textAnchor="middle" fontSize="10" fill="#34A853">3</text>

      {/* Progress dots */}
      <circle cx="40" cy="150" r="5" fill="#4285F4" fillOpacity="0.4" className="pulse-dot">
        <animate attributeName="r" values="5;7;5" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="60" cy="160" r="5" fill="#EA4335" fillOpacity="0.4" className="pulse-dot">
        <animate attributeName="r" values="5;7;5" dur="2.3s" repeatCount="indefinite" />
      </circle>
      <circle cx="80" cy="155" r="5" fill="#FBBC05" fillOpacity="0.4" className="pulse-dot">
        <animate attributeName="r" values="5;7;5" dur="2.7s" repeatCount="indefinite" />
      </circle>
      <circle cx="100" cy="165" r="5" fill="#34A853" fillOpacity="0.4" className="pulse-dot">
        <animate attributeName="r" values="5;7;5" dur="3s" repeatCount="indefinite" />
      </circle>

      {/* Sparkle effects */}
      <path d="M45 40L47 35L49 40L47 45Z" fill="#FBBC05" fillOpacity="0.6">
        <animate attributeName="fillOpacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
      </path>
      <path d="M155 45L157 40L159 45L157 50Z" fill="#EA4335" fillOpacity="0.6">
        <animate attributeName="fillOpacity" values="0.6;1;0.6" dur="2.5s" repeatCount="indefinite" />
      </path>
    </svg>
  );
};
