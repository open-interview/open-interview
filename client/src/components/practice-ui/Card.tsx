/**
 * @deprecated Use `@/components/unified/Card` instead.
 * This component duplicates unified/Card.tsx and will be removed in a future cleanup.
 */

/**
 * Card Component - Glassmorphism card with neon accents
 */

import { cn } from '../../lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  neonBorder?: boolean;
  gradient?: string;
}

export function Card({ children, className, neonBorder, gradient }: CardProps) {
  return (
    <div
      className={cn(
        'bg-card/50 backdrop-blur-xl rounded-[24px] border transition-all',
        neonBorder ? 'border-primary/30 hover:border-primary/60' : 'border-border',
        gradient && `bg-gradient-to-br ${gradient}`,
        'shadow-[8px_8px_16px_rgba(163,177,198,0.5),-8px_-8px_16px_rgba(255,255,255,1)]',
        'dark:shadow-[8px_8px_16px_rgba(0,0,0,0.5),-8px_-8px_16px_rgba(255,255,255,0.08)]',
        className
      )}
    >
      {children}
    </div>
  );
}
