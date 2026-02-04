/**
 * ClearPress AI - User Row
 * Table row component for displaying user information
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToggleUserStatus } from '@/hooks/use-users';
import { TableRow, TableCell } from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, User as UserIcon, Power, PowerOff } from 'lucide-react';
import { UserRoleBadge } from './UserRoleBadge';
import { UserStatusBadge } from './UserStatusBadge';
import type { User } from '@/types';

interface UserRowProps {
  user: User;
}

export function UserRow({ user }: UserRowProps) {
  const { t, language } = useLanguage();
  const { profile, isPRAdmin } = useAuth();
  const toggleStatus = useToggleUserStatus();

  const isCurrentUser = profile?.id === user.id;

  // Get user initials for avatar fallback
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Format date
  const joinedDate = new Date(user.created_at).toLocaleDateString(
    language === 'ja' ? 'ja-JP' : 'en-US',
    { year: 'numeric', month: 'short', day: 'numeric' }
  );

  const handleToggleStatus = () => {
    toggleStatus.mutate({ userId: user.id, isActive: !user.is_active });
  };

  return (
    <TableRow className="hover:bg-gray-50">
      {/* User with Avatar */}
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            {user.avatar_url && (
              <AvatarImage src={user.avatar_url} alt={user.name} />
            )}
            <AvatarFallback className="bg-gray-100 text-gray-600 text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-gray-900">{user.name}</span>
        </div>
      </TableCell>

      {/* Email */}
      <TableCell className="text-gray-600">{user.email}</TableCell>

      {/* Role */}
      <TableCell>
        <UserRoleBadge role={user.role} />
      </TableCell>

      {/* Status */}
      <TableCell>
        <UserStatusBadge isActive={user.is_active} />
      </TableCell>

      {/* Joined Date */}
      <TableCell className="text-gray-500">{joinedDate}</TableCell>

      {/* Actions */}
      <TableCell className="text-right">
        {isPRAdmin && !isCurrentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">{t('team.actions')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <UserIcon className="h-4 w-4 mr-2" />
                {t('team.viewProfile')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleToggleStatus}
                disabled={toggleStatus.isPending}
              >
                {user.is_active ? (
                  <>
                    <PowerOff className="h-4 w-4 mr-2" />
                    {t('team.deactivate')}
                  </>
                ) : (
                  <>
                    <Power className="h-4 w-4 mr-2" />
                    {t('team.activate')}
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </TableCell>
    </TableRow>
  );
}
