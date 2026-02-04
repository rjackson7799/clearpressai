import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Badge Variants - Precision Clarity Design System
 *
 * Includes semantic status badges for pharmaceutical workflow states
 */
const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border border-transparent px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-all duration-150 overflow-hidden",
  {
    variants: {
      variant: {
        // Core variants
        default: "bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        ghost: "[a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        link: "text-primary underline-offset-4 [a&]:hover:underline",

        // Vermillion accent (primary action indicator)
        vermillion:
          "bg-[oklch(95%_0.03_25)] text-[oklch(42%_0.2_25)] border-[oklch(55%_0.18_25)]/20",

        // Status badges - pharmaceutical workflow
        draft:
          "bg-[oklch(96%_0.004_260)] text-[oklch(55%_0.012_260)] border-[oklch(90%_0.006_260)]",
        "in-progress":
          "bg-[oklch(94%_0.035_240)] text-[oklch(45%_0.12_240)] border-[oklch(58%_0.12_240)]/20",
        "in-review":
          "bg-[oklch(94%_0.04_290)] text-[oklch(45%_0.14_290)] border-[oklch(58%_0.14_290)]/20",
        "needs-revision":
          "bg-[oklch(94%_0.04_55)] text-[oklch(50%_0.16_55)] border-[oklch(68%_0.16_55)]/20",
        approved:
          "bg-[oklch(94%_0.04_155)] text-[oklch(40%_0.14_155)] border-[oklch(52%_0.14_155)]/20",
        completed:
          "bg-[oklch(94%_0.04_155)] text-[oklch(40%_0.14_155)] border-[oklch(52%_0.14_155)]/20",

        // Compliance score badges
        "compliance-excellent":
          "bg-[oklch(94%_0.04_155)] text-[oklch(40%_0.14_155)] font-semibold",
        "compliance-good":
          "bg-[oklch(94%_0.035_155)] text-[oklch(45%_0.12_155)] font-semibold",
        "compliance-warning":
          "bg-[oklch(95%_0.04_75)] text-[oklch(50%_0.15_75)] font-semibold",
        "compliance-critical":
          "bg-[oklch(94%_0.035_28)] text-[oklch(45%_0.2_28)] font-semibold",

        // Urgency badges
        standard: "bg-muted text-muted-foreground",
        priority:
          "bg-[oklch(95%_0.04_75)] text-[oklch(55%_0.15_75)] border-[oklch(72%_0.15_75)]/30",
        urgent:
          "bg-[oklch(94%_0.04_45)] text-[oklch(50%_0.18_45)] border-[oklch(68%_0.18_45)]/30",
        crisis:
          "bg-[oklch(94%_0.035_28)] text-[oklch(45%_0.2_28)] border-[oklch(55%_0.2_28)]/30 animate-pulse",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[11px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface BadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean
}

function Badge({
  className,
  variant = "default",
  size,
  asChild = false,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
