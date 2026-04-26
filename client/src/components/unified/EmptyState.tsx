/**
 * Unified EmptyState Component
 * 
 * Consistent empty state display across the entire application
 * Replaces 10+ duplicate implementations
 * 
 * Used in: Bookmarks, Notifications, Tests, TrainingMode, Search results,
 * and various mobile components
 */

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion, springTransition, staggerConfig, getSpringTransition } from '../../hooks/use-reduced-motion';

export type EmptyStateVariant = 'default' | 'info' | 'warning' | 'error' | 'success';
export type EmptyStateSize = 'sm' | 'md' | 'lg';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  variant?: EmptyStateVariant;
  size?: EmptyStateSize;
  illustration?: ReactNode;
  animated?: boolean;
  className?: string;
}

const variantClasses: Record<EmptyStateVariant, { iconBg: string; iconText: string }> = {
  default: {
    iconBg: 'bg-muted/50',
    iconText: 'text-muted-foreground'
  },
  info: {
    iconBg: 'bg-blue-500/10',
    iconText: 'text-blue-500'
  },
  warning: {
    iconBg: 'bg-yellow-500/10',
    iconText: 'text-yellow-500'
  },
  error: {
    iconBg: 'bg-red-500/10',
    iconText: 'text-red-500'
  },
  success: {
    iconBg: 'bg-green-500/10',
    iconText: 'text-green-500'
  }
};

const sizeClasses: Record<EmptyStateSize, { 
  icon: string; 
  title: string; 
  description: string;
  padding: string;
}> = {
  sm: {
    icon: 'w-12 h-12',
    title: 'text-lg font-semibold',
    description: 'text-sm text-muted-foreground',
    padding: 'p-6'
  },
  md: {
    icon: 'w-12 h-12',
    title: 'text-lg font-semibold',
    description: 'text-sm text-muted-foreground',
    padding: 'p-8'
  },
  lg: {
    icon: 'w-12 h-12',
    title: 'text-lg font-semibold',
    description: 'text-sm text-muted-foreground',
    padding: 'p-12'
  }
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = 'default',
  size = 'md',
  illustration,
  animated = true,
  className = ''
}: EmptyStateProps) {
  const prefersReducedMotion = useReducedMotion();
  const spring = getSpringTransition(prefersReducedMotion);
  const variantConfig = variantClasses[variant];
  const sizeConfig = sizeClasses[size];

  const content = (
    <div className={`text-center ${sizeConfig.padding} ${className}`}>
      {/* Illustration or Icon */}
      {illustration ? (
        <div className="mb-4">
          {illustration}
        </div>
      ) : icon ? (
        <div className={`
          ${sizeConfig.icon} rounded-full ${variantConfig.iconBg} 
          flex items-center justify-center mx-auto mb-4
        `}>
          <span className={variantConfig.iconText}>{icon}</span>
        </div>
      ) : null}

      {/* Title */}
      <h3 className={`${sizeConfig.title} mb-2`}>
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className={`${sizeConfig.description} mb-4 max-w-md mx-auto`}>
          {description}
        </p>
      )}

      {/* Action */}
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
      >
        {content}
      </motion.div>
    );
  }

  return content;
}

/**
 * Compact Empty State - For inline/smaller spaces
 */
interface CompactEmptyStateProps {
  icon?: ReactNode;
  message: string;
  action?: ReactNode;
  className?: string;
}

export function CompactEmptyState({
  icon,
  message,
  action,
  className = ''
}: CompactEmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 p-4 ${className}`}>
      {icon && (
        <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground">
          {icon}
        </div>
      )}
      <p className="text-sm text-muted-foreground text-center">{message}</p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

/**
 * Empty State with Card - Wrapped in a card for better visual separation
 */
interface EmptyStateCardProps extends EmptyStateProps {
  cardClassName?: string;
}

export function EmptyStateCard({
  cardClassName = '',
  ...props
}: EmptyStateCardProps) {
  return (
    <div className={`bg-card border border-border rounded-xl ${cardClassName}`}>
      <EmptyState {...props} />
    </div>
  );
}
