import React from "react"

export function Certificate(props: React.SVGProps<SVGSVGElement>) {
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
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 7h10" />
      <path d="M7 11h10" />
      <path d="M7 15h6" />
      <circle cx="18" cy="18" r="3" />
      <path d="M18 16v4" />
    </svg>
  )
}
