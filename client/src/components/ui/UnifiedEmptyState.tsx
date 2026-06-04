import { cn } from "@/lib/utils";
import { Button } from "./button";

interface UnifiedEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
  compact?: boolean;
}

export function UnifiedEmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact = false,
}: UnifiedEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        "rounded-[var(--card-radius,16px)] border border-dashed border-[var(--card-border,var(--border-default))]",
        "bg-[var(--card-bg,var(--surface-raised))]",
        compact ? "py-8 px-4 gap-3" : "py-16 px-6 gap-4",
        className
      )}
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-primary-dim,var(--brand-500))]/10 text-[var(--color-primary,var(--brand-500))]">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-[var(--color-text-primary,var(--text-primary))]">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-[var(--color-text-secondary,var(--text-secondary))] max-w-xs">
          {description}
        </p>
      )}
      {action && (
        <Button size="sm" onClick={action.onClick} className="mt-1">
          {action.label}
        </Button>
      )}
    </div>
  );
}
