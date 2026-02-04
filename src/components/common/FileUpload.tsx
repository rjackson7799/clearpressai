/**
 * ClearPress AI - File Upload Component
 * Drag-and-drop file upload with validation
 */

import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Upload, X, FileText, FileImage, Loader2 } from 'lucide-react';
import { isAllowedFileType, MAX_FILE_SIZE, formatFileSize } from '@/services/files';
import type { FileCategory } from '@/types';

interface FileUploadProps {
  onUpload: (files: File[]) => Promise<void>;
  category: FileCategory; // Used by parent to determine where files are stored
  accept?: string;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
}

// Note: category is used by the parent component when calling onUpload

interface FilePreview {
  file: File;
  preview?: string;
  error?: string;
}

export function FileUpload({
  onUpload,
  category: _category, // Prefixed to avoid unused warning, used by parent
  accept,
  maxFiles = 10,
  disabled = false,
  className,
}: FileUploadProps) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);

  const [isDragOver, setIsDragOver] = useState(false);
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Determine accepted file types
  const acceptedTypes = accept || [
    '.pdf',
    '.doc',
    '.docx',
    '.txt',
    '.md',
    '.png',
    '.jpg',
    '.jpeg',
  ].join(',');

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!isAllowedFileType(file.type)) {
      return t('files.invalidType');
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return t('files.fileTooLarge');
    }

    return null;
  }, [t]);

  const processFiles = useCallback((fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const validFiles: FilePreview[] = [];

    for (const file of files) {
      if (filePreviews.length + validFiles.length >= maxFiles) {
        break;
      }

      const error = validateFile(file);
      const preview: FilePreview = { file, error: error ?? undefined };

      // Generate preview for images
      if (file.type.startsWith('image/') && !error) {
        preview.preview = URL.createObjectURL(file);
      }

      validFiles.push(preview);
    }

    setFilePreviews((prev) => [...prev, ...validFiles]);
  }, [filePreviews.length, maxFiles, validateFile]);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  const removeFile = (index: number) => {
    setFilePreviews((prev) => {
      const newPreviews = [...prev];
      const removed = newPreviews.splice(index, 1)[0];
      // Revoke object URL to prevent memory leak
      if (removed.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return newPreviews;
    });
  };

  const handleUpload = async () => {
    const validFiles = filePreviews.filter((p) => !p.error).map((p) => p.file);

    if (validFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      await onUpload(validFiles);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Clear previews after successful upload
      filePreviews.forEach((p) => {
        if (p.preview) {
          URL.revokeObjectURL(p.preview);
        }
      });
      setFilePreviews([]);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <FileImage className="h-5 w-5 text-blue-500" />;
    }
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  const validFilesCount = filePreviews.filter((p) => !p.error).length;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          'relative rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer',
          isDragOver && 'border-blue-500 bg-blue-50',
          !isDragOver && 'border-gray-300 hover:border-gray-400 hover:bg-gray-50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={acceptedTypes}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center gap-3">
          <div className="rounded-full bg-gray-100 p-3">
            <Upload className="h-6 w-6 text-gray-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">
              {t('files.dragDrop')}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {t('files.supportedTypes')}
            </p>
            <p className="text-xs text-gray-500">
              {t('files.maxSize', { size: String(MAX_FILE_SIZE / (1024 * 1024)) })}
            </p>
          </div>
        </div>
      </div>

      {/* File Previews */}
      {filePreviews.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            {t('files.selectedFiles')} ({validFilesCount}/{filePreviews.length})
          </p>
          <div className="space-y-2">
            {filePreviews.map((preview, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3',
                  preview.error ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
                )}
              >
                {/* Preview / Icon */}
                {preview.preview ? (
                  <img
                    src={preview.preview}
                    alt={preview.file.name}
                    className="h-10 w-10 rounded object-cover"
                  />
                ) : (
                  getFileIcon(preview.file.type)
                )}

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {preview.file.name}
                  </p>
                  <p className={cn(
                    'text-xs',
                    preview.error ? 'text-red-600' : 'text-gray-500'
                  )}>
                    {preview.error || formatFileSize(preview.file.size)}
                  </p>
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                  disabled={isUploading}
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-sm text-gray-500 text-center">
            {t('files.uploading')} ({uploadProgress}%)
          </p>
        </div>
      )}

      {/* Upload Button */}
      {filePreviews.length > 0 && validFilesCount > 0 && (
        <Button
          onClick={handleUpload}
          disabled={isUploading || disabled}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t('files.uploading')}
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              {t('files.uploadFiles')} ({validFilesCount})
            </>
          )}
        </Button>
      )}
    </div>
  );
}
