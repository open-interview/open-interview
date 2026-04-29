import { ButtonHTMLAttributes, forwardRef } from "react";
import "./GoogleButton.css";

export type GoogleButtonVariant = "filled" | "outlined" | "text";

interface GoogleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GoogleButtonVariant;
  size?: "small" | "medium" | "large";
}

export const GoogleButton = forwardRef<HTMLButtonElement, GoogleButtonProps>(
  ({ variant = "filled", size = "medium", className = "", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`google-button google-button--${variant} google-button--${size} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

GoogleButton.displayName = "GoogleButton";