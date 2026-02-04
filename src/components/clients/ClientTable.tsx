/**
 * ClearPress AI - Client Table
 * Table component for displaying client list with pagination
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { formatTranslation } from '@/lib/translations';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ClientRow } from './ClientRow';
import type { Client, Industry } from '@/types';

// Extended client type with relations
interface ClientWithRelations extends Client {
  client_industries?: Array<{ industry: Industry }>;
  projects?: Array<{ count: number }>;
  client_users?: Array<{ count: number }>;
}

interface ClientTableProps {
  clients: ClientWithRelations[];
  pagination: {
    page: number;
    totalPages: number;
    total: number;
    perPage: number;
  };
  onPageChange: (page: number) => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

export function ClientTable({
  clients,
  pagination,
  onPageChange,
  onEdit,
  onDelete,
}: ClientTableProps) {
  const { t } = useLanguage();

  // Calculate showing range
  const from = (pagination.page - 1) * pagination.perPage + 1;
  const to = Math.min(pagination.page * pagination.perPage, pagination.total);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {t('clients.clientName')}
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {t('clients.industry')}
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {t('clients.projects')}
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {t('clients.users')}
              </TableHead>
              <TableHead className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                {t('clients.actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <ClientRow
                key={client.id}
                client={client}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {formatTranslation(t('clients.showing'), {
              from,
              to,
              total: pagination.total,
            })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600">
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
