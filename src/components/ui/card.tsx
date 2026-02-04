import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Card Variants - Precision Clarity Design System
 *
 * - elevated: Floating card with shadow, lifts on hover (default for client portal)
 * - flat: Simple bordered card (minimal style)
 * - sunken: Recessed appearance for nested content
 * - glass: Frosted glass effect for overlays
 */
const cardVariants = cva(
  "flex flex-col gap-6 rounded-xl text-card-foreground",
  {
    variants: {
      variant: {
        default: "bg-card border shadow-sm",
        elevated: [
          "bg-card",
          "shadow-[0_4px_20px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.02)]",
          "transition-all duration-150 ease-out",
          "hover:shadow-[0_8px_30px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.04)]",
          "hover:-translate-y-0.5",
          "active:scale-[0.99]",
        ].join(" "),
        flat: "bg-card border border-border",
        sunken: "bg-muted/50 border border-border/50",
        glass: [
          "bg-white/80 backdrop-blur-xl",
          "border border-white/20",
          "shadow-[0_4px_30px_rgba(0,0,0,0.1)]",
        ].join(" "),
        ghost: "bg-transparent",
      },
      padding: {
        default: "py-6",
        compact: "py-4",
        none: "py-0",
      },
      interactive: {
        true: "cursor-pointer select-none",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
      interactive: false,
    },
  }
)

interface CardProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof cardVariants> {
  asChild?: boolean
}

function Card({
  className,
  variant,
  padding,
  interactive,
  ...props
}: CardProps) {
  return (
    <div
      data-slot="card"
      data-variant={variant}
      className={cn(cardVariants({ variant, padding, interactive }), className)}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "leading-none font-semibold font-display tracking-tight",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  cardVariants,
}
