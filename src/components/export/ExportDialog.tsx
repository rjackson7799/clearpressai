/**
 * ClearPress AI - Export Dialog Component
 * Modal for selecting export format and options
 */

import { useState } from 'react';
import { FileDown, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useLanguage } from '@/contexts/LanguageContext';
import type { ExportFormat, ExportOptions, PaperSize } from '@/types/export';
import { DEFAULT_EXPORT_OPTIONS } from '@/types/export';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (options: ExportOptions) => Promise<void>;
  isExporting?: boolean;
}

export function ExportDialog({
  open,
  onOpenChange,
  onExport,
  isExporting = false,
}: ExportDialogProps) {
  const { t, language } = useLanguage();

  // Export options state
  const [format, setFormat] = useState<ExportFormat>(DEFAULT_EXPORT_OPTIONS.format);
  const [includeMetadata, setIncludeMetadata] = useState(
    DEFAULT_EXPORT_OPTIONS.includeMetadata
  );
  const [includeComplianceScore, setIncludeComplianceScore] = useState(
    DEFAULT_EXPORT_OPTIONS.includeComplianceScore
  );
  const [paperSize, setPaperSize] = useState<PaperSize>(DEFAULT_EXPORT_OPTIONS.paperSize);

  const handleExport = async () => {
    const options: ExportOptions = {
      format,
      includeMetadata,
      includeComplianceScore,
      language,
      paperSize,
    };
    await onExport(options);
  };

  const formatIcons: Record<ExportFormat, React.ReactNode> = {
    pdf: <FileDown className="h-4 w-4" />,
    docx: <FileSpreadsheet className="h-4 w-4" />,
    txt: <FileText className="h-4 w-4" />,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('export.title')}</DialogTitle>
          <DialogDescription>{t('export.description')}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Format Selection */}
          <div className="grid gap-2">
            <Label>{t('export.format')}</Label>
            <div className="grid grid-cols-3 gap-2">
              {(['pdf', 'docx', 'txt'] as const).map((f) => (
                <Button
                  key={f}
                  type="button"
                  variant={format === f ? 'default' : 'outline'}
                  className="flex flex-col h-auto py-3 gap-1"
                  onClick={() => setFormat(f)}
                >
                  {formatIcons[f]}
                  <span className="text-xs uppercase">{t(`export.${f}`)}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Paper Size (only for PDF and DOCX) */}
          {format !== 'txt' && (
            <div className="grid gap-2">
              <Label htmlFor="paper-size">{t('export.paperSize')}</Label>
              <Select
                value={paperSize}
                onValueChange={(value) => setPaperSize(value as PaperSize)}
              >
                <SelectTrigger id="paper-size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a4">A4</SelectItem>
                  <SelectItem value="letter">Letter (US)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Options */}
          <div className="space-y-4">
            <Label>{t('export.options')}</Label>

            <div className="flex items-center justify-between">
              <Label htmlFor="include-metadata" className="font-normal cursor-pointer">
                {t('export.includeMetadata')}
              </Label>
              <Switch
                id="include-metadata"
                checked={includeMetadata}
                onCheckedChange={setIncludeMetadata}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="include-compliance" className="font-normal cursor-pointer">
                {t('export.includeCompliance')}
              </Label>
              <Switch
                id="include-compliance"
                checked={includeComplianceScore}
                onCheckedChange={setIncludeComplianceScore}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('export.generating')}
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" />
                {t('export.download')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
