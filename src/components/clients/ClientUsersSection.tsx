/**
 * ClearPress AI - Client Users Section
 * Section for managing users assigned to a client
 */

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  useClientUsers,
  useAddClientUser,
  useRemoveClientUser,
  useAvailableClientUsers,
} from '@/hooks/use-clients';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, UserPlus, Mail, Trash2, Loader2 } from 'lucide-react';
import { InviteClientUserDialog } from './InviteClientUserDialog';
import type { User } from '@/types';

interface ClientUsersSectionProps {
  clientId: string;
  clientName: string;
}

export function ClientUsersSection({ clientId, clientName }: ClientUsersSectionProps) {
  const { t } = useLanguage();
  const { isPRAdmin } = useAuth();
  const { data: assignedUsers, isLoading } = useClientUsers(clientId);
  const { data: allClientUsers } = useAvailableClientUsers();
  const addUser = useAddClientUser();
  const removeUser = useRemoveClientUser();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  // Get available users (not already assigned)
  const assignedUserIds = new Set(assignedUsers?.map((u) => u.id) ?? []);
  const availableUsers =
    allClientUsers?.filter((u) => !assignedUserIds.has(u.id)) ?? [];

  const handleAddUser = async () => {
    if (!selectedUserId) return;

    try {
      await addUser.mutateAsync({ clientId, userId: selectedUserId });
      setAddDialogOpen(false);
      setSelectedUserId('');
    } catch {
      // Error handled by mutation
    }
  };

  const handleRemoveUser = async (userId: string) => {
    setRemovingUserId(userId);
    try {
      await removeUser.mutateAsync({ clientId, userId });
    } catch {
      // Error handled by mutation
    } finally {
      setRemovingUserId(null);
    }
  };

  // Get user initials
  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" />
              {t('clients.assignedUsers')}
              {assignedUsers && (
                <Badge variant="secondary" className="ml-2">
                  {assignedUsers.length}
                </Badge>
              )}
            </CardTitle>
            {isPRAdmin && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInviteDialogOpen(true)}
                  className="h-8"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {t('clients.inviteUser')}
                </Button>
                {availableUsers.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAddDialogOpen(true)}
                    className="h-8"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {t('clients.addExisting')}
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-5">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : assignedUsers && assignedUsers.length > 0 ? (
            <div className="space-y-3">
              {assignedUsers.map((user: User) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 group"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {user.avatar_url && (
                        <AvatarImage src={user.avatar_url} alt={user.name} />
                      )}
                      <AvatarFallback className="bg-gray-100 text-gray-600 text-sm">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  {isPRAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveUser(user.id)}
                      disabled={removingUserId === user.id}
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600"
                    >
                      {removingUserId === user.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">{t('clients.noUsersAssigned')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t('clients.addUser')}</DialogTitle>
            <DialogDescription>{t('clients.selectUser')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder={t('clients.selectUser')} />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        {user.avatar_url && (
                          <AvatarImage src={user.avatar_url} alt={user.name} />
                        )}
                        <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{user.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setAddDialogOpen(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleAddUser}
                disabled={!selectedUserId || addUser.isPending}
              >
                {addUser.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {t('clients.addUser')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Client User Dialog */}
      <InviteClientUserDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        clientId={clientId}
        clientName={clientName}
      />
    </>
  );
}
