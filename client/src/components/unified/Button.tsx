/**
 * @deprecated Use `@/components/ui/button` instead.
 * This component duplicates ui/button.tsx and will be removed in a future cleanup.
 */

/**
 * Unified Button Component
 * 
 * Consistent button styling across the entire application
 * Replaces 50+ duplicate button implementations
 * 
 * Used everywhere: All pages and components
 */

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useReducedMotion, springTransition, springTransitionBounce, getSpringTransition } from '../../hooks/use-reduced-motion';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ButtonRounded = 'default' | 'lg' | 'full';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  rounded?: ButtonRounded;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  animated?: boolean;
  className?: string;
  children?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  outline: 'border border-border bg-transparent hover:bg-muted/50',
  ghost: 'bg-transparent hover:bg-muted/50',
  danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm',
  success: 'bg-green-500 text-white hover:bg-green-600 shadow-sm'
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  xl: 'px-8 py-4 text-lg'
};

const roundedClasses: Record<ButtonRounded, string> = {
  default: 'rounded-lg',
  lg: 'rounded-xl',
  full: 'rounded-full'
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      rounded = 'default',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      animated = true,
      className = '',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'inline-flex items-center justify-center gap-2 font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed';
    const variantClass = variantClasses[variant];
    const sizeClass = sizeClasses[size];
    const roundedClass = roundedClasses[rounded];
    const widthClass = fullWidth ? 'w-full' : '';
    const animatedClass = animated ? 'active:scale-95' : '';

    const content = (
      <>
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {!loading && icon && iconPosition === 'left' && icon}
        {children}
        {!loading && icon && iconPosition === 'right' && icon}
      </>
    );

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          ${baseClasses}
          ${variantClass}
          ${sizeClass}
          ${roundedClass}
          ${widthClass}
          ${animatedClass}
          ${className}
        `}
        {...props}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';

/**
 * Motion Button - Animated button with Framer Motion
 */
interface MotionButtonProps extends Omit<ButtonProps, 'animated'> {
  whileHover?: any;
  whileTap?: any;
  initial?: any;
  animate?: any;
  exit?: any;
  transition?: any;
}

export const MotionButton = forwardRef<HTMLButtonElement, MotionButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      rounded = 'default',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      className = '',
      disabled,
      children,
      initial = { opacity: 0, scale: 0.95 },
      animate = { opacity: 1, scale: 1 },
      whileHover = { scale: 1.02 },
      whileTap = { scale: 0.98 },
      transition,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();
    const spring = getSpringTransition(prefersReducedMotion);
    const bounce = prefersReducedMotion ? { duration: 0.01 } : springTransitionBounce;

    const baseClasses = 'inline-flex items-center justify-center gap-2 font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed';
    const variantClass = variantClasses[variant];
    const sizeClass = sizeClasses[size];
    const roundedClass = roundedClasses[rounded];
    const widthClass = fullWidth ? 'w-full' : '';

    const content = (
      <>
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {!loading && icon && iconPosition === 'left' && icon}
        {children}
        {!loading && icon && iconPosition === 'right' && icon}
      </>
    );

    return (
      <motion.button
        ref={ref}
        disabled={disabled || loading}
        initial={initial}
        animate={animate}
        whileHover={whileHover}
        whileTap={whileTap}
        transition={transition || { ...spring, whileHover: bounce, whileTap: spring }}
        className={`
          ${baseClasses}
          ${variantClass}
          ${sizeClass}
          ${roundedClass}
          ${widthClass}
          ${className}
        `}
        {...(props as any)}
      >
        {content}
      </motion.button>
    );
  }
);

MotionButton.displayName = 'MotionButton';

/**
 * Icon Button - Button with only an icon
 */
interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  icon: ReactNode;
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, size = 'md', rounded = 'default', className = '', ...props }, ref) => {
    const sizeMap = {
      xs: 'w-6 h-6',
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12',
      xl: 'w-14 h-14'
    };

    return (
      <Button
        ref={ref}
        size={size}
        rounded={rounded}
        className={`${sizeMap[size]} p-0 ${className}`}
        {...props}
      >
        {icon}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';

/**
 * Button Group - Group of related buttons
 */
interface ButtonGroupProps {
  children: ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export function ButtonGroup({ children, className = '', orientation = 'horizontal' }: ButtonGroupProps) {
  const orientationClass = orientation === 'horizontal' ? 'flex-row' : 'flex-col';
  
  return (
    <div className={`inline-flex ${orientationClass} ${className}`}>
      {children}
    </div>
  );
}
