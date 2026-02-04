/**
 * ClearPress AI - Client Row
 * Table row component for displaying client information
 */

import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { TableRow, TableCell } from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Pencil, Trash2, FolderKanban, Users } from 'lucide-react';
import { formatTranslation } from '@/lib/translations';
import type { Client, Industry } from '@/types';

// Extended client type with relations from the query
interface ClientWithRelations extends Client {
  client_industries?: Array<{ industry: Industry }>;
  projects?: Array<{ count: number }>;
  client_users?: Array<{ count: number }>;
}

interface ClientRowProps {
  client: ClientWithRelations;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

export function ClientRow({ client, onEdit, onDelete }: ClientRowProps) {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { isPRAdmin } = useAuth();

  // Get client initials for avatar fallback
  const initials = client.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Extract industries from relations
  const industries = client.client_industries?.map((ci) => ci.industry) ?? [];

  // Extract counts from relations
  const projectsCount = client.projects?.[0]?.count ?? 0;
  const usersCount = client.client_users?.[0]?.count ?? 0;

  const handleViewDetails = () => {
    navigate(`/pr/clients/${client.id}`);
  };

  const handleRowClick = () => {
    navigate(`/pr/clients/${client.id}`);
  };

  return (
    <TableRow
      className="hover:bg-gray-50 cursor-pointer"
      onClick={handleRowClick}
    >
      {/* Client with Logo */}
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            {client.logo_url && (
              <AvatarImage src={client.logo_url} alt={client.name} />
            )}
            <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">{client.name}</p>
            {client.description && (
              <p className="text-sm text-gray-500 truncate max-w-[200px]">
                {client.description}
              </p>
            )}
          </div>
        </div>
      </TableCell>

      {/* Industries */}
      <TableCell onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-wrap gap-1">
          {industries.length === 0 ? (
            <span className="text-gray-400 text-sm">-</span>
          ) : (
            <>
              {industries.slice(0, 2).map((industry) => (
                <Badge
                  key={industry.id}
                  variant="secondary"
                  className="bg-gray-100 text-gray-700 font-normal text-xs"
                >
                  {language === 'ja' ? industry.name_ja : industry.name_en}
                </Badge>
              ))}
              {industries.length > 2 && (
                <Badge variant="secondary" className="bg-gray-100 text-gray-500 font-normal text-xs">
                  +{industries.length - 2}
                </Badge>
              )}
            </>
          )}
        </div>
      </TableCell>

      {/* Projects Count */}
      <TableCell>
        <div className="flex items-center gap-1.5 text-gray-600">
          <FolderKanban className="h-4 w-4 text-gray-400" />
          <span className="text-sm">
            {formatTranslation(t('clients.projectsCount'), { count: projectsCount })}
          </span>
        </div>
      </TableCell>

      {/* Users Count */}
      <TableCell>
        <div className="flex items-center gap-1.5 text-gray-600">
          <Users className="h-4 w-4 text-gray-400" />
          <span className="text-sm">
            {formatTranslation(t('clients.usersCount'), { count: usersCount })}
          </span>
        </div>
      </TableCell>

      {/* Actions */}
      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">{t('clients.actions')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleViewDetails}>
              <Eye className="h-4 w-4 mr-2" />
              {t('clients.viewDetails')}
            </DropdownMenuItem>
            {isPRAdmin && (
              <>
                <DropdownMenuItem onClick={() => onEdit(client)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  {t('clients.editClient')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(client)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('clients.deleteClient')}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
