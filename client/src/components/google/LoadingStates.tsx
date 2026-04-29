import { HTMLAttributes, forwardRef } from "react";
import "./LoadingStates.css";

const GOOGLE_BLUE = "#4285F4";
const GOOGLE_RED = "#EA4335";
const GOOGLE_YELLOW = "#FBBC04";

interface LoadingBaseProps extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = { sm: 16, md: 24, lg: 48 };

// ─── Spinner ──────────────────────────────────────────────────────────────────

export const Spinner = forwardRef<HTMLDivElement, LoadingBaseProps>(
  ({ size = "md", className = "", ...props }, ref) => {
    const dim = sizeMap[size];
    return (
      <div ref={ref} className={`google-spinner google-spinner--${size} ${className}`} aria-busy="true" role="status" {...props}>
        <svg width={dim} height={dim} viewBox="0 0 24 24" className="google-spinner__svg">
          <circle className="google-spinner__circle" cx="12" cy="12" r="9" fill="none" stroke={GOOGLE_BLUE} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }
);
Spinner.displayName = "Spinner";

// ─── Skeleton (CSS-only shimmer) ──────────────────────────────────────────────

export const Skeleton = forwardRef<HTMLDivElement, LoadingBaseProps & { lines?: number }>(
  ({ size = "md", className = "", lines = 1, style, ...props }, ref) => {
    const height = size === "sm" ? 12 : size === "lg" ? 24 : 16;
    return (
      <div ref={ref} className={`google-skeleton ${className}`} aria-busy="true" role="status" style={style} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="google-skeleton__line"
            style={{
              height,
              width: i === lines - 1 && lines > 1 ? '75%' : '100%',
              marginBottom: i < lines - 1 ? 8 : 0,
            }}
          />
        ))}
        <span className="sr-only">Loading content...</span>
      </div>
    );
  }
);
Skeleton.displayName = "Skeleton";

// ─── Progress ─────────────────────────────────────────────────────────────────

export const Progress = forwardRef<HTMLDivElement, LoadingBaseProps & { value?: number }>(
  ({ size = "md", className = "", value = 0, ...props }, ref) => {
    const isIndeterminate = value === 0;
    const h = size === "sm" ? 4 : size === "lg" ? 8 : 6;
    return (
      <div
        ref={ref}
        className={`google-progress-bar google-progress-bar--${size} ${className}`}
        aria-busy="true"
        role="progressbar"
        aria-valuenow={isIndeterminate ? undefined : value}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{ height: h, borderRadius: h / 2, background: '#e8eaed', overflow: 'hidden', width: '100%' }}
        {...props}
      >
        <div
          className={isIndeterminate ? 'google-progress-bar__indeterminate' : 'google-progress-bar__determined'}
          style={{
            height: '100%',
            width: isIndeterminate ? '40%' : `${value}%`,
            background: `linear-gradient(90deg, ${GOOGLE_BLUE}, #34A853, ${GOOGLE_BLUE})`,
            borderRadius: h / 2,
            transition: isIndeterminate ? undefined : 'width 0.3s ease',
          }}
        />
        <span className="sr-only">Loading: {value}% complete</span>
      </div>
    );
  }
);
Progress.displayName = "Progress";

// ─── Dots ─────────────────────────────────────────────────────────────────────

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

// ─── Pulse ────────────────────────────────────────────────────────────────────

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

// ─── Wave ─────────────────────────────────────────────────────────────────────

export const Wave = forwardRef<HTMLDivElement, LoadingBaseProps>(
  ({ size = "md", className = "", ...props }, ref) => {
    const dim = sizeMap[size];
    const barW = size === "sm" ? 2 : size === "lg" ? 5 : 3;
    const gap = size === "sm" ? 1 : size === "lg" ? 3 : 2;
    const bars = 5;
    const totalW = bars * barW + (bars - 1) * gap;
    return (
      <div ref={ref} className={`google-wave google-wave--${size} ${className}`} aria-busy="true" role="status" {...props}>
        <svg width={totalW} height={dim} viewBox={`0 0 ${totalW} ${dim}`} className="google-wave__svg">
          {Array.from({ length: bars }).map((_, i) => (
            <rect key={i} className={`google-wave__bar google-wave__bar--${i + 1}`} x={i * (barW + gap)} y="0" width={barW} height={dim} rx={barW / 2} fill={GOOGLE_BLUE} />
          ))}
        </svg>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }
);
Wave.displayName = "Wave";

// ─── M3 Skeleton cards (CSS-only shimmer, no JS) ──────────────────────────────

/** Question card skeleton */
export function QuestionCardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`m3-skeleton-card ${className}`} aria-busy="true" role="status">
      <div className="m3-skeleton-row" style={{ marginBottom: 12 }}>
        <div className="m3-shimmer" style={{ width: 72, height: 22, borderRadius: 9999 }} />
        <div className="m3-shimmer" style={{ width: 56, height: 22, borderRadius: 9999 }} />
      </div>
      <div className="m3-shimmer" style={{ width: '100%', height: 18, borderRadius: 4, marginBottom: 8 }} />
      <div className="m3-shimmer" style={{ width: '85%', height: 18, borderRadius: 4, marginBottom: 8 }} />
      <div className="m3-shimmer" style={{ width: '65%', height: 18, borderRadius: 4, marginBottom: 16 }} />
      <div className="m3-skeleton-row">
        <div className="m3-shimmer" style={{ width: 64, height: 28, borderRadius: 9999 }} />
        <div className="m3-shimmer" style={{ width: 64, height: 28, borderRadius: 9999 }} />
      </div>
      <span className="sr-only">Loading question...</span>
    </div>
  );
}

/** Channel card skeleton */
export function ChannelCardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`m3-skeleton-card ${className}`} aria-busy="true" role="status">
      <div className="m3-skeleton-row" style={{ marginBottom: 12 }}>
        <div className="m3-shimmer" style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="m3-shimmer" style={{ width: '60%', height: 16, borderRadius: 4, marginBottom: 6 }} />
          <div className="m3-shimmer" style={{ width: '40%', height: 12, borderRadius: 4 }} />
        </div>
      </div>
      <div className="m3-shimmer" style={{ width: '100%', height: 6, borderRadius: 9999, marginBottom: 8 }} />
      <div className="m3-skeleton-row">
        <div className="m3-shimmer" style={{ width: 48, height: 12, borderRadius: 4 }} />
        <div className="m3-shimmer" style={{ width: 36, height: 12, borderRadius: 4 }} />
      </div>
      <span className="sr-only">Loading channel...</span>
    </div>
  );
}

/** Profile stats skeleton */
export function ProfileStatsSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`m3-skeleton-profile ${className}`} aria-busy="true" role="status">
      <div className="m3-skeleton-row" style={{ marginBottom: 20 }}>
        <div className="m3-shimmer" style={{ width: 72, height: 72, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="m3-shimmer" style={{ width: '50%', height: 22, borderRadius: 4, marginBottom: 8 }} />
          <div className="m3-shimmer" style={{ width: '35%', height: 14, borderRadius: 4, marginBottom: 6 }} />
          <div className="m3-shimmer" style={{ width: '65%', height: 12, borderRadius: 4 }} />
        </div>
      </div>
      <div className="m3-skeleton-stats-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="m3-skeleton-card" style={{ padding: 12 }}>
            <div className="m3-shimmer" style={{ width: '60%', height: 12, borderRadius: 4, marginBottom: 8 }} />
            <div className="m3-shimmer" style={{ width: '40%', height: 28, borderRadius: 4, marginBottom: 6 }} />
            <div className="m3-shimmer" style={{ width: '70%', height: 10, borderRadius: 4 }} />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading profile...</span>
    </div>
  );
}

/** Certification card skeleton */
export function CertificationCardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`m3-skeleton-card ${className}`} aria-busy="true" role="status">
      <div className="m3-skeleton-row" style={{ marginBottom: 12 }}>
        <div className="m3-shimmer" style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="m3-shimmer" style={{ width: '70%', height: 18, borderRadius: 4, marginBottom: 6 }} />
          <div className="m3-shimmer" style={{ width: '45%', height: 12, borderRadius: 4, marginBottom: 6 }} />
          <div className="m3-shimmer" style={{ width: '30%', height: 12, borderRadius: 4 }} />
        </div>
      </div>
      <div className="m3-shimmer" style={{ width: '100%', height: 6, borderRadius: 9999, marginBottom: 12 }} />
      <div className="m3-shimmer" style={{ width: '100%', height: 36, borderRadius: 9999 }} />
      <span className="sr-only">Loading certification...</span>
    </div>
  );
}

export const LoadingStates = { Spinner, Skeleton, Progress, Dots, Pulse, Wave };
