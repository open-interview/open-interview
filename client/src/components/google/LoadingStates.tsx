import { HTMLAttributes, forwardRef } from "react";
import "./LoadingStates.css";

// Google color palette
const GOOGLE_BLUE = "#4285F4";
const GOOGLE_RED = "#EA4335";
const GOOGLE_YELLOW = "#FBBC04";
const GOOGLE_GREEN = "#34A853";

interface LoadingBaseProps extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = { sm: 16, md: 24, lg: 48 };

// Spinner - SVG circle with animated dash rotation
export const Spinner = forwardRef<HTMLDivElement, LoadingBaseProps>(
  ({ size = "md", className = "", ...props }, ref) => {
    const dim = sizeMap[size];
    return (
      <div ref={ref} className={`google-spinner google-spinner--${size} ${className}`} aria-busy="true" role="status" {...props}>
        <svg width={dim} height={dim} viewBox="0 0 24 24" className="google-spinner__svg">
          <circle
            className="google-spinner__circle"
            cx="12"
            cy="12"
            r="9"
            fill="none"
            stroke={GOOGLE_BLUE}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }
);
Spinner.displayName = "Spinner";

// Skeleton - Animated gradient shimmer overlay
export const Skeleton = forwardRef<HTMLDivElement, LoadingBaseProps & { lines?: number }>(
  ({ size = "md", className = "", lines = 1, style, ...props }, ref) => {
    const height = size === "sm" ? 12 : size === "lg" ? 24 : 16;
    return (
      <div ref={ref} className={`google-skeleton ${className}`} aria-busy="true" role="status" style={style} {...props}>
        <svg width="100%" height={height * lines + (lines > 1 ? (lines - 1) * 8 : 0)} className="google-skeleton__svg">
          <defs>
            <linearGradient id="shimmer-gradient" x1="0%" y1="0%" x2="200%" y2="0%">
              <stop offset="0%" stopColor="#e8eaed" />
              <stop offset="50%" stopColor="#f1f3f4" />
              <stop offset="100%" stopColor="#e8eaed" />
            </linearGradient>
          </defs>
          {Array.from({ length: lines }).map((_, i) => (
            <rect
              key={i}
              x="0"
              y={i * (height + 8)}
              width="100%"
              height={height}
              rx="4"
              fill="url(#shimmer-gradient)"
              className="google-skeleton__rect"
            />
          ))}
        </svg>
        <span className="sr-only">Loading content...</span>
      </div>
    );
  }
);
Skeleton.displayName = "Skeleton";

// Progress - SVG progress bar with gradient fill animation
export const Progress = forwardRef<HTMLDivElement, LoadingBaseProps & { value?: number }>(
  ({ size = "md", className = "", value = 0, ...props }, ref) => {
    const isIndeterminate = value === 0;
    const w = 120;
    const h = size === "sm" ? 4 : size === "lg" ? 8 : 6;
    return (
      <div ref={ref} className={`google-progress-bar google-progress-bar--${size} ${className}`} aria-busy="true" role="progressbar" aria-valuenow={isIndeterminate ? undefined : value} aria-valuemin={0} aria-valuemax={100} {...props}>
        <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} className="google-progress-bar__svg">
          <defs>
            <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={GOOGLE_BLUE} />
              <stop offset="50%" stopColor={GOOGLE_GREEN} />
              <stop offset="100%" stopColor={GOOGLE_BLUE} />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width={w} height={h} rx={h / 2} fill="#e8eaed" />
          {isIndeterminate ? (
            <rect className="google-progress-bar__indeterminate" x="0" y="0" width={w * 0.4} height={h} rx={h / 2} fill="url(#progress-gradient)" />
          ) : (
            <rect x="0" y="0" width={(value / 100) * w} height={h} rx={h / 2} fill="url(#progress-gradient)" className="google-progress-bar__determined" />
          )}
        </svg>
        <span className="sr-only">Loading: {value}% complete</span>
      </div>
    );
  }
);
Progress.displayName = "Progress";

// Dots - Three bouncing dots like Google's loading
export const Dots = forwardRef<HTMLDivElement, LoadingBaseProps>(
  ({ size = "md", className = "", ...props }, ref) => {
    const dim = sizeMap[size];
    const dotSize = size === "sm" ? 3 : size === "lg" ? 8 : 5;
    const spacing = dotSize * 2.5;
    const cy = dim / 2;
    return (
      <div ref={ref} className={`google-dots google-dots--${size} ${className}`} aria-busy="true" role="status" {...props}>
        <svg width={spacing * 3} height={dim} viewBox={`0 0 ${spacing * 3} ${dim}`} className="google-dots__svg">
          <circle className="google-dots__dot google-dots__dot--1" cx={spacing * 0.5} cy={cy} r={dotSize} fill={GOOGLE_BLUE} />
          <circle className="google-dots__dot google-dots__dot--2" cx={spacing * 1.5} cy={cy} r={dotSize} fill={GOOGLE_RED} />
          <circle className="google-dots__dot google-dots__dot--3" cx={spacing * 2.5} cy={cy} r={dotSize} fill={GOOGLE_YELLOW} />
        </svg>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }
);
Dots.displayName = "Dots";

// Pulse - Pulsing circle SVG
export const Pulse = forwardRef<HTMLDivElement, LoadingBaseProps>(
  ({ size = "md", className = "", ...props }, ref) => {
    const dim = sizeMap[size];
    return (
      <div ref={ref} className={`google-pulse google-pulse--${size} ${className}`} aria-busy="true" role="status" {...props}>
        <svg width={dim} height={dim} viewBox="0 0 24 24" className="google-pulse__svg">
          <circle className="google-pulse__circle" cx="12" cy="12" r="8" fill={GOOGLE_BLUE} opacity="0.6" />
          <circle className="google-pulse__ring" cx="12" cy="12" r="8" fill="none" stroke={GOOGLE_BLUE} strokeWidth="2" />
        </svg>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }
);
Pulse.displayName = "Pulse";

// Wave - Wave loading animation SVG
export const Wave = forwardRef<HTMLDivElement, LoadingBaseProps>(
  ({ size = "md", className = "", ...props }, ref) => {
    const dim = sizeMap[size];
    const barW = size === "sm" ? 2 : size === "lg" ? 5 : 3;
    const barH = dim;
    const gap = size === "sm" ? 1 : size === "lg" ? 3 : 2;
    const bars = 5;
    const totalW = bars * barW + (bars - 1) * gap;
    return (
      <div ref={ref} className={`google-wave google-wave--${size} ${className}`} aria-busy="true" role="status" {...props}>
        <svg width={totalW} height={barH} viewBox={`0 0 ${totalW} ${barH}`} className="google-wave__svg">
          {Array.from({ length: bars }).map((_, i) => (
            <rect
              key={i}
              className={`google-wave__bar google-wave__bar--${i + 1}`}
              x={i * (barW + gap)}
              y="0"
              width={barW}
              height={barH}
              rx={barW / 2}
              fill={GOOGLE_BLUE}
            />
          ))}
        </svg>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }
);
Wave.displayName = "Wave";

// Default export with all components
export const LoadingStates = { Spinner, Skeleton, Progress, Dots, Pulse, Wave };
