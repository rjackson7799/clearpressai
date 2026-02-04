/**
 * ClearPress AI - Metric Card
 * Reusable card component for displaying metrics with optional trend
 */

import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { TrendIndicator } from './TrendIndicator';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: number;
  trendSuffix?: string;
  icon?: LucideIcon;
  iconColor?: string;
  loading?: boolean;
  className?: string;
}

export function MetricCard({
  title,
  value,
  description,
  trend,
  trendSuffix = '%',
  icon: Icon,
  iconColor,
  loading = false,
  className,
}: MetricCardProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <Icon
            className={cn('h-4 w-4 text-muted-foreground', iconColor)}
          />
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold">{value}</div>
          {trend !== undefined && (
            <TrendIndicator value={trend} suffix={trendSuffix} size="sm" />
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
