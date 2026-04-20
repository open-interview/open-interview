/**
 * Unified MetricCard Component
 * 
 * Consistent metric/stat display across the entire application
 * Replaces 20+ duplicate implementations
 * 
 * Used in: Profile, BotActivity, StatsRedesigned, Badges, MobileHomeFocused,
 * MobileChannels, AllChannelsRedesigned, CertificationExam, and more
 */

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

export type MetricCardVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';
export type MetricCardSize = 'sm' | 'md' | 'lg';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: number;
  trendLabel?: string;
  variant?: MetricCardVariant;
  size?: MetricCardSize;
  description?: string;
  animated?: boolean;
  className?: string;
  onClick?: () => void;
}

const variantClasses: Record<MetricCardVariant, { bg: string; text: string; iconBg: string }> = {
  default: {
    bg: 'bg-card border-border',
    text: 'text-foreground',
    iconBg: 'bg-primary/10'
  },
  success: {
    bg: 'bg-green-500/5 border-green-500/20',
    text: 'text-green-500',
    iconBg: 'bg-green-500/10'
  },
  warning: {
    bg: 'bg-yellow-500/5 border-yellow-500/20',
    text: 'text-yellow-500',
    iconBg: 'bg-yellow-500/10'
  },
  danger: {
    bg: 'bg-red-500/5 border-red-500/20',
    text: 'text-red-500',
    iconBg: 'bg-red-500/10'
  },
  info: {
    bg: 'bg-blue-500/5 border-blue-500/20',
    text: 'text-blue-500',
    iconBg: 'bg-blue-500/10'
  }
};

const sizeClasses: Record<MetricCardSize, { padding: string; value: string; label: string; icon: string }> = {
  sm: {
    padding: 'p-3',
    value: 'text-xl',
    label: 'text-xs',
    icon: 'w-8 h-8'
  },
  md: {
    padding: 'p-4',
    value: 'text-2xl',
    label: 'text-sm',
    icon: 'w-10 h-10'
  },
  lg: {
    padding: 'p-6',
    value: 'text-3xl',
    label: 'text-base',
    icon: 'w-12 h-12'
  }
};

export function MetricCard({
  label,
  value,
  icon,
  trend,
  trendLabel,
  variant = 'default',
  size = 'md',
  description,
  animated = true,
  className = '',
  onClick
}: MetricCardProps) {
  const variantConfig = variantClasses[variant];
  const sizeConfig = sizeClasses[size];

  const content = (
    <div 
      className={`
        ${variantConfig.bg} rounded-xl border ${sizeConfig.padding}
        ${onClick ? 'cursor-pointer hover:border-primary/30 hover:shadow-lg transition-all' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Icon */}
      {icon && (
        <div className={`${sizeConfig.icon} rounded-xl ${variantConfig.iconBg} flex items-center justify-center mb-3`}>
          <span className={variantConfig.text}>{icon}</span>
        </div>
      )}

      {/* Value */}
      <div className={`${sizeConfig.value} font-bold ${variantConfig.text}`}>
        {value}
      </div>

      {/* Label */}
      <div className={`${sizeConfig.label} text-muted-foreground mt-1`}>
        {label}
      </div>

      {/* Description */}
      {description && (
        <div className="text-xs text-muted-foreground/70 mt-1">
          {description}
        </div>
      )}

      {/* Trend */}
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs ${
          trend >= 0 ? 'text-green-500' : 'text-red-500'
        }`}>
          {trend >= 0 ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          <span className="font-medium">
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
          {trendLabel && (
            <span className="text-muted-foreground ml-1">{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
}

/**
 * Compact Metric Card - Horizontal layout for dense displays
 */
interface CompactMetricCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  variant?: MetricCardVariant;
  className?: string;
  onClick?: () => void;
}

export function CompactMetricCard({
  label,
  value,
  icon,
  variant = 'default',
  className = '',
  onClick
}: CompactMetricCardProps) {
  const variantConfig = variantClasses[variant];

  return (
    <div 
      className={`
        ${variantConfig.bg} rounded-lg border p-3
        flex items-center gap-3
        ${onClick ? 'cursor-pointer hover:border-primary/30 transition-all' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {icon && (
        <div className={`w-8 h-8 rounded-lg ${variantConfig.iconBg} flex items-center justify-center flex-shrink-0`}>
          <span className={variantConfig.text}>{icon}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-lg font-bold ${variantConfig.text}`}>{value}</div>
      </div>
    </div>
  );
}

/**
 * Metric Grid - Layout helper for multiple metrics
 */
interface MetricGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function MetricGrid({
  children,
  columns = 3,
  className = ''
}: MetricGridProps) {
  const gridClasses = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div className={`grid ${gridClasses[columns]} gap-4 ${className}`}>
      {children}
    </div>
  );
}
