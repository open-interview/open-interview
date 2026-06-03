import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useReducedMotion, getSpringTransition } from '@/hooks/use-reduced-motion';

export interface StatCardData {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  suffix?: string;
  prefix?: string;
  trend?: number;
  trendLabel?: string;
  description?: string;
  accent?: 'violet' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'blue';
}

interface StatCardProps {
  stat: StatCardData;
  className?: string;
  animate?: boolean;
  duration?: number;
}

const accentConfig: Record<string, { gradient: string; iconBg: string; value: string; trendUp: string; trendDown: string; ring: string }> = {
  violet: {
    gradient: 'from-violet-500 to-indigo-500',
    iconBg: 'bg-violet-500/10',
    value: 'text-violet-400',
    trendUp: 'text-emerald-400',
    trendDown: 'text-rose-400',
    ring: 'ring-violet-500/20',
  },
  cyan: {
    gradient: 'from-cyan-500 to-blue-500',
    iconBg: 'bg-cyan-500/10',
    value: 'text-cyan-400',
    trendUp: 'text-emerald-400',
    trendDown: 'text-rose-400',
    ring: 'ring-cyan-500/20',
  },
  emerald: {
    gradient: 'from-emerald-500 to-teal-500',
    iconBg: 'bg-emerald-500/10',
    value: 'text-emerald-400',
    trendUp: 'text-emerald-400',
    trendDown: 'text-rose-400',
    ring: 'ring-emerald-500/20',
  },
  amber: {
    gradient: 'from-amber-500 to-orange-500',
    iconBg: 'bg-amber-500/10',
    value: 'text-amber-400',
    trendUp: 'text-emerald-400',
    trendDown: 'text-rose-400',
    ring: 'ring-amber-500/20',
  },
  rose: {
    gradient: 'from-rose-500 to-pink-500',
    iconBg: 'bg-rose-500/10',
    value: 'text-rose-400',
    trendUp: 'text-emerald-400',
    trendDown: 'text-rose-400',
    ring: 'ring-rose-500/20',
  },
  blue: {
    gradient: 'from-blue-500 to-sky-500',
    iconBg: 'bg-blue-500/10',
    value: 'text-blue-400',
    trendUp: 'text-emerald-400',
    trendDown: 'text-rose-400',
    ring: 'ring-blue-500/20',
  },
};

function AnimatedCounter({
  target,
  prefix = '',
  suffix = '',
  duration = 1200,
  animate = true,
  className,
}: {
  target: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  animate?: boolean;
  className?: string;
}) {
  const [count, setCount] = useState(animate ? 0 : target);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!animate || typeof target !== 'number') {
      setCount(target);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);

          const startTime = performance.now();
          const startValue = 0;

          const animateCounter = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(startValue + (target - startValue) * eased);

            setCount(current);

            if (progress < 1) {
              requestAnimationFrame(animateCounter);
            }
          };

          requestAnimationFrame(animateCounter);
        }
      },
      { threshold: 0.3 },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [target, duration, animate, hasAnimated]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export function StatCard({ stat, className, animate = true, duration = 1200 }: StatCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const spring = getSpringTransition(prefersReducedMotion);
  const accent = accentConfig[stat.accent || 'violet'];

  const isNumeric = typeof stat.value === 'number';
  const numericValue = isNumeric ? (stat.value as number) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      whileHover={!prefersReducedMotion ? { y: -2, transition: spring } : undefined}
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border/50 bg-card p-5 transition-colors hover:border-border/80',
        className,
      )}
    >
      {/* Top accent bar */}
      <div className={cn('absolute left-0 top-0 h-0.5 w-full bg-gradient-to-r opacity-60', accent.gradient)} />

      {/* Background glow */}
      <div className={cn('pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br blur-2xl opacity-0 transition-opacity group-hover:opacity-20', accent.gradient)} />

      <div className="relative z-10">
        {/* Icon + Label row */}
        <div className="flex items-center justify-between">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', accent.iconBg)}>
            {stat.icon && <span className="text-lg">{stat.icon}</span>}
          </div>

          {stat.trend !== undefined && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium',
                stat.trend >= 0
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-rose-500/10 text-rose-400',
              )}
            >
              {stat.trend >= 0 ? '↑' : '↓'} {Math.abs(stat.trend)}%
              {stat.trendLabel && (
                <span className="ml-1 text-muted-foreground">{stat.trendLabel}</span>
              )}
            </span>
          )}
        </div>

        {/* Value */}
        <div className="mt-4">
          {isNumeric ? (
            <AnimatedCounter
              target={numericValue}
              prefix={stat.prefix}
              suffix={stat.suffix}
              duration={duration}
              animate={animate && !prefersReducedMotion}
              className={cn('text-3xl font-bold tracking-tight', accent.value)}
            />
          ) : (
            <span className={cn('text-3xl font-bold tracking-tight', accent.value)}>
              {stat.value}
            </span>
          )}
        </div>

        {/* Label */}
        <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>

        {/* Description */}
        {stat.description && (
          <p className="mt-1 text-xs text-muted-foreground/70">{stat.description}</p>
        )}
      </div>
    </motion.div>
  );
}

export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-xl border border-border/50 bg-card p-5 animate-pulse', className)}>
      <div className="absolute left-0 top-0 h-0.5 w-full bg-muted/50" />
      <div className="flex items-center justify-between">
        <div className="h-10 w-10 rounded-lg bg-muted/50" />
        <div className="h-5 w-16 rounded-full bg-muted/50" />
      </div>
      <div className="mt-4 h-9 w-24 rounded bg-muted/50" />
      <div className="mt-2 h-4 w-20 rounded bg-muted/50" />
    </div>
  );
}

export function StatGrid({
  children,
  columns = 4,
  className,
}: {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const gridClasses: Record<number, string> = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', gridClasses[columns], className)}>
      {children}
    </div>
  );
}
