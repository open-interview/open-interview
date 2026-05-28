import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2, Check } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[8px] text-sm font-medium" +
  " focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2" +
  " disabled:pointer-events-none disabled:opacity-40" +
  " [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0" +
  " transition-colors duration-150 ease-out" +
  " active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--accent)] text-[var(--accent-fg)] hover:opacity-90",
        destructive:
          "bg-[var(--error)] text-white hover:opacity-90",
        outline:
          "border border-[var(--border)] bg-transparent hover:bg-[var(--surface-elevated)] text-[var(--fg)]",
        secondary:
          "bg-[var(--surface-elevated)] text-[var(--fg)] hover:opacity-80",
        ghost: "hover:bg-[var(--surface-elevated)] text-[var(--fg)]",
        link: "text-[var(--accent)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-7 rounded-[6px] px-3 text-xs",
        lg: "h-11 rounded-[8px] px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  success?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, success, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size }),
          success && "!bg-green-600 !border-green-500 !text-white",
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {asChild ? children : (
          <>
            {loading ? <Loader2 className="animate-spin" /> : success ? <Check /> : null}
            {children}
          </>
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
