import { MinusIcon, PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface StepperProps {
  value: number
  onValueChange: (value: number) => void
  min?: number
  max?: number
  className?: string
  disabled?: boolean
  "aria-label"?: string
}

// [−] value [+] numeric stepper for bounded small integers. Clamps to
// [min, max] and disables the end buttons at the bounds.
export function Stepper({
  value,
  onValueChange,
  min = 1,
  max = 99,
  className,
  disabled,
  ...aria
}: StepperProps) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next))
  return (
    <div
      className={cn("inline-flex items-center gap-1", className)}
      aria-label={aria["aria-label"]}
    >
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        disabled={disabled || value <= min}
        onClick={() => onValueChange(clamp(value - 1))}
        aria-label="decrease"
      >
        <MinusIcon />
      </Button>
      <span className="min-w-8 text-center text-sm font-medium tabular-nums">
        {value}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        disabled={disabled || value >= max}
        onClick={() => onValueChange(clamp(value + 1))}
        aria-label="increase"
      >
        <PlusIcon />
      </Button>
    </div>
  )
}
