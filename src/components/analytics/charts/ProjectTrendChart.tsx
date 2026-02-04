/**
 * ClearPress AI - Project Trend Chart
 * Line chart showing project trends over time
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ProjectTrendDataPoint } from '@/services/analytics';

interface ProjectTrendChartProps {
  data: ProjectTrendDataPoint[];
  height?: number;
}

export function ProjectTrendChart({ data, height = 300 }: ProjectTrendChartProps) {
  const { t, language } = useLanguage();

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return language === 'ja'
      ? `${date.getMonth() + 1}/${date.getDate()}`
      : `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // Custom tooltip
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: { name: string; value: number; color: string }[];
    label?: string;
  }) => {
    if (!active || !payload || !payload.length) return null;

    const date = new Date(label ?? '');
    const formattedDate =
      language === 'ja'
        ? `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
        : date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });

    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3">
        <p className="font-medium text-sm mb-2">{formattedDate}</p>
        {payload.map((item, index) => (
          <p key={index} className="text-sm" style={{ color: item.color }}>
            {item.name}: {item.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line
          type="monotone"
          dataKey="total"
          name={t('analytics.totalProjects')}
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="in_progress"
          name={t('analytics.inProgress')}
          stroke="hsl(var(--chart-2))"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="completed"
          name={t('analytics.completed')}
          stroke="hsl(var(--chart-3))"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
