/**
 * ClearPress AI - Storage Service
 * File upload and management via Supabase Storage
 */

import { supabase } from './supabase';
import type { UploadedFile } from '@/types/client-request';

const BUCKET_NAME = 'project-files';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

const ACCEPTED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif', '.webp'];

/**
 * Validate file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Check file type
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  const isValidType =
    ACCEPTED_MIME_TYPES.includes(file.type) ||
    ACCEPTED_EXTENSIONS.includes(extension);

  if (!isValidType) {
    return {
      valid: false,
      error: `File type not accepted. Allowed: PDF, DOC, DOCX, and images`,
    };
  }

  return { valid: true };
}

/**
 * Generate a unique file path for storage
 */
function generateFilePath(userId: string, fileName: string): string {
  const timestamp = Date.now();
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${userId}/${timestamp}_${sanitizedName}`;
}

/**
 * Upload a single file to Supabase Storage
 */
export async function uploadFile(
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<UploadedFile> {
  // Validate file
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const filePath = generateFilePath(userId, file.name);

  // Simulate progress since Supabase doesn't provide upload progress
  let progressInterval: number | undefined;
  let currentProgress = 0;

  if (onProgress) {
    progressInterval = window.setInterval(() => {
      currentProgress = Math.min(currentProgress + Math.random() * 20, 90);
      onProgress(currentProgress);
    }, 200);
  }

  try {
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    // Complete progress
    if (onProgress) {
      onProgress(100);
    }

    return {
      id: data.path,
      name: file.name,
      size: file.size,
      type: file.type,
      url: urlData.publicUrl,
      uploadedAt: new Date().toISOString(),
    };
  } finally {
    if (progressInterval) {
      clearInterval(progressInterval);
    }
  }
}

/**
 * Upload multiple files
 */
export async function uploadFiles(
  files: File[],
  userId: string,
  onProgress?: (fileIndex: number, progress: number) => void
): Promise<UploadedFile[]> {
  const results: UploadedFile[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const uploaded = await uploadFile(
      file,
      userId,
      onProgress ? (progress) => onProgress(i, progress) : undefined
    );
    results.push(uploaded);
  }

  return results;
}

/**
 * Delete a file from storage
 */
export async function deleteFile(filePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) {
    throw error;
  }
}

/**
 * Delete multiple files
 */
export async function deleteFiles(filePaths: string[]): Promise<void> {
  if (filePaths.length === 0) return;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove(filePaths);

  if (error) {
    throw error;
  }
}

/**
 * Get file URL from path
 */
export function getFileUrl(filePath: string): string {
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Get file icon based on type
 */
export function getFileIcon(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'FileText';
  if (mimeType.startsWith('image/')) return 'Image';
  if (
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return 'FileText';
  }
  return 'File';
}
