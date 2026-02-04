/**
 * ClearPress AI - Circular Progress Component
 * Precision Clarity Design System
 *
 * Animated circular gauge for compliance scores
 */

import * as React from "react"
import { cn } from "@/lib/utils"

interface CircularProgressProps {
  /** Value from 0 to 100 */
  value: number
  /** Size of the component in pixels */
  size?: number
  /** Stroke width of the progress ring */
  strokeWidth?: number
  /** Color variant based on score thresholds */
  variant?: "excellent" | "good" | "warning" | "critical" | "auto"
  /** Whether to animate the ring on mount */
  animate?: boolean
  /** Show the value in the center */
  showValue?: boolean
  /** Custom label below the value */
  label?: string
  /** Additional class names */
  className?: string
  /** Children to render in the center (overrides showValue) */
  children?: React.ReactNode
}

// Get color based on score value
function getColorForScore(score: number): string {
  if (score >= 90) return "oklch(52% 0.14 155)" // Teal - Excellent
  if (score >= 70) return "oklch(58% 0.12 155)" // Green - Good
  if (score >= 50) return "oklch(72% 0.15 75)"  // Amber - Warning
  return "oklch(55% 0.2 28)"                    // Red - Critical
}

// Get variant color
function getVariantColor(variant: CircularProgressProps["variant"], value: number): string {
  if (variant === "auto" || !variant) return getColorForScore(value)

  const colors = {
    excellent: "oklch(52% 0.14 155)",
    good: "oklch(58% 0.12 155)",
    warning: "oklch(72% 0.15 75)",
    critical: "oklch(55% 0.2 28)",
  }

  return colors[variant]
}

// Get background color (lighter version)
function getBackgroundColor(variant: CircularProgressProps["variant"], value: number): string {
  if (variant === "auto" || !variant) {
    if (value >= 90) return "oklch(94% 0.04 155)"
    if (value >= 70) return "oklch(94% 0.035 155)"
    if (value >= 50) return "oklch(95% 0.04 75)"
    return "oklch(94% 0.035 28)"
  }

  const colors = {
    excellent: "oklch(94% 0.04 155)",
    good: "oklch(94% 0.035 155)",
    warning: "oklch(95% 0.04 75)",
    critical: "oklch(94% 0.035 28)",
  }

  return colors[variant]
}

export function CircularProgress({
  value,
  size = 120,
  strokeWidth = 8,
  variant = "auto",
  animate = true,
  showValue = true,
  label,
  className,
  children,
}: CircularProgressProps) {
  const [mounted, setMounted] = React.useState(false)
  const normalizedValue = Math.min(100, Math.max(0, value))

  // Calculate SVG parameters
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (normalizedValue / 100) * circumference

  // Get colors
  const progressColor = getVariantColor(variant, normalizedValue)
  const trackColor = "oklch(92% 0.005 80)"
  const bgColor = getBackgroundColor(variant, normalizedValue)

  // Trigger animation after mount
  React.useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => setMounted(true), 50)
      return () => clearTimeout(timer)
    }
    setMounted(true)
  }, [animate])

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        className
      )}
      style={{ width: size, height: size }}
    >
      {/* Background circle */}
      <div
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: bgColor }}
      />

      {/* SVG Progress Ring */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />

        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={mounted ? offset : circumference}
          style={{
            transition: animate
              ? "stroke-dashoffset 800ms cubic-bezier(0.16, 1, 0.3, 1)"
              : "none",
          }}
        />
      </svg>

      {/* Center Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children ? (
          children
        ) : showValue ? (
          <>
            <span
              className="font-mono font-semibold tabular-nums"
              style={{
                fontSize: size * 0.22,
                color: progressColor,
              }}
            >
              {Math.round(normalizedValue)}
            </span>
            {label && (
              <span
                className="text-muted-foreground font-medium"
                style={{ fontSize: size * 0.1 }}
              >
                {label}
              </span>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}

/**
 * Smaller variant for inline compliance indicators
 */
interface CompactCircularProgressProps {
  value: number
  size?: number
  className?: string
}

export function CompactCircularProgress({
  value,
  size = 32,
  className,
}: CompactCircularProgressProps) {
  const strokeWidth = 3
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference
  const progressColor = getColorForScore(value)

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="oklch(92% 0.005 80)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span
        className="absolute font-mono text-[10px] font-semibold"
        style={{ color: progressColor }}
      >
        {Math.round(value)}
      </span>
    </div>
  )
}

export default CircularProgress
