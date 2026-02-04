/**
 * ClearPress AI - Settings Hooks
 * TanStack Query hooks for settings management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchOrganizationSettings,
  updateOrganizationSettings,
  updateOrganizationName,
  fetchUserPreferences,
  updateUserPreferences,
  updatePassword,
  fetchRecentActivity,
  calculateApprovalRate,
  type OrganizationSettingsData,
  type ExtendedUserPreferences,
  type NotificationPreferences,
} from '@/services/settings';
import { useLanguage } from '@/contexts/LanguageContext';

// ===== Query Keys =====

export const settingsKeys = {
  all: ['settings'] as const,
  organization: (orgId: string) => [...settingsKeys.all, 'organization', orgId] as const,
  userPreferences: (userId: string) => [...settingsKeys.all, 'user', userId] as const,
  activity: (orgId: string) => [...settingsKeys.all, 'activity', orgId] as const,
  approvalRate: (orgId: string) => [...settingsKeys.all, 'approvalRate', orgId] as const,
};

// ===== Organization Settings Hooks =====

export function useOrganizationSettings(organizationId: string | undefined) {
  return useQuery({
    queryKey: settingsKeys.organization(organizationId || ''),
    queryFn: () => fetchOrganizationSettings(organizationId!),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateOrganizationSettings() {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: ({
      organizationId,
      settings,
    }: {
      organizationId: string;
      settings: Partial<OrganizationSettingsData>;
    }) => updateOrganizationSettings(organizationId, settings),
    onSuccess: (_, { organizationId }) => {
      queryClient.invalidateQueries({
        queryKey: settingsKeys.organization(organizationId),
      });
      toast.success(t('settings.saved'));
    },
    onError: () => {
      toast.error(t('settings.saveError'));
    },
  });
}

export function useUpdateOrganizationName() {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: ({
      organizationId,
      name,
    }: {
      organizationId: string;
      name: string;
    }) => updateOrganizationName(organizationId, name),
    onSuccess: (_, { organizationId }) => {
      queryClient.invalidateQueries({
        queryKey: settingsKeys.organization(organizationId),
      });
      toast.success(t('settings.saved'));
    },
    onError: () => {
      toast.error(t('settings.saveError'));
    },
  });
}

// ===== User Preferences Hooks =====

export function useUserPreferences(userId: string | undefined) {
  return useQuery({
    queryKey: settingsKeys.userPreferences(userId || ''),
    queryFn: () => fetchUserPreferences(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateUserPreferences() {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: ({
      userId,
      preferences,
    }: {
      userId: string;
      preferences: Partial<ExtendedUserPreferences>;
    }) => updateUserPreferences(userId, preferences),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({
        queryKey: settingsKeys.userPreferences(userId),
      });
      toast.success(t('settings.saved'));
    },
    onError: () => {
      toast.error(t('settings.saveError'));
    },
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: ({
      userId,
      notifications,
    }: {
      userId: string;
      notifications: Partial<NotificationPreferences>;
    }) => updateUserPreferences(userId, { notifications }),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({
        queryKey: settingsKeys.userPreferences(userId),
      });
      toast.success(t('settings.notificationsSaved'));
    },
    onError: () => {
      toast.error(t('settings.saveError'));
    },
  });
}

// ===== Password Hook =====

export function useUpdatePassword() {
  const { t } = useLanguage();

  return useMutation({
    mutationFn: (newPassword: string) => updatePassword(newPassword),
    onSuccess: () => {
      toast.success(t('settings.passwordChanged'));
    },
    onError: () => {
      toast.error(t('settings.passwordError'));
    },
  });
}

// ===== Activity Hooks =====

export function useRecentActivity(organizationId: string | undefined, limit: number = 10) {
  return useQuery({
    queryKey: settingsKeys.activity(organizationId || ''),
    queryFn: () => fetchRecentActivity(organizationId!, limit),
    enabled: !!organizationId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useApprovalRate(organizationId: string | undefined) {
  return useQuery({
    queryKey: settingsKeys.approvalRate(organizationId || ''),
    queryFn: () => calculateApprovalRate(organizationId!),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
