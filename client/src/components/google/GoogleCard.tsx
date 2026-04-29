import { HTMLAttributes, forwardRef } from "react";
import "./GoogleCard.css";

interface GoogleCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "elevated" | "filled" | "outlined";
}

export const GoogleCard = forwardRef<HTMLDivElement, GoogleCardProps>(
  ({ variant = "elevated", className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`google-card google-card--${variant} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GoogleCard.displayName = "GoogleCard";