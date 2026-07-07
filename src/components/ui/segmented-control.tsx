import * as React from "react"

import { cn } from "@/lib/utils"

export interface SegmentedOption<V extends string> {
  value: V
  label: React.ReactNode
}

interface SegmentedControlProps<V extends string> {
  value: V
  onValueChange: (value: V) => void
  options: readonly SegmentedOption<V>[]
  className?: string
  disabled?: boolean
  "aria-label"?: string
}

// Pill-track segmented control (iOS-style). Radio semantics, `type="button"`
// so it never submits the enclosing form. Matches the shadcn Tabs default
// look: bg-muted track, active segment raised to bg-background + shadow.
export function SegmentedControl<V extends string>({
  value,
  onValueChange,
  options,
  className,
  disabled,
  ...aria
}: SegmentedControlProps<V>) {
  return (
    <div
      role="radiogroup"
      aria-label={aria["aria-label"]}
      data-slot="segmented-control"
      className={cn(
        "inline-flex items-center gap-1 rounded-lg bg-muted p-[3px]",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "inline-flex h-7 items-center justify-center rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
