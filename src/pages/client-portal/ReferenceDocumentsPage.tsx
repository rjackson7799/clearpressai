/**
 * ClearPress AI - Client Portal Reference Documents Page
 * Allows clients to view and upload their own reference documents for style learning
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { useClientIdForUser } from '@/hooks/use-clients';
import { useClientStyleFiles, useUploadFiles } from '@/hooks/use-files';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileUpload } from '@/components/common/FileUpload';
import { FileList } from '@/components/common/FileList';
import { FileText, Upload, Sparkles, Info } from 'lucide-react';
import type { FileCategory } from '@/types';

export function ReferenceDocumentsPage() {
  const { t } = useLanguage();

  // Get the client ID for the current user
  const { data: clientId, isLoading: isLoadingClientId } = useClientIdForUser();

  // Get style files for the client
  const {
    data: styleFiles,
    isLoading: isLoadingFiles,
  } = useClientStyleFiles(clientId ?? undefined);

  const uploadFiles = useUploadFiles();

  // Handle file upload
  const handleUpload = async (files: File[]) => {
    if (!clientId) return;

    await uploadFiles.mutateAsync({
      files,
      clientId,
      category: 'style_reference' as FileCategory,
    });
  };

  if (isLoadingClientId) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!clientId) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">{t('errors.unauthorized')}</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-500" />
          {t('files.title')}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t('styleExtraction.uploadPrompt')}
        </p>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">
                {t('styleExtraction.title')}
              </p>
              <p>
                {t('styleExtraction.uploadPrompt')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Upload className="h-4 w-4 text-gray-400" />
            {t('files.uploadFiles')}
          </CardTitle>
          <CardDescription>
            {t('files.supportedTypes')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUpload
            onUpload={handleUpload}
            category="style_reference"
            maxFiles={10}
            disabled={uploadFiles.isPending}
          />
        </CardContent>
      </Card>

      {/* File List Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            {t('styleExtraction.existingFiles')}
            {styleFiles && styleFiles.length > 0 && (
              <span className="text-sm font-normal text-gray-500">
                ({styleFiles.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FileList
            files={styleFiles ?? []}
            isLoading={isLoadingFiles}
            showCategory
            showExtractionStatus
            canDelete={true}
            emptyMessage={t('styleExtraction.noFilesUploaded')}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default ReferenceDocumentsPage;
