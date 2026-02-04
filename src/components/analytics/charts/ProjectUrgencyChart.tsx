/**
 * ClearPress AI - Project Urgency Chart
 * Bar chart showing project urgency distribution
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ProjectUrgencyDistribution } from '@/services/analytics';

interface ProjectUrgencyChartProps {
  data: ProjectUrgencyDistribution[];
  height?: number;
}

// Urgency colors - matching the urgency badge colors
const URGENCY_COLORS: Record<string, string> = {
  standard: 'hsl(var(--chart-5))', // Green-ish
  priority: 'hsl(var(--chart-2))', // Blue-ish
  urgent: 'hsl(var(--chart-3))', // Orange-ish
  crisis: 'hsl(var(--destructive))', // Red
};

export function ProjectUrgencyChart({ data, height = 300 }: ProjectUrgencyChartProps) {
  const { t } = useLanguage();

  // Map to chart data with labels
  const chartData = data.map((item) => ({
    name: t(`urgency.${item.urgency}`),
    value: item.count,
    percentage: item.percentage,
    urgency: item.urgency,
  }));

  // Custom tooltip
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: { payload: { name: string; value: number; percentage: number } }[];
  }) => {
    if (!active || !payload || !payload.length) return null;

    const item = payload[0].payload;
    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3">
        <p className="font-medium text-sm">{item.name}</p>
        <p className="text-sm text-muted-foreground">
          {item.value} {t('analytics.projects')} ({item.percentage}%)
        </p>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={URGENCY_COLORS[entry.urgency] || 'hsl(var(--primary))'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
