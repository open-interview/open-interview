import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2, Check } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium tracking-[0.0089em]" +
  " focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background" +
  " disabled:pointer-events-none disabled:opacity-40" +
  " [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0" +
  " transition-colors duration-150 ease-out" +
  " active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:brightness-110",
        destructive:
          "bg-destructive text-destructive-foreground hover:brightness-110",
        outline:
          "border border-border bg-transparent text-foreground hover:bg-[color-mix(in_srgb,var(--primary)_8%,transparent)]",
        secondary:
          "bg-secondary text-secondary-foreground hover:brightness-110",
        ghost: "border border-transparent text-foreground hover:bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]",
        link: "text-primary underline-offset-4 hover:underline",
        glow:
          "bg-primary text-primary-foreground hover:brightness-110",
      },
      size: {
        default: "min-min-h-[48px] h-10 px-6 py-2",
        sm: "min-min-h-[48px] h-8 rounded-full px-4 text-xs",
        lg: "min-h-12 rounded-full px-8",
        icon: "min-h-[48px] h-10 min-w-[48px] w-10 rounded-full",
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
        {loading ? <Loader2 className="animate-spin" /> : success ? <Check /> : null}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
