import { ButtonHTMLAttributes, forwardRef } from "react";
import "./GoogleButton.css";

export type GoogleButtonVariant = "filled" | "filled-tonal" | "outlined" | "text" | "danger" | "elevated";
export type GoogleButtonSize = "small" | "medium" | "large" | "icon";

interface GoogleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GoogleButtonVariant;
  size?: GoogleButtonSize;
  loading?: boolean;
}

export const GoogleButton = forwardRef<HTMLButtonElement, GoogleButtonProps>(
  ({ variant = "filled", size = "medium", loading = false, className = "", children, disabled, ...props }, ref) => {
    const isDisabled = disabled || loading;
    return (
      <button
        ref={ref}
        className={`google-button google-button--${variant} google-button--${size} ${isDisabled ? 'google-button--disabled' : ''} ${loading ? 'google-button--loading' : ''} ${className}`}
        disabled={isDisabled}
        aria-busy={loading ? "true" : undefined}
        {...props}
      >
        {loading ? (
           <>
             {children && <span className="visually-hidden">{children}</span>}
             <span className="google-button__spinner" aria-hidden="true">
               <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                 <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                 <path d="M10 2a8 8 0 0 1 8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                   <animateTransform attributeName="transform" type="rotate" from="0 10 10" to="360 10 10" dur="0.8s" repeatCount="indefinite" />
                 </path>
               </svg>
             </span>
           </>
         ) : children}
      </button>
    );
  }
);

GoogleButton.displayName = "GoogleButton";
