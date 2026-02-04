/**
 * ClearPress AI - Industry Selector
 * Multi-select component for selecting industries
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { useIndustries } from '@/hooks/use-industries';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

interface IndustrySelectorProps {
  value: string[];
  onChange: (ids: string[]) => void;
  error?: string;
}

export function IndustrySelector({ value, onChange, error }: IndustrySelectorProps) {
  const { t, language } = useLanguage();
  const { data: industries, isLoading } = useIndustries();

  const handleToggle = (industryId: string) => {
    if (value.includes(industryId)) {
      onChange(value.filter((id) => id !== industryId));
    } else {
      onChange([...value, industryId]);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700">
        {t('clients.selectIndustries')}
        <span className="text-red-500 ml-1">*</span>
      </Label>
      <div className="rounded-md border border-gray-200 p-3 space-y-3 max-h-48 overflow-y-auto">
        {industries?.map((industry) => (
          <div key={industry.id} className="flex items-center gap-3">
            <Checkbox
              id={`industry-${industry.id}`}
              checked={value.includes(industry.id)}
              onCheckedChange={() => handleToggle(industry.id)}
            />
            <Label
              htmlFor={`industry-${industry.id}`}
              className="text-sm font-normal text-gray-700 cursor-pointer"
            >
              {language === 'ja' ? industry.name_ja : industry.name_en}
            </Label>
          </div>
        ))}
        {industries?.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-2">
            {t('clients.noIndustries')}
          </p>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
