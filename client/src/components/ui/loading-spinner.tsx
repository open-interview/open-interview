import { cn } from "@/lib/utils";

const sizeMap = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-8 w-8" };
const colorMap = {
  default: "text-[var(--color-accent-violet)]",
  white: "text-white",
  muted: "text-[var(--text-secondary)]",
};

interface LoadingSpinnerProps {
  size?: keyof typeof sizeMap;
  color?: keyof typeof colorMap;
  label?: string;
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  color = "default",
  label,
  className,
}: LoadingSpinnerProps) {
  return (
    <div className={cn("flex items-center gap-2", className)} role="status">
      <svg
        className={cn("animate-spin", sizeMap[size], colorMap[color])}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      {label && <span className="text-sm text-[var(--text-secondary)]">{label}</span>}
      <span className="sr-only">{label ?? "Loading..."}</span>
    </div>
  );
}
