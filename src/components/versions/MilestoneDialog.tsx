/**
 * MilestoneDialog - Dialog for creating/editing milestone names
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatTranslation } from '@/lib/translations';
import type { ContentVersion } from '@/types';
import { Star } from 'lucide-react';

interface MilestoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  version: ContentVersion | null;
  onSave: (milestoneName: string) => void;
  onRemove?: () => void;
  isLoading?: boolean;
}

const PRESET_KEYS = ['draft', 'final', 'approved', 'submitted', 'review'] as const;

export function MilestoneDialog({
  open,
  onOpenChange,
  version,
  onSave,
  onRemove,
  isLoading = false,
}: MilestoneDialogProps) {
  const { t } = useLanguage();
  const [milestoneName, setMilestoneName] = useState('');

  // Reset form when dialog opens/closes or version changes
  useEffect(() => {
    if (open && version) {
      setMilestoneName(version.milestone_name ?? '');
    } else if (!open) {
      setMilestoneName('');
    }
  }, [open, version]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (milestoneName.trim()) {
      onSave(milestoneName.trim());
    }
  };

  const handlePresetClick = (presetKey: typeof PRESET_KEYS[number]) => {
    const presetName = t(`versions.presets.${presetKey}`);
    setMilestoneName(presetName);
  };

  if (!version) return null;

  const isEditing = version.is_milestone;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            {isEditing ? t('versions.setMilestone') : t('versions.setMilestone')}
          </DialogTitle>
          <DialogDescription>
            {formatTranslation(t('versions.versionNumber'), { number: version.version_number })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="milestone-name">{t('versions.milestoneName')}</Label>
            <Input
              id="milestone-name"
              value={milestoneName}
              onChange={(e) => setMilestoneName(e.target.value)}
              placeholder={t('versions.milestoneNamePlaceholder')}
              autoFocus
            />
          </div>

          {/* Preset options */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">
              Quick select
            </Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_KEYS.map((key) => (
                <Badge
                  key={key}
                  variant={milestoneName === t(`versions.presets.${key}`) ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => handlePresetClick(key)}
                >
                  {t(`versions.presets.${key}`)}
                </Badge>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {isEditing && onRemove && (
              <Button
                type="button"
                variant="destructive"
                onClick={onRemove}
                disabled={isLoading}
                className="mr-auto"
              >
                {t('versions.removeMilestone')}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={!milestoneName.trim() || isLoading}
            >
              {isLoading ? t('common.loading') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
