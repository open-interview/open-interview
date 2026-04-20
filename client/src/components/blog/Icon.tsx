import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IconProps {
  icon: LucideIcon;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  'aria-label'?: string;
  'aria-hidden'?: boolean;
}

const sizes = { sm: 16, md: 20, lg: 24 };

export function Icon({ icon: LucideIconComponent, size = 'md', className, 'aria-label': ariaLabel, 'aria-hidden': ariaHidden }: IconProps) {
  return (
    <LucideIconComponent
      size={sizes[size]}
      strokeWidth={1.5}
      className={cn('shrink-0', className)}
      aria-label={ariaLabel}
      aria-hidden={ariaHidden ?? !ariaLabel}
    />
  );
}
