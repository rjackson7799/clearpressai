/**
 * ClearPress AI - File Service
 * CRUD operations for file uploads and management
 */

import { supabase } from './supabase';
import type { FileRecord, FileCategory, ExtractionStatus, FileFilters, User } from '@/types';
import type { Database } from '@/types/database';

// Database row type
type DbFile = Database['public']['Tables']['files']['Row'];
type DbUser = Database['public']['Tables']['users']['Row'];

// Storage bucket name
const BUCKET_NAME = 'client-files';

// ===== Type Converter =====

function dbFileToFileRecord(
  row: DbFile & { uploaded_by_user?: DbUser | null }
): FileRecord {
  return {
    id: row.id,
    organization_id: row.organization_id,
    client_id: row.client_id ?? undefined,
    project_id: row.project_id ?? undefined,
    name: row.name,
    storage_path: row.storage_path,
    mime_type: row.mime_type,
    size_bytes: row.size_bytes,
    category: row.category as FileCategory,
    content_text: (row as Record<string, unknown>).content_text as string | undefined,
    extraction_status: (row as Record<string, unknown>).extraction_status as ExtractionStatus | undefined,
    extracted_at: (row as Record<string, unknown>).extracted_at as string | undefined,
    uploaded_by: row.uploaded_by,
    created_at: row.created_at ?? new Date().toISOString(),
    uploaded_by_user: row.uploaded_by_user ? {
      id: row.uploaded_by_user.id,
      email: row.uploaded_by_user.email,
      name: row.uploaded_by_user.name,
      role: row.uploaded_by_user.role as User['role'],
      organization_id: row.uploaded_by_user.organization_id,
      is_active: row.uploaded_by_user.is_active ?? true,
      avatar_url: row.uploaded_by_user.avatar_url ?? undefined,
      preferences: (row.uploaded_by_user.preferences as unknown as User['preferences']) ?? { language: 'ja' },
      created_at: row.uploaded_by_user.created_at ?? new Date().toISOString(),
      updated_at: row.uploaded_by_user.updated_at ?? new Date().toISOString(),
    } : undefined,
  };
}

// ===== Upload Parameters =====

export interface UploadFileParams {
  file: File;
  organizationId: string;
  clientId?: string;
  projectId?: string;
  category: FileCategory;
  uploadedBy: string;
}

// ===== File CRUD =====

/**
 * Upload a file to storage and create database record
 */
export async function uploadFile(params: UploadFileParams): Promise<FileRecord> {
  const { file, organizationId, clientId, projectId, category, uploadedBy } = params;

  // Generate storage path
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  let storagePath = `${organizationId}`;

  if (clientId) {
    storagePath += `/${clientId}`;
    if (category === 'style_reference' || category === 'brand_guidelines' ||
        category === 'tone_example' || category === 'previous_press_release') {
      storagePath += '/style-references';
    } else if (projectId) {
      storagePath += `/projects/${projectId}`;
    }
  }

  storagePath += `/${timestamp}_${sanitizedName}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Storage upload error:', uploadError);
    throw new Error('ファイルのアップロードに失敗しました');
  }

  // Determine initial extraction status based on file type
  const isExtractable = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
  ].includes(file.type);

  const extractionStatus: ExtractionStatus = isExtractable ? 'pending' : 'completed';

  // Create database record
  const { data, error: dbError } = await supabase
    .from('files')
    .insert({
      organization_id: organizationId,
      client_id: clientId ?? null,
      project_id: projectId ?? null,
      name: file.name,
      storage_path: storagePath,
      mime_type: file.type,
      size_bytes: file.size,
      category,
      uploaded_by: uploadedBy,
      extraction_status: extractionStatus,
    })
    .select('*, uploaded_by_user:users(*)')
    .single();

  if (dbError) {
    // Rollback storage upload on database error
    await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
    console.error('Database insert error:', dbError);
    throw new Error('ファイル情報の保存に失敗しました');
  }

  return dbFileToFileRecord(data as DbFile & { uploaded_by_user?: DbUser | null });
}

/**
 * Fetch files with optional filters
 */
export async function fetchFiles(
  organizationId: string,
  filters?: FileFilters
): Promise<FileRecord[]> {
  let query = supabase
    .from('files')
    .select('*, uploaded_by_user:users(*)')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters?.client_id) {
    query = query.eq('client_id', filters.client_id);
  }

  if (filters?.project_id) {
    query = query.eq('project_id', filters.project_id);
  }

  if (filters?.category && filters.category.length > 0) {
    query = query.in('category', filters.category);
  }

  if (filters?.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching files:', error);
    throw new Error('ファイルの取得に失敗しました');
  }

  return (data ?? []).map((row) =>
    dbFileToFileRecord(row as DbFile & { uploaded_by_user?: DbUser | null })
  );
}

/**
 * Fetch a single file by ID
 */
export async function fetchFile(fileId: string): Promise<FileRecord | null> {
  const { data, error } = await supabase
    .from('files')
    .select('*, uploaded_by_user:users(*)')
    .eq('id', fileId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('Error fetching file:', error);
    throw new Error('ファイルの取得に失敗しました');
  }

  return dbFileToFileRecord(data as DbFile & { uploaded_by_user?: DbUser | null });
}

/**
 * Get a signed URL for file download
 */
export async function getFileUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storagePath, 3600); // 1 hour expiry

  if (error) {
    console.error('Error creating signed URL:', error);
    throw new Error('ダウンロードURLの生成に失敗しました');
  }

  return data.signedUrl;
}

/**
 * Delete a file from storage and database
 */
export async function deleteFile(fileId: string): Promise<void> {
  // First, get the file to find the storage path
  const { data: file, error: fetchError } = await supabase
    .from('files')
    .select('storage_path')
    .eq('id', fileId)
    .single();

  if (fetchError) {
    console.error('Error fetching file for deletion:', fetchError);
    throw new Error('ファイルが見つかりません');
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([file.storage_path]);

  if (storageError) {
    console.error('Error deleting from storage:', storageError);
    // Continue to delete database record even if storage deletion fails
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from('files')
    .delete()
    .eq('id', fileId);

  if (dbError) {
    console.error('Error deleting file record:', dbError);
    throw new Error('ファイルの削除に失敗しました');
  }
}

/**
 * Update file extraction status
 */
export async function updateExtractionStatus(
  fileId: string,
  status: ExtractionStatus,
  contentText?: string
): Promise<void> {
  const updateData: Record<string, unknown> = {
    extraction_status: status,
  };

  if (status === 'completed') {
    updateData.extracted_at = new Date().toISOString();
    if (contentText) {
      updateData.content_text = contentText;
    }
  }

  const { error } = await supabase
    .from('files')
    .update(updateData)
    .eq('id', fileId);

  if (error) {
    console.error('Error updating extraction status:', error);
    throw new Error('抽出ステータスの更新に失敗しました');
  }
}

/**
 * Fetch files used for style extraction for a client
 */
export async function fetchClientStyleFiles(clientId: string): Promise<FileRecord[]> {
  const { data, error } = await supabase
    .from('files')
    .select('*, uploaded_by_user:users(*)')
    .eq('client_id', clientId)
    .in('category', ['brand_guidelines', 'tone_example', 'previous_press_release', 'style_reference'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching client style files:', error);
    throw new Error('スタイル参考ファイルの取得に失敗しました');
  }

  return (data ?? []).map((row) =>
    dbFileToFileRecord(row as DbFile & { uploaded_by_user?: DbUser | null })
  );
}

// ===== Helper Functions =====

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + units[i];
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Check if file type is allowed for upload
 */
export function isAllowedFileType(mimeType: string): boolean {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'image/png',
    'image/jpeg',
    'image/gif',
  ];

  return allowedTypes.includes(mimeType);
}

/**
 * Maximum file size in bytes (50MB)
 */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;
