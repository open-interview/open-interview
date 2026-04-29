import React from 'react';

export default function LearningPathIllustration() {
  const nodes = [
    { cx: 50, cy: 100 },
    { cx: 100, cy: 60 },
    { cx: 100, cy: 140 },
    { cx: 150, cy: 100 },
  ];

  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path d="M50 100L100 60L150 100L100 140Z" stroke="#4285F4" strokeWidth="2" fill="none" opacity="0.3" />
      <line x1="50" y1="100" x2="100" y2="60" stroke="#4285F4" strokeWidth="2" opacity="0.5">
        <animate attributeName="stroke-dasharray" values="0,70;70,0" dur="2s" fill="freeze" />
      </line>
      <line x1="100" y1="60" x2="150" y2="100" stroke="#EA4335" strokeWidth="2" opacity="0.5">
        <animate attributeName="stroke-dasharray" values="0,70;70,0" dur="2s" begin="0.5s" fill="freeze" />
      </line>
      <line x1="150" y1="100" x2="100" y2="140" stroke="#FBBC05" strokeWidth="2" opacity="0.5">
        <animate attributeName="stroke-dasharray" values="0,70;70,0" dur="2s" begin="1s" fill="freeze" />
      </line>
      <line x1="100" y1="140" x2="50" y2="100" stroke="#34A853" strokeWidth="2" opacity="0.5">
        <animate attributeName="stroke-dasharray" values="0,70;70,0" dur="2s" begin="1.5s" fill="freeze" />
      </line>
      {nodes.map((node, i) => (
        <circle key={i} cx={node.cx} cy={node.cy} r="8" fill={`${['#4285F4', '#EA4335', '#FBBC05', '#34A853'][i]}20`} stroke={['#4285F4', '#EA4335', '#FBBC05', '#34A853'][i]} strokeWidth="2">
          <animate attributeName="r" values="8;10;8" dur="2s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}
