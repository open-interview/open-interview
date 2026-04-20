import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button: React.FC<ButtonProps> = ({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}) => {
  const baseClasses = "font-medium rounded-lg transition-colors duration-200";

  const variantClasses = {
    primary: "bg-primary-500 hover:bg-primary-600 text-white",
    secondary:
      "bg-background-secondary hover:bg-background-tertiary text-white",
    ghost:
      "text-primary-300 hover:text-primary-200 hover:bg-background-tertiary"
  };

  const sizeClasses = {
    sm: "py-2 px-3 text-sm",
    md: "py-2 px-4",
    lg: "py-3 px-6 text-lg"
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
