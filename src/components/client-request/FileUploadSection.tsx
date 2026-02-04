/**
 * ClearPress AI - File Upload Section
 * Drag-and-drop file upload component for reference materials
 */

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  File,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { uploadFile, deleteFile, formatFileSize, validateFile } from '@/services/storage';
import type { UploadedFile } from '@/types/client-request';
import { cn } from '@/lib/utils';

interface FileUploadSectionProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
}

export function FileUploadSection({
  files,
  onFilesChange,
  maxFiles = 5,
  disabled = false,
}: FileUploadSectionProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!user) return;
      if (files.length + acceptedFiles.length > maxFiles) {
        setError(
          `Maximum ${maxFiles} files allowed`
        );
        return;
      }

      setError(null);

      // Filter valid files
      const validFiles: File[] = [];
      for (const file of acceptedFiles) {
        const validation = validateFile(file);
        if (validation.valid) {
          validFiles.push(file);
        } else {
          setError(validation.error || 'Invalid file');
        }
      }

      // Upload files one by one
      for (const file of validFiles) {
        const tempId = `uploading-${Date.now()}-${file.name}`;

        // Add to uploading state
        setUploadingFiles((prev) => [
          ...prev,
          { id: tempId, name: file.name, progress: 0 },
        ]);

        try {
          const uploaded = await uploadFile(file, user.id, (progress) => {
            setUploadingFiles((prev) =>
              prev.map((f) =>
                f.id === tempId ? { ...f, progress } : f
              )
            );
          });

          // Remove from uploading and add to files
          setUploadingFiles((prev) => prev.filter((f) => f.id !== tempId));
          onFilesChange([...files, uploaded]);
        } catch (err) {
          setUploadingFiles((prev) => prev.filter((f) => f.id !== tempId));
          setError(err instanceof Error ? err.message : 'Upload failed');
        }
      }
    },
    [user, files, maxFiles, onFilesChange]
  );

  const handleRemoveFile = async (fileToRemove: UploadedFile) => {
    try {
      await deleteFile(fileToRemove.id);
      onFilesChange(files.filter((f) => f.id !== fileToRemove.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove file');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: disabled || uploadingFiles.length > 0,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/pdf') return FileText;
    if (mimeType.startsWith('image/')) return ImageIcon;
    return File;
  };

  const isUploading = uploadingFiles.length > 0;
  const canUploadMore = files.length < maxFiles && !disabled;

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      {canUploadMore && (
        <div
          {...getRootProps()}
          className={cn(
            'relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer',
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">
                {t('clientRequest.dragDropFiles')}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('clientRequest.orClickToSelect')}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('clientRequest.acceptedFormats')}
            </p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-6 w-6 p-0"
            onClick={() => setError(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Uploading files */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
            >
              <Loader2 className="h-5 w-5 text-primary animate-spin flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <Progress value={file.progress} className="h-1 mt-1" />
              </div>
              <span className="text-xs text-muted-foreground">
                {Math.round(file.progress)}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded files */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => {
            const IconComponent = getFileIcon(file.type);
            return (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 group"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded bg-background">
                  <IconComponent className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemoveFile(file)}
                  disabled={isUploading || disabled}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">{t('clientRequest.removeFile')}</span>
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* File count */}
      {files.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {files.length} / {maxFiles} files
        </p>
      )}
    </div>
  );
}
