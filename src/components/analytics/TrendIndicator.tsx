/**
 * ClearPress AI - Trend Indicator
 * Visual indicator for metric trends (up/down/neutral)
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrendIndicatorProps {
  value: number;
  suffix?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TrendIndicator({
  value,
  suffix = '%',
  showValue = true,
  size = 'md',
  className,
}: TrendIndicatorProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const isNeutral = value === 0;

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1',
        isPositive && 'text-green-600 dark:text-green-400',
        isNegative && 'text-red-600 dark:text-red-400',
        isNeutral && 'text-muted-foreground',
        className
      )}
    >
      {isPositive && <TrendingUp className={iconSizes[size]} />}
      {isNegative && <TrendingDown className={iconSizes[size]} />}
      {isNeutral && <Minus className={iconSizes[size]} />}
      {showValue && (
        <span className={cn('font-medium', textSizes[size])}>
          {isPositive && '+'}
          {value}
          {suffix}
        </span>
      )}
    </div>
  );
}
