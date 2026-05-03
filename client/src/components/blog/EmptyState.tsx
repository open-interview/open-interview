import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { type ReactNode } from "react";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("text-center py-16", className)}>
      {icon && (
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
          {icon}
        </div>
      )}
      <p className="text-[var(--color-ink)] font-medium">{title}</p>
      {description && (
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{description}</p>
      )}
      {action && (
        action.href ? (
          <a href={action.href} className="inline-flex mt-4">
            <Button variant="link" className="text-[var(--color-accent)]">
              {action.label}
            </Button>
          </a>
        ) : (
          <Button
            variant="link"
            onClick={action.onClick}
            className="mt-4 text-[var(--color-accent)]"
          >
            {action.label}
          </Button>
        )
      )}
    </div>
  );
}
