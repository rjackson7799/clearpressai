/**
 * ClearPress AI - Content Type Chart
 * Horizontal bar chart showing content type distribution
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';

interface ContentTypeData {
  type: string;
  count: number;
  percentage: number;
}

interface ContentTypeChartProps {
  data: ContentTypeData[];
  height?: number;
}

export function ContentTypeChart({ data, height = 250 }: ContentTypeChartProps) {
  const { t } = useLanguage();

  // Map to chart data with translated labels
  const chartData = data.map((item) => ({
    name: t(`content.${item.type}`),
    value: item.count,
    percentage: item.percentage,
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
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis type="number" tick={{ fontSize: 12 }} className="text-muted-foreground" />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
          width={90}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
        <Bar
          dataKey="value"
          fill="hsl(var(--primary))"
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
