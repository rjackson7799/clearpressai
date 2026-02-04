/**
 * ClearPress AI - Files Hooks
 * TanStack Query hooks for file operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchFiles,
  fetchFile,
  uploadFile,
  deleteFile,
  getFileUrl,
  fetchClientStyleFiles,
  updateExtractionStatus,
  type UploadFileParams,
} from '@/services/files';
import type { FileFilters, FileCategory, ExtractionStatus } from '@/types';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

// ===== Query Keys =====

export const fileKeys = {
  all: ['files'] as const,
  lists: () => [...fileKeys.all, 'list'] as const,
  list: (filters?: FileFilters) => [...fileKeys.lists(), filters] as const,
  details: () => [...fileKeys.all, 'detail'] as const,
  detail: (id: string) => [...fileKeys.details(), id] as const,
  url: (storagePath: string) => [...fileKeys.all, 'url', storagePath] as const,
  clientStyle: (clientId: string) => [...fileKeys.all, 'clientStyle', clientId] as const,
};

// ===== Query Hooks =====

/**
 * Fetch files list with filters
 */
export function useFiles(filters?: FileFilters) {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;

  return useQuery({
    queryKey: fileKeys.list(filters),
    queryFn: () => {
      if (!organizationId) throw new Error('Organization not found');
      return fetchFiles(organizationId, filters);
    },
    enabled: !!organizationId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetch a single file by ID
 */
export function useFile(fileId: string | undefined) {
  return useQuery({
    queryKey: fileKeys.detail(fileId ?? ''),
    queryFn: () => {
      if (!fileId) throw new Error('File ID required');
      return fetchFile(fileId);
    },
    enabled: !!fileId,
    staleTime: 30 * 1000,
  });
}

/**
 * Get signed URL for file download
 */
export function useFileUrl(storagePath: string | undefined) {
  return useQuery({
    queryKey: fileKeys.url(storagePath ?? ''),
    queryFn: () => {
      if (!storagePath) throw new Error('Storage path required');
      return getFileUrl(storagePath);
    },
    enabled: !!storagePath,
    staleTime: 30 * 60 * 1000, // 30 minutes (URL valid for 1 hour)
  });
}

/**
 * Fetch style reference files for a client
 */
export function useClientStyleFiles(clientId: string | undefined) {
  return useQuery({
    queryKey: fileKeys.clientStyle(clientId ?? ''),
    queryFn: () => {
      if (!clientId) throw new Error('Client ID required');
      return fetchClientStyleFiles(clientId);
    },
    enabled: !!clientId,
    staleTime: 30 * 1000,
  });
}

// ===== Mutation Hooks =====

/**
 * Upload a file
 */
export function useUploadFile() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: (params: {
      file: File;
      clientId?: string;
      projectId?: string;
      category: FileCategory;
    }) => {
      if (!profile?.organization_id || !profile.id) {
        throw new Error('User not authenticated');
      }

      const uploadParams: UploadFileParams = {
        file: params.file,
        organizationId: profile.organization_id,
        clientId: params.clientId,
        projectId: params.projectId,
        category: params.category,
        uploadedBy: profile.id,
      };

      return uploadFile(uploadParams);
    },
    onSuccess: (_data, variables) => {
      // Invalidate file lists
      queryClient.invalidateQueries({ queryKey: fileKeys.lists() });

      // Invalidate client style files if this was a style-related upload
      if (variables.clientId && ['brand_guidelines', 'tone_example', 'previous_press_release', 'style_reference'].includes(variables.category)) {
        queryClient.invalidateQueries({
          queryKey: fileKeys.clientStyle(variables.clientId),
        });
      }

      toast.success(t('files.uploadSuccess'));
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast.error(t('files.uploadError'));
    },
  });
}

/**
 * Upload multiple files
 */
export function useUploadFiles() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (params: {
      files: File[];
      clientId?: string;
      projectId?: string;
      category: FileCategory;
    }) => {
      if (!profile?.organization_id || !profile.id) {
        throw new Error('User not authenticated');
      }

      const results = await Promise.all(
        params.files.map((file) =>
          uploadFile({
            file,
            organizationId: profile.organization_id,
            clientId: params.clientId,
            projectId: params.projectId,
            category: params.category,
            uploadedBy: profile.id,
          })
        )
      );

      return results;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: fileKeys.lists() });

      if (variables.clientId && ['brand_guidelines', 'tone_example', 'previous_press_release', 'style_reference'].includes(variables.category)) {
        queryClient.invalidateQueries({
          queryKey: fileKeys.clientStyle(variables.clientId),
        });
      }

      toast.success(t('files.uploadSuccess'));
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast.error(t('files.uploadError'));
    },
  });
}

/**
 * Delete a file
 */
export function useDeleteFile() {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: (fileId: string) => deleteFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fileKeys.all });
      toast.success(t('files.deleteSuccess'));
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error(t('files.deleteError'));
    },
  });
}

/**
 * Update file extraction status
 */
export function useUpdateExtractionStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      fileId: string;
      status: ExtractionStatus;
      contentText?: string;
    }) => updateExtractionStatus(params.fileId, params.status, params.contentText),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: fileKeys.detail(variables.fileId) });
      queryClient.invalidateQueries({ queryKey: fileKeys.lists() });
    },
  });
}
