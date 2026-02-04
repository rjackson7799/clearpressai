/**
 * ClearPress AI - Segmented Control Component
 * Precision Clarity Design System
 *
 * iOS-style segmented control with animated sliding indicator
 */

import * as React from "react"
import { cn } from "@/lib/utils"

interface SegmentOption {
  value: string
  label: string
  count?: number
  icon?: React.ReactNode
}

interface SegmentedControlProps {
  /** Available options */
  options: SegmentOption[]
  /** Currently selected value */
  value: string
  /** Callback when selection changes */
  onValueChange: (value: string) => void
  /** Size variant */
  size?: "sm" | "default" | "lg"
  /** Full width mode */
  fullWidth?: boolean
  /** Additional class names */
  className?: string
}

export function SegmentedControl({
  options,
  value,
  onValueChange,
  size = "default",
  fullWidth = false,
  className,
}: SegmentedControlProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = React.useState<React.CSSProperties>({})

  // Calculate indicator position based on selected value
  React.useEffect(() => {
    if (!containerRef.current) return

    const selectedIndex = options.findIndex((opt) => opt.value === value)
    if (selectedIndex === -1) return

    const buttons = containerRef.current.querySelectorAll("[data-segment-button]")
    const selectedButton = buttons[selectedIndex] as HTMLElement

    if (selectedButton) {
      setIndicatorStyle({
        width: selectedButton.offsetWidth,
        transform: `translateX(${selectedButton.offsetLeft}px)`,
      })
    }
  }, [value, options])

  // Size variants
  const sizeClasses = {
    sm: "h-8 text-xs",
    default: "h-10 text-sm",
    lg: "h-12 text-base",
  }

  const buttonPadding = {
    sm: "px-2.5",
    default: "px-4",
    lg: "px-5",
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative inline-flex items-center rounded-lg bg-muted p-1",
        fullWidth && "w-full",
        sizeClasses[size],
        className
      )}
      role="radiogroup"
    >
      {/* Sliding indicator */}
      <div
        className={cn(
          "absolute top-1 bottom-1 rounded-md bg-card shadow-sm",
          "transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        )}
        style={indicatorStyle}
      />

      {/* Options */}
      {options.map((option) => {
        const isSelected = option.value === value

        return (
          <button
            key={option.value}
            data-segment-button
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "relative z-10 flex items-center justify-center gap-1.5 rounded-md font-medium",
              "transition-colors duration-150",
              buttonPadding[size],
              fullWidth && "flex-1",
              isSelected
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground/80"
            )}
          >
            {option.icon && (
              <span className="shrink-0">{option.icon}</span>
            )}
            <span>{option.label}</span>
            {option.count !== undefined && option.count > 0 && (
              <span
                className={cn(
                  "ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                  isSelected
                    ? "bg-primary/10 text-primary"
                    : "bg-muted-foreground/10 text-muted-foreground"
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Vertical variant for sidebar filters
 */
interface VerticalSegmentedControlProps {
  options: SegmentOption[]
  value: string
  onValueChange: (value: string) => void
  className?: string
}

export function VerticalSegmentedControl({
  options,
  value,
  onValueChange,
  className,
}: VerticalSegmentedControlProps) {
  return (
    <div
      className={cn("flex flex-col gap-1", className)}
      role="radiogroup"
    >
      {options.map((option) => {
        const isSelected = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium",
              "transition-all duration-150",
              isSelected
                ? "bg-card shadow-sm border-l-3 border-primary text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <span className="flex items-center gap-2">
              {option.icon && <span className="shrink-0">{option.icon}</span>}
              <span>{option.label}</span>
            </span>
            {option.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                  isSelected
                    ? "bg-primary/10 text-primary"
                    : "bg-muted-foreground/10 text-muted-foreground"
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default SegmentedControl
