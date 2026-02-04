/**
 * ClearPress AI - Clients Page
 * Client list management for PR Portal
 */

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useClients } from '@/hooks/use-clients';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';
import {
  ClientTable,
  ClientFilters,
  EmptyClientState,
  CreateClientDialog,
  EditClientDialog,
  DeleteClientDialog,
} from '@/components/clients';
import type { ClientFilters as FilterType } from '@/services/clients';
import type { Client } from '@/types';

// Loading skeleton for the table
function ClientTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 p-4">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16 ml-auto" />
          </div>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-4">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <div className="flex gap-1 ml-auto">
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ClientsPage() {
  const { t } = useLanguage();
  const { isPRAdmin } = useAuth();
  const [filters, setFilters] = useState<FilterType>({ page: 1, per_page: 20 });

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

  const { data, isLoading, error } = useClients(filters);

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<FilterType>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  // Handle edit click
  const handleEdit = (client: Client) => {
    setEditingClient(client);
  };

  // Handle delete click
  const handleDelete = (client: Client) => {
    setDeletingClient(client);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {t('clients.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{t('clients.subtitle')}</p>
        </div>
        {isPRAdmin && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('clients.newClient')}
          </Button>
        )}
      </div>

      {/* Filters */}
      <ClientFilters filters={filters} onFilterChange={handleFilterChange} />

      {/* Content */}
      {isLoading ? (
        <ClientTableSkeleton />
      ) : error ? (
        <div className="text-center py-12 text-red-500">{t('common.error')}</div>
      ) : data?.data.length === 0 ? (
        <EmptyClientState
          onCreateClient={() => setCreateDialogOpen(true)}
          showCreateButton={isPRAdmin}
        />
      ) : (
        <ClientTable
          clients={data?.data ?? []}
          pagination={{
            page: data?.page ?? 1,
            totalPages: data?.total_pages ?? 1,
            total: data?.total ?? 0,
            perPage: data?.per_page ?? 20,
          }}
          onPageChange={handlePageChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Create Client Dialog */}
      <CreateClientDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {/* Edit Client Dialog */}
      <EditClientDialog
        client={editingClient}
        open={!!editingClient}
        onOpenChange={(open) => !open && setEditingClient(null)}
      />

      {/* Delete Client Dialog */}
      <DeleteClientDialog
        client={deletingClient}
        open={!!deletingClient}
        onOpenChange={(open) => !open && setDeletingClient(null)}
      />
    </div>
  );
}
