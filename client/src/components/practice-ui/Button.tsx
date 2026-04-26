/**
 * @deprecated Use `@/components/ui/button` instead.
 * This component duplicates ui/button.tsx and will be removed in a future cleanup.
 */

/**
 * Button Component - Neon gradient buttons
 * Supports reduced motion for accessibility
 */

import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useReducedMotion } from '../../hooks/use-reduced-motion';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className,
  type = 'button',
}: ButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  
  const variants = {
    primary: 'bg-gradient-to-r from-primary to-cyan-500 text-primary-foreground font-bold shadow-[4px_4px_8px_rgba(0,0,0,0.3),-2px_-2px_8px_rgba(255,255,255,0.2)] active:shadow-[2px_2px_4px_rgba(0,0,0,0.2),-1px_-1px_4px_rgba(255,255,255,0.1)]',
    secondary: 'bg-muted/50 border border-border text-foreground hover:bg-muted shadow-[4px_4px_8px_rgba(163,177,198,0.4),-4px_-4px_8px_rgba(255,255,255,1)] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.08)] active:shadow-[2px_2px_4px_rgba(163,177,198,0.2),-2px_-2px_4px_rgba(255,255,255,0.5)]',
    danger: 'bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold shadow-[4px_4px_8px_rgba(220,38,38,0.4),-2px_-2px_8px_rgba(255,255,255,0.2)] active:shadow-[2px_2px_4px_rgba(220,38,38,0.2),-1px_-1px_4px_rgba(255,255,255,0.1)]',
    ghost: 'bg-transparent text-foreground hover:bg-muted/50 shadow-none',
  };

  const sizes = {
    sm: 'px-4 py-2.5 text-sm rounded-[12px] min-h-[44px]', // Increased padding to meet 44px minimum
    md: 'px-6 py-3 text-base rounded-[16px] min-h-[44px]',
    lg: 'px-8 py-4 text-lg rounded-[20px] min-h-[52px]',
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={prefersReducedMotion || disabled ? {} : { scale: 1.05 }}
      whileTap={prefersReducedMotion || disabled ? {} : { scale: 0.95 }}
      transition={{ duration: prefersReducedMotion ? 0.01 : 0.2 }}
      className={cn(
        'transition-all font-semibold',
        variants[variant],
        sizes[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
    </motion.button>
  );
}
