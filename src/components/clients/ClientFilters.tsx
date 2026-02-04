/**
 * ClearPress AI - Client Filters
 * Search and filter controls for the client list
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { useIndustries } from '@/hooks/use-industries';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';
import type { ClientFilters as FilterType } from '@/services/clients';

interface ClientFiltersProps {
  filters: FilterType;
  onFilterChange: (filters: Partial<FilterType>) => void;
}

export function ClientFilters({ filters, onFilterChange }: ClientFiltersProps) {
  const { t, language } = useLanguage();
  const { data: industries } = useIndustries();

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder={t('clients.searchPlaceholder')}
          value={filters.search ?? ''}
          onChange={(e) => onFilterChange({ search: e.target.value || undefined })}
          className="pl-9"
        />
      </div>

      {/* Industry Filter */}
      <Select
        value={filters.industry_id ?? 'all'}
        onValueChange={(value) =>
          onFilterChange({
            industry_id: value === 'all' ? undefined : value,
          })
        }
      >
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder={t('clients.filterByIndustry')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('clients.allIndustries')}</SelectItem>
          {industries?.map((industry) => (
            <SelectItem key={industry.id} value={industry.id}>
              {language === 'ja' ? industry.name_ja : industry.name_en}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
