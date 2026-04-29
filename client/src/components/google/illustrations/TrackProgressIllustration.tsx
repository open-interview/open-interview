import React from "react";

interface TrackProgressIllustrationProps {
  className?: string;
}

export const TrackProgressIllustration: React.FC<TrackProgressIllustrationProps> = ({
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
        <linearGradient id="chartGrad" x1="60" y1="120" x2="140" y2="60">
          <stop stopColor="#4285F4" />
          <stop offset="1" stopColor="#34A853" />
        </linearGradient>
      </defs>

      {/* Background circle */}
      <circle cx="100" cy="100" r="80" fill="#34A853" fillOpacity="0.05" />

      {/* Chart container */}
      <rect x="50" y="50" width="100" height="90" rx="8" fill="white" stroke="#34A853" strokeWidth="2" />

      {/* Grid lines */}
      <line x1="50" y1="75" x2="150" y2="75" stroke="#E8F5E9" strokeWidth="1" />
      <line x1="50" y1="100" x2="150" y2="100" stroke="#E8F5E9" strokeWidth="1" />
      <line x1="50" y1="125" x2="150" y2="125" stroke="#E8F5E9" strokeWidth="1" />

      {/* Bar chart */}
      <rect x="65" y="105" width="12" height="25" rx="2" fill="#4285F4" fillOpacity="0.6">
        <animate attributeName="height" values="25;30;25" dur="3s" repeatCount="indefinite" />
        <animate attributeName="y" values="105;100;105" dur="3s" repeatCount="indefinite" />
      </rect>
      <rect x="85" y="90" width="12" height="40" rx="2" fill="#4285F4" fillOpacity="0.7">
        <animate attributeName="height" values="40;45;40" dur="2.5s" repeatCount="indefinite" />
        <animate attributeName="y" values="90;85;90" dur="2.5s" repeatCount="indefinite" />
      </rect>
      <rect x="105" y="75" width="12" height="55" rx="2" fill="#4285F4" fillOpacity="0.8">
        <animate attributeName="height" values="55;60;55" dur="2s" repeatCount="indefinite" />
        <animate attributeName="y" values="75;70;75" dur="2s" repeatCount="indefinite" />
      </rect>
      <rect x="125" y="60" width="12" height="70" rx="2" fill="#34A853">
        <animate attributeName="height" values="70;75;70" dur="2.8s" repeatCount="indefinite" />
        <animate attributeName="y" values="60;55;60" dur="2.8s" repeatCount="indefinite" />
      </rect>

      {/* Trend line */}
      <path
        d="M65 105L85 90L105 75L125 60"
        stroke="url(#chartGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        strokeDasharray="4 4"
      />

      {/* Target/bullseye icon */}
      <circle cx="160" cy="70" r="20" fill="#EA4335" fillOpacity="0.1" />
      <circle cx="160" cy="70" r="14" fill="none" stroke="#EA4335" strokeWidth="2" />
      <circle cx="160" cy="70" r="8" fill="none" stroke="#EA4335" strokeWidth="1.5" />
      <circle cx="160" cy="70" r="3" fill="#EA4335" />
    </svg>
  );
};
