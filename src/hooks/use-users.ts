/**
 * ClearPress AI - Users Hooks
 * TanStack Query hooks for user operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  fetchUsers,
  updateUserStatus,
  inviteUser,
  InviteError,
  type UserFilters,
  type InviteUserRequest,
} from '@/services/users';
import { toast } from 'sonner';

// ===== Query Keys =====

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters?: UserFilters) => [...userKeys.lists(), filters] as const,
};

// ===== Hooks =====

/**
 * Fetch users list with filters
 */
export function useUsers(filters?: UserFilters) {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;

  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => {
      if (!organizationId) throw new Error('Organization not found');
      return fetchUsers(organizationId, filters);
    },
    enabled: !!organizationId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Toggle user active status (activate/deactivate)
 */
export function useToggleUserStatus() {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      updateUserStatus(userId, isActive),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success(
        variables.isActive ? t('team.userActivated') : t('team.userDeactivated')
      );
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Invite a new user to the organization
 */
export function useInviteUser() {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: (request: InviteUserRequest) => inviteUser(request),
    onSuccess: () => {
      // Invalidate users list in case we want to show pending invites later
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success(t('team.inviteSent'));
    },
    onError: (error: Error) => {
      // Handle specific error codes from InviteError
      if (error instanceof InviteError) {
        switch (error.code) {
          case 'ALREADY_MEMBER':
            toast.error(t('team.errors.alreadyMember'));
            break;
          case 'ALREADY_INVITED':
            toast.error(t('team.errors.alreadyInvited'));
            break;
          case 'RATE_LIMITED':
            toast.error(t('team.errors.rateLimited'));
            break;
          case 'EMAIL_DELIVERY_FAILED':
            toast.error(t('team.errors.emailDeliveryFailed'));
            break;
          case 'NETWORK_ERROR':
            toast.error(t('team.errors.networkError'));
            break;
          default:
            toast.error(t('team.errors.inviteFailed'));
        }
      } else {
        toast.error(t('team.errors.inviteFailed'));
      }
    },
  });
}

// Re-export types for convenience
export type { UserFilters, InviteUserRequest } from '@/services/users';
