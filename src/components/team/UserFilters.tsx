/**
 * ClearPress AI - User Filters
 * Search and filter controls for the user list
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';
import type { UserFilters as FilterType } from '@/services/users';

interface UserFiltersProps {
  filters: FilterType;
  onFilterChange: (filters: Partial<FilterType>) => void;
}

export function UserFilters({ filters, onFilterChange }: UserFiltersProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder={t('team.searchPlaceholder')}
          value={filters.search ?? ''}
          onChange={(e) => onFilterChange({ search: e.target.value || undefined })}
          className="pl-9"
        />
      </div>

      {/* Role Filter */}
      <Select
        value={filters.role ?? 'all'}
        onValueChange={(value) =>
          onFilterChange({
            role: value === 'all' ? undefined : (value as 'pr_admin' | 'pr_staff'),
          })
        }
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder={t('team.filterByRole')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('common.all')}</SelectItem>
          <SelectItem value="pr_admin">{t('roles.pr_admin')}</SelectItem>
          <SelectItem value="pr_staff">{t('roles.pr_staff')}</SelectItem>
        </SelectContent>
      </Select>

      {/* Status Filter */}
      <Select
        value={filters.is_active === undefined ? 'all' : String(filters.is_active)}
        onValueChange={(value) =>
          onFilterChange({
            is_active: value === 'all' ? undefined : value === 'true',
          })
        }
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder={t('team.filterByStatus')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('common.all')}</SelectItem>
          <SelectItem value="true">{t('profile.active')}</SelectItem>
          <SelectItem value="false">{t('profile.inactive')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
