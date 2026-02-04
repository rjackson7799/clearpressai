import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Button Variants - Precision Clarity Design System
 *
 * Includes vermillion (朱色) variant for primary actions
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
        // Vermillion - primary action (approval, submit)
        vermillion: [
          "bg-[oklch(55%_0.18_25)] text-white",
          "hover:bg-[oklch(48%_0.2_25)]",
          "active:bg-[oklch(42%_0.22_25)]",
          "shadow-sm shadow-[oklch(55%_0.18_25)]/25",
          "focus-visible:ring-[oklch(55%_0.18_25)]",
        ].join(" "),
        // Success - for approved states
        success: [
          "bg-[oklch(52%_0.14_155)] text-white",
          "hover:bg-[oklch(46%_0.15_155)]",
          "shadow-sm shadow-[oklch(52%_0.14_155)]/25",
          "focus-visible:ring-[oklch(52%_0.14_155)]",
        ].join(" "),
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 shadow-sm focus-visible:ring-destructive dark:bg-destructive/80",
        outline:
          "border border-border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-xs",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
        // Glass - for floating actions
        glass: [
          "bg-white/80 backdrop-blur-lg text-foreground",
          "border border-white/30",
          "hover:bg-white/90",
          "shadow-lg shadow-black/5",
        ].join(" "),
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        xs: "h-7 gap-1 rounded-md px-2.5 text-xs has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-11 rounded-lg px-6 has-[>svg]:px-5 text-base",
        xl: "h-12 rounded-xl px-8 has-[>svg]:px-6 text-base font-semibold",
        icon: "size-10",
        "icon-xs": "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-8 [&_svg:not([class*='size-'])]:size-4",
        "icon-lg": "size-11 [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button"
  const isDisabled = disabled || loading

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-loading={loading || undefined}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          <span className="sr-only">Loading...</span>
          {typeof children === "string" ? children : null}
        </>
      ) : (
        children
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
