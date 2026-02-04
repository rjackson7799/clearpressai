/**
 * ClearPress AI - Project Status Chart
 * Pie chart showing project status distribution
 */

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ProjectStatusDistribution } from '@/services/analytics';

interface ProjectStatusChartProps {
  data: ProjectStatusDistribution[];
  height?: number;
}

// Status colors matching the design system
const STATUS_COLORS: Record<string, string> = {
  requested: 'hsl(var(--chart-1))',
  in_progress: 'hsl(var(--chart-2))',
  in_review: 'hsl(var(--chart-3))',
  approved: 'hsl(var(--chart-4))',
  completed: 'hsl(var(--chart-5))',
  archived: 'hsl(var(--muted-foreground))',
};

export function ProjectStatusChart({ data, height = 300 }: ProjectStatusChartProps) {
  const { t } = useLanguage();

  // Filter out zero values and map to chart data
  const chartData = data
    .filter((item) => item.count > 0)
    .map((item) => ({
      name: t(`projects.status_${item.status}`),
      value: item.count,
      percentage: item.percentage,
      status: item.status,
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
          {item.value} ({item.percentage}%)
        </p>
      </div>
    );
  };


  if (chartData.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground"
        style={{ height }}
      >
        {t('analytics.noData')}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={STATUS_COLORS[entry.status] || 'hsl(var(--muted))'}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          layout="horizontal"
          verticalAlign="bottom"
          align="center"
          wrapperStyle={{ paddingTop: 20 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
