import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold" +
  " transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" +
  " whitespace-nowrap",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-xs",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-xs",
        outline:
          "text-foreground border-border",
        success:
          "border-transparent bg-[var(--color-success-dim)] text-[var(--color-success)] border-[var(--color-success)/0.3]",
        warning:
          "border-transparent bg-[var(--color-warning-dim)] text-[var(--color-warning)] border-[var(--color-warning)/0.3]",
        info:
          "border-transparent bg-[var(--color-info-dim)] text-[var(--color-info)] border-[var(--color-info)/0.3]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { badgeVariants }
