/**
 * ClearPress AI - Team Page
 * User management for PR Admins
 */

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers, type UserFilters } from '@/hooks/use-users';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UserPlus } from 'lucide-react';
import {
  UserTable,
  UserFilters as UserFiltersComponent,
  EmptyTeamState,
  InviteUserDialog,
} from '@/components/team';

// Loading skeleton for the table
function UserTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 p-4">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16 ml-auto" />
          </div>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 ml-auto rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TeamPage() {
  const { t } = useLanguage();
  const { isPRAdmin } = useAuth();
  const [filters, setFilters] = useState<UserFilters>({ page: 1, per_page: 20 });
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const { data, isLoading, error } = useUsers(filters);

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<UserFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {t('team.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{t('team.subtitle')}</p>
        </div>
        {isPRAdmin && (
          <Button onClick={() => setInviteDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            {t('team.inviteUser')}
          </Button>
        )}
      </div>

      {/* Filters */}
      <UserFiltersComponent filters={filters} onFilterChange={handleFilterChange} />

      {/* Content */}
      {isLoading ? (
        <UserTableSkeleton />
      ) : error ? (
        <div className="text-center py-12 text-red-500">{t('common.error')}</div>
      ) : data?.data.length === 0 ? (
        <EmptyTeamState onInvite={() => setInviteDialogOpen(true)} />
      ) : (
        <UserTable
          users={data?.data ?? []}
          pagination={{
            page: data?.page ?? 1,
            totalPages: data?.total_pages ?? 1,
            total: data?.total ?? 0,
            perPage: data?.per_page ?? 20,
          }}
          onPageChange={handlePageChange}
        />
      )}

      {/* Invite Dialog */}
      <InviteUserDialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen} />
    </div>
  );
}
