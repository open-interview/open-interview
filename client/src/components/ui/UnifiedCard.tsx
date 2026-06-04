import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";
import { microInteractions } from "@/lib/motion";

interface UnifiedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  press?: boolean;
  compact?: boolean;
}

export function UnifiedCard({
  className,
  hover = true,
  press = true,
  compact = false,
  ...props
}: UnifiedCardProps) {
  const isInteractive = hover || press;

  if (isInteractive) {
    // Safe cast: motion.div accepts all HTML div props; gesture type differences
    // (e.g. onDrag) don't occur in practice for card components.
    const motionProps = props as unknown as React.ComponentProps<typeof motion.div>;
    return (
      <motion.div
        className={cn(
          "rounded-[var(--card-radius,16px)] border border-[var(--card-border,var(--border-default))]",
          "bg-[var(--card-bg,var(--surface-raised))]",
          "transition-all duration-200",
          hover && "hover:border-[var(--card-border-hover,var(--border-strong))] hover:shadow-md",
          press && "active:scale-[0.98]",
          compact ? "p-3" : "p-4 sm:p-6",
          className
        )}
        {...(hover ? { whileHover: microInteractions.card.whileHover } : {})}
        {...(press ? { whileTap: microInteractions.card.whileTap } : {})}
        {...motionProps}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-[var(--card-radius,16px)] border border-[var(--card-border,var(--border-default))]",
        "bg-[var(--card-bg,var(--surface-raised))]",
        compact ? "p-3" : "p-4 sm:p-6",
        className
      )}
      {...props}
    />
  );
}

export function UnifiedCardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 mb-3", className)}
      {...props}
    />
  );
}

export function UnifiedCardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "font-semibold leading-tight text-[var(--color-text-primary,var(--text-primary))]",
        "text-lg",
        className
      )}
      {...props}
    />
  );
}

export function UnifiedCardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-sm text-[var(--color-text-secondary,var(--text-secondary))]",
        className
      )}
      {...props}
    />
  );
}

export function UnifiedCardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("", className)} {...props} />;
}

export function UnifiedCardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 mt-3 pt-3 border-t border-[var(--card-border,var(--border-default))]",
        className
      )}
      {...props}
    />
  );
}
