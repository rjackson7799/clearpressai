/**
 * ClearPress AI - Style Extraction Panel
 * Panel for uploading reference documents and extracting client style profiles
 */

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileUpload } from '@/components/common/FileUpload';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  Upload,
  Loader2,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { useUploadFiles, useClientStyleFiles } from '@/hooks/use-files';
import { useExtractStyleWithProgress, type ExtractedStyle } from '@/hooks/use-ai';
import type { FileCategory, FileRecord } from '@/types';

interface StyleExtractionPanelProps {
  clientId: string;
  onExtractionComplete?: (extractedStyle: ExtractedStyle) => void;
  className?: string;
}

type MergeMode = 'replace' | 'merge';

export function StyleExtractionPanel({
  clientId,
  onExtractionComplete,
  className,
}: StyleExtractionPanelProps) {
  const { t, language } = useLanguage();

  const [mergeMode, setMergeMode] = useState<MergeMode>('merge');
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Hooks
  const uploadFiles = useUploadFiles();
  const { data: styleFiles, isLoading: isLoadingFiles } = useClientStyleFiles(clientId);
  const {
    extract,
    progress,
    isExtracting,
    data: extractionResult,
  } = useExtractStyleWithProgress();

  // Handle file upload
  const handleUpload = async (files: File[]) => {
    await uploadFiles.mutateAsync({
      files,
      clientId,
      category: 'style_reference' as FileCategory,
    });
  };

  // Handle extraction
  const handleExtract = async () => {
    const fileIds = selectedFileIds.length > 0 ? selectedFileIds : (styleFiles?.map(f => f.id) || []);

    if (fileIds.length === 0) {
      return;
    }

    const result = await extract({
      file_ids: fileIds,
      client_id: clientId,
      merge_mode: mergeMode,
      language,
    });

    if (result.success && result.extracted_style) {
      setShowPreview(true);
      onExtractionComplete?.(result.extracted_style);
    }
  };

  // Handle file selection toggle
  const toggleFileSelection = (fileId: string) => {
    setSelectedFileIds((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId]
    );
  };

  // Select all files
  const selectAllFiles = () => {
    if (styleFiles) {
      setSelectedFileIds(styleFiles.map((f) => f.id));
    }
  };

  // Deselect all files
  const deselectAllFiles = () => {
    setSelectedFileIds([]);
  };

  const hasFiles = styleFiles && styleFiles.length > 0;
  const canExtract = hasFiles && !isExtracting;
  const extractedStyle = extractionResult?.extracted_style;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Upload Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Upload className="h-4 w-4 text-gray-400" />
            {t('styleExtraction.uploadTitle')}
          </CardTitle>
          <CardDescription>
            {t('styleExtraction.uploadPrompt')}
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

      {/* Existing Files Section */}
      {hasFiles && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-400" />
                {t('styleExtraction.existingFiles')}
                <Badge variant="secondary" className="ml-2">
                  {styleFiles.length}
                </Badge>
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllFiles}
                  disabled={selectedFileIds.length === styleFiles.length}
                >
                  {t('common.selectAll')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={deselectAllFiles}
                  disabled={selectedFileIds.length === 0}
                >
                  {t('common.deselectAll')}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {styleFiles.map((file) => (
                <SelectableFileItem
                  key={file.id}
                  file={file}
                  isSelected={selectedFileIds.includes(file.id)}
                  onToggle={() => toggleFileSelection(file.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Extraction Settings & Action */}
      {hasFiles && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              {t('styleExtraction.extractTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Merge Mode Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {t('styleExtraction.modeLabel')}
              </label>
              <Select
                value={mergeMode}
                onValueChange={(value) => setMergeMode(value as MergeMode)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="merge">
                    {t('styleExtraction.mergeMode')}
                  </SelectItem>
                  <SelectItem value="replace">
                    {t('styleExtraction.replaceMode')}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {mergeMode === 'merge'
                  ? t('styleExtraction.mergeModeDescription')
                  : t('styleExtraction.replaceModeDescription')
                }
              </p>
            </div>

            {/* Progress */}
            {isExtracting && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-gray-500 text-center">
                  {t('styleExtraction.extracting')} ({Math.round(progress)}%)
                </p>
              </div>
            )}

            {/* Extract Button */}
            <Button
              onClick={handleExtract}
              disabled={!canExtract}
              className="w-full"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('styleExtraction.extracting')}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t('styleExtraction.extractButton')}
                  {selectedFileIds.length > 0 && (
                    <span className="ml-1">({selectedFileIds.length})</span>
                  )}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Extraction Result Preview */}
      {showPreview && extractedStyle && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-green-800">
              <CheckCircle2 className="h-4 w-4" />
              {t('styleExtraction.extractSuccess')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ExtractionPreview extractedStyle={extractedStyle} />
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!hasFiles && !isLoadingFiles && (
        <div className="text-center py-8 text-gray-500">
          <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-sm">{t('styleExtraction.noFilesUploaded')}</p>
        </div>
      )}
    </div>
  );
}

interface SelectableFileItemProps {
  file: FileRecord;
  isSelected: boolean;
  onToggle: () => void;
}

function SelectableFileItem({ file, isSelected, onToggle }: SelectableFileItemProps) {
  const { t } = useLanguage();

  return (
    <div
      onClick={onToggle}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      )}
    >
      <div
        className={cn(
          'h-5 w-5 rounded border-2 flex items-center justify-center transition-colors',
          isSelected
            ? 'border-blue-500 bg-blue-500'
            : 'border-gray-300'
        )}
      >
        {isSelected && (
          <CheckCircle2 className="h-3 w-3 text-white" />
        )}
      </div>
      <FileText className="h-4 w-4 text-gray-400" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Badge variant="secondary" className="text-xs px-1.5 py-0">
            {t(`files.category.${file.category}`)}
          </Badge>
          {file.extraction_status === 'completed' && (
            <span className="text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {t('files.extraction.completed')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

interface ExtractionPreviewProps {
  extractedStyle: ExtractedStyle;
}

function ExtractionPreview({ extractedStyle }: ExtractionPreviewProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4 text-sm">
      {/* Tone */}
      {extractedStyle.tone && (
        <div>
          <p className="font-medium text-gray-700">{t('clients.tone')}</p>
          <p className="text-gray-600">{extractedStyle.tone}</p>
        </div>
      )}

      {/* Formality */}
      <div>
        <p className="font-medium text-gray-700">{t('clients.formality')}</p>
        <Badge variant="secondary">
          {t(`clients.formality${extractedStyle.formality.charAt(0).toUpperCase() + extractedStyle.formality.slice(1)}`)}
        </Badge>
      </div>

      {/* Key Messages */}
      {extractedStyle.key_messages.length > 0 && (
        <div>
          <p className="font-medium text-gray-700">{t('clients.keyMessages')}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {extractedStyle.key_messages.map((msg, i) => (
              <Badge key={i} variant="secondary" className="bg-blue-100 text-blue-700">
                {msg}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Avoid Phrases */}
      {extractedStyle.avoid_phrases.length > 0 && (
        <div>
          <p className="font-medium text-gray-700">{t('clients.avoidPhrases')}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {extractedStyle.avoid_phrases.map((phrase, i) => (
              <Badge key={i} variant="secondary" className="bg-red-100 text-red-700">
                {phrase}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Notes */}
      {extractedStyle.analysis_notes.length > 0 && (
        <div>
          <p className="font-medium text-gray-700">{t('styleExtraction.analysisNotes')}</p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 mt-1">
            {extractedStyle.analysis_notes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default StyleExtractionPanel;
