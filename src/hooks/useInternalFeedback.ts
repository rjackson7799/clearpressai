import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { safeStorageKey } from '@/lib/utils/storage-key';
import type {
  InternalFeedback,
  InternalFeedbackAttachment,
  InternalFeedbackType,
  InternalFeedbackStatus,
} from '@/types/domain';

const FEEDBACK_BUCKET = 'feedback-attachments';
const FEEDBACK_KEY = ['internal-feedback'] as const;
const SIGNED_URL_TTL_SECONDS = 3600;

export interface InternalFeedbackWithAttachments extends InternalFeedback {
  internal_feedback_attachments: InternalFeedbackAttachment[];
  created_by_user: { email: string } | null;
}

export function useInternalFeedbackList() {
  return useQuery({
    queryKey: FEEDBACK_KEY,
    queryFn: async (): Promise<InternalFeedbackWithAttachments[]> => {
      const { data, error } = await supabase
        .from('internal_feedback')
        .select(
          '*, internal_feedback_attachments(*), created_by_user:users!internal_feedback_created_by_fkey(email)',
        )
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as InternalFeedbackWithAttachments[];
    },
  });
}

export interface CreateFeedbackInput {
  type: InternalFeedbackType;
  message: string;
  files: File[];
}

export function useCreateInternalFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      type,
      message,
      files,
    }: CreateFeedbackInput): Promise<InternalFeedback> => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error('Not authenticated');
      const userId = auth.user.id;

      const { data: row, error: insertError } = await supabase
        .from('internal_feedback')
        .insert({ type, message, created_by: userId })
        .select('*')
        .single();
      if (insertError) throw insertError;

      // All-or-nothing: upload every screenshot, then link them. If any step
      // fails, remove the objects we did upload and delete the orphan row so no
      // partial state survives.
      const uploadedPaths: string[] = [];
      try {
        for (const file of files) {
          const path = safeStorageKey(row.id, file);
          const { error: uploadError } = await supabase.storage
            .from(FEEDBACK_BUCKET)
            .upload(path, file, { contentType: file.type });
          if (uploadError) throw uploadError;
          uploadedPaths.push(path);
        }
        if (files.length > 0) {
          const attachmentRows = files.map((file, i) => ({
            feedback_id: row.id,
            filename: file.name,
            storage_path: uploadedPaths[i],
            mime_type: file.type,
            byte_size: file.size,
            uploaded_by: userId,
          }));
          const { error: attachError } = await supabase
            .from('internal_feedback_attachments')
            .insert(attachmentRows);
          if (attachError) throw attachError;
        }
      } catch (e) {
        if (uploadedPaths.length > 0) {
          await supabase.storage.from(FEEDBACK_BUCKET).remove(uploadedPaths);
        }
        await supabase.from('internal_feedback').delete().eq('id', row.id);
        throw e;
      }

      // Notification is best-effort — the feedback row is the source of truth,
      // so an email failure must never fail the submission.
      try {
        await supabase.functions.invoke('notify-feedback', {
          body: { feedback_id: row.id },
        });
      } catch (notifyError) {
        console.warn('notify-feedback failed (non-fatal)', notifyError);
      }

      return row;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FEEDBACK_KEY });
    },
  });
}

export function useUpdateFeedbackStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: InternalFeedbackStatus;
    }): Promise<InternalFeedback> => {
      const { data, error } = await supabase
        .from('internal_feedback')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FEEDBACK_KEY });
    },
  });
}

export function useDeleteInternalFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      // Read the attachment paths BEFORE the delete — the ON DELETE CASCADE
      // would otherwise erase the rows we need to clean up storage with.
      const { data: attachments, error: fetchError } = await supabase
        .from('internal_feedback_attachments')
        .select('storage_path')
        .eq('feedback_id', id);
      if (fetchError) throw fetchError;

      const { error: deleteError } = await supabase
        .from('internal_feedback')
        .delete()
        .eq('id', id);
      if (deleteError) throw deleteError;

      const paths = (attachments ?? []).map((a) => a.storage_path);
      if (paths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from(FEEDBACK_BUCKET)
          .remove(paths);
        if (storageError) {
          console.warn('Feedback attachment cleanup failed', storageError);
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FEEDBACK_KEY });
    },
  });
}

export function useFeedbackAttachmentUrls(paths: string[]) {
  return useQuery({
    queryKey: ['feedback-attachment-urls', ...paths] as const,
    enabled: paths.length > 0,
    queryFn: async (): Promise<Record<string, string>> => {
      const { data, error } = await supabase.storage
        .from(FEEDBACK_BUCKET)
        .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
      if (error) throw error;
      const map: Record<string, string> = {};
      for (const item of data ?? []) {
        if (item.path && item.signedUrl) map[item.path] = item.signedUrl;
      }
      return map;
    },
  });
}
