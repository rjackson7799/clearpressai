/**
 * ClearPress AI - Date Range Selector
 * Dropdown selector for analytics date range
 */

import { Calendar } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';

export type DateRangePreset = '7d' | '30d' | '90d' | '1y';

interface DateRangeSelectorProps {
  value: DateRangePreset;
  onChange: (value: DateRangePreset) => void;
  className?: string;
}

export function DateRangeSelector({
  value,
  onChange,
  className,
}: DateRangeSelectorProps) {
  const { t } = useLanguage();

  return (
    <Select value={value} onValueChange={(v) => onChange(v as DateRangePreset)}>
      <SelectTrigger className={className}>
        <Calendar className="h-4 w-4 mr-2" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="7d">{t('analytics.dateRange.7d')}</SelectItem>
        <SelectItem value="30d">{t('analytics.dateRange.30d')}</SelectItem>
        <SelectItem value="90d">{t('analytics.dateRange.90d')}</SelectItem>
        <SelectItem value="1y">{t('analytics.dateRange.1y')}</SelectItem>
      </SelectContent>
    </Select>
  );
}

/**
 * Convert date range preset to actual dates
 */
export function getDateRangeFromPreset(preset: DateRangePreset): {
  from: string;
  to: string;
} {
  const to = new Date();
  const from = new Date();

  switch (preset) {
    case '7d':
      from.setDate(from.getDate() - 7);
      break;
    case '30d':
      from.setDate(from.getDate() - 30);
      break;
    case '90d':
      from.setDate(from.getDate() - 90);
      break;
    case '1y':
      from.setFullYear(from.getFullYear() - 1);
      break;
  }

  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}
