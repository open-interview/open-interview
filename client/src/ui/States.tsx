import React from 'react';
import { Inbox, Loader2, AlertCircle } from 'lucide-react';
import { Button } from './Components';
import { cn } from '../lib/utils';

interface EmptyProps {
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function Empty({ title = 'No items', description, action, className }: EmptyProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Inbox className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-foreground max-w-xs mb-4">{description}</p>}
      {action && <Button onClick={action.onClick}>{action.label}</Button>}
    </div>
  );
}

interface LoadingProps {
  message?: string;
  className?: string;
}

export function Loading({ message = 'Loading...', className }: LoadingProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12', className)}>
      <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

interface ErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function Error({ title = 'Error', message, onRetry, className }: ErrorProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {message && <p className="text-sm text-muted-foreground max-w-xs mb-4">{message}</p>}
      {onRetry && <Button onClick={onRetry} variant="secondary">Try Again</Button>}
    </div>
  );
}
