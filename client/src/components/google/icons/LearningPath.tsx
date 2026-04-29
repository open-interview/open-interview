import React from "react"

export function LearningPath(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="5" cy="6" r="2" />
      <circle cx="12" cy="18" r="2" />
      <circle cx="19" cy="6" r="2" />
      <path d="M7 7.5l4 8" />
      <path d="M15 7.5l-3 8" />
    </svg>
  )
}
