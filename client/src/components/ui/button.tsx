import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2, Check } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium" +
  " focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" +
  " disabled:pointer-events-none disabled:opacity-40" +
  " [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0" +
  " transition-all duration-150 ease-out" +
  " active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border border-primary-border" +
          " shadow-xs hover:shadow-md hover:brightness-110",
        destructive:
          "bg-destructive text-destructive-foreground border border-destructive-border" +
          " shadow-xs hover:shadow-md",
        outline:
          "border border-border bg-background shadow-xs" +
          " hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground border border-secondary-border" +
          " shadow-xs hover:bg-muted/80",
        ghost:
          "border border-transparent hover:bg-muted/60",
        link:
          "text-primary underline-offset-4 hover:underline" +
          " active:scale-100",
        glow:
          "bg-primary text-primary-foreground border border-primary-border" +
          " shadow-[0_0_0_0_transparent]" +
          " hover:shadow-[0_0_20px_var(--brand-500/0.5)] hover:brightness-110",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-8 text-base",
        xl: "h-12 rounded-xl px-10 text-base font-semibold",
        icon: "size-10 rounded-lg",
        "icon-sm": "size-8 rounded-md",
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
  asChild?: boolean
  loading?: boolean
  success?: boolean
  ref?: React.Ref<HTMLButtonElement>
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  loading,
  success,
  disabled,
  children,
  ref,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(
        buttonVariants({ variant, size }),
        success && "!bg-[var(--color-success)] !border-[var(--color-success)] !text-white",
        className
      )}
      ref={ref}
      disabled={disabled || loading}
      {...props}
    >
      {asChild ? children : (
        <>
          {loading ? <Loader2 className="animate-spin size-4" /> : success ? <Check className="size-4" /> : null}
          {children}
        </>
      )}
    </Comp>
  )
}

export { buttonVariants }
