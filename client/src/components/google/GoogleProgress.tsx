import { HTMLAttributes, forwardRef } from "react";
import "./GoogleProgress.css";

interface GoogleProgressProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "linear" | "circular";
  value?: number;
  indeterminate?: boolean;
}

export const GoogleProgress = forwardRef<HTMLDivElement, GoogleProgressProps>(
  (
    {
      variant = "linear",
      value = 0,
      indeterminate = false,
      className = "",
      ...props
    },
    ref
  ) => {
    const isIndeterminate = indeterminate || value === 0;

    return (
      <div
        ref={ref}
        className={`google-progress google-progress--${variant} ${className}`}
        role="progressbar"
        aria-valuenow={isIndeterminate ? undefined : value}
        aria-valuemin={0}
        aria-valuemax={100}
        {...props}
      >
        {variant === "linear" ? (
          <div className="google-progress-linear">
            <div
              className={`google-progress-linear__bar ${
                isIndeterminate
                  ? "google-progress-linear__bar--indeterminate"
                  : "google-progress-linear__bar--determined"
              }`}
              style={!isIndeterminate ? { transform: `scaleX(${value / 100})` } : undefined}
            />
          </div>
        ) : (
          <div className="google-progress-circular">
            <svg viewBox="0 0 24 24" className="google-progress-circular__svg">
              <circle
                className="google-progress-circular__background"
                cx="12"
                cy="12"
                r="9"
                fill="none"
              />
              <circle
                className={`google-progress-circular__indicator ${
                  isIndeterminate
                    ? "google-progress-circular__indicator--indeterminate"
                    : "google-progress-circular__indicator--determined"
                }`}
                cx="12"
                cy="12"
                r="9"
                fill="none"
                style={!isIndeterminate ? { strokeDashoffset: 56.55 - (value / 100) * 56.55 } : undefined}
              />
            </svg>
          </div>
        )}
      </div>
    );
  }
);

GoogleProgress.displayName = "GoogleProgress";