/**
 * ClearPress AI - Project Filters
 * Search and filter controls for the project list
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { useClients } from '@/hooks/use-clients';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';
import type { ProjectFilters as FilterType, ProjectStatus, UrgencyLevel } from '@/types';

interface ProjectFiltersProps {
  filters: FilterType;
  onFilterChange: (filters: Partial<FilterType>) => void;
}

export function ProjectFilters({ filters, onFilterChange }: ProjectFiltersProps) {
  const { t } = useLanguage();
  const { data: clientsData } = useClients({ per_page: 100 });

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder={t('projects.searchPlaceholder')}
          value={filters.search ?? ''}
          onChange={(e) => onFilterChange({ search: e.target.value || undefined })}
          className="pl-9"
        />
      </div>

      {/* Client Filter */}
      <Select
        value={filters.client_id ?? 'all'}
        onValueChange={(value) =>
          onFilterChange({
            client_id: value === 'all' ? undefined : value,
          })
        }
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder={t('projects.filterByClient')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('projects.allClients')}</SelectItem>
          {clientsData?.data.map((client) => (
            <SelectItem key={client.id} value={client.id}>
              {client.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status Filter */}
      <Select
        value={filters.status?.[0] ?? 'all'}
        onValueChange={(value) =>
          onFilterChange({
            status: value === 'all' ? undefined : [value as ProjectStatus],
          })
        }
      >
        <SelectTrigger className="w-full sm:w-[150px]">
          <SelectValue placeholder={t('projects.filterByStatus')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('projects.allStatuses')}</SelectItem>
          <SelectItem value="requested">{t('projects.status_requested')}</SelectItem>
          <SelectItem value="in_progress">{t('projects.status_in_progress')}</SelectItem>
          <SelectItem value="in_review">{t('projects.status_in_review')}</SelectItem>
          <SelectItem value="approved">{t('projects.status_approved')}</SelectItem>
          <SelectItem value="completed">{t('projects.status_completed')}</SelectItem>
          <SelectItem value="archived">{t('projects.status_archived')}</SelectItem>
        </SelectContent>
      </Select>

      {/* Urgency Filter */}
      <Select
        value={filters.urgency?.[0] ?? 'all'}
        onValueChange={(value) =>
          onFilterChange({
            urgency: value === 'all' ? undefined : [value as UrgencyLevel],
          })
        }
      >
        <SelectTrigger className="w-full sm:w-[140px]">
          <SelectValue placeholder={t('projects.filterByUrgency')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('projects.allUrgencies')}</SelectItem>
          <SelectItem value="standard">{t('urgency.standard')}</SelectItem>
          <SelectItem value="priority">{t('urgency.priority')}</SelectItem>
          <SelectItem value="urgent">{t('urgency.urgent')}</SelectItem>
          <SelectItem value="crisis">{t('urgency.crisis')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
