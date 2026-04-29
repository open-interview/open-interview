import { ButtonHTMLAttributes, forwardRef } from "react";
import "./GoogleChip.css";

interface GoogleChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "assist" | "filter" | "input" | "suggestion";
  selected?: boolean;
}

export const GoogleChip = forwardRef<HTMLButtonElement, GoogleChipProps>(
  ({ variant = "filter", selected = false, className = "", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`google-chip google-chip--${variant} ${selected ? "google-chip--selected" : ""} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

GoogleChip.displayName = "GoogleChip";