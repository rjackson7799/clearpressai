/**
 * VersionHistoryDialog - Full version history modal with all features
 */

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ContentVersion } from '@/types';
import { VersionListItem } from './VersionListItem';
import { VersionComparisonDialog } from './VersionComparisonDialog';
import { RestoreVersionDialog } from './RestoreVersionDialog';
import { MilestoneDialog } from './MilestoneDialog';
import {
  useMarkMilestone,
  useUnmarkMilestone,
  useRestoreVersion,
} from '@/hooks/use-versions';
import { useAuth } from '@/contexts/AuthContext';
import {
  History,
  GitCompare,
} from 'lucide-react';

interface VersionHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versions: ContentVersion[];
  currentVersionId?: string;
  contentItemId: string;
  isLoading?: boolean;
  onVersionSelect?: (versionId: string) => void;
  onVersionRestored?: () => void;
}

export function VersionHistoryDialog({
  open,
  onOpenChange,
  versions,
  currentVersionId,
  contentItemId,
  isLoading = false,
  onVersionSelect,
  onVersionRestored,
}: VersionHistoryDialogProps) {
  const { t } = useLanguage();
  const { user } = useAuth();

  // State for nested dialogs
  const [showMilestonesOnly, setShowMilestonesOnly] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<Set<string>>(new Set());
  const [comparisonMode, setComparisonMode] = useState(false);

  // Nested dialog states
  const [milestoneDialogVersion, setMilestoneDialogVersion] = useState<ContentVersion | null>(null);
  const [restoreDialogVersion, setRestoreDialogVersion] = useState<ContentVersion | null>(null);
  const [comparisonVersions, setComparisonVersions] = useState<{
    version1: ContentVersion | null;
    version2: ContentVersion | null;
  }>({ version1: null, version2: null });

  // Mutations
  const markMilestone = useMarkMilestone();
  const unmarkMilestone = useUnmarkMilestone();
  const restoreVersion = useRestoreVersion();

  // Filter versions
  const filteredVersions = useMemo(() => {
    if (showMilestonesOnly) {
      return versions.filter((v) => v.is_milestone);
    }
    return versions;
  }, [versions, showMilestonesOnly]);

  // Toggle version selection for comparison
  const toggleVersionSelection = (versionId: string, checked: boolean) => {
    const newSelected = new Set(selectedVersions);
    if (checked) {
      if (newSelected.size < 2) {
        newSelected.add(versionId);
      }
    } else {
      newSelected.delete(versionId);
    }
    setSelectedVersions(newSelected);
  };

  // Start comparison with selected versions
  const handleStartComparison = () => {
    if (selectedVersions.size === 2) {
      const selectedIds = Array.from(selectedVersions);
      const v1 = versions.find((v) => v.id === selectedIds[0]);
      const v2 = versions.find((v) => v.id === selectedIds[1]);

      if (v1 && v2) {
        // Order by version number (older first)
        if (v1.version_number > v2.version_number) {
          setComparisonVersions({ version1: v2, version2: v1 });
        } else {
          setComparisonVersions({ version1: v1, version2: v2 });
        }
      }
    }
  };

  // Compare single version with current
  const handleCompareWithCurrent = (version: ContentVersion) => {
    const currentVersion = versions.find((v) => v.id === currentVersionId);
    if (currentVersion) {
      setComparisonVersions({
        version1: version,
        version2: currentVersion,
      });
    }
  };

  // Swap comparison versions
  const handleSwapVersions = () => {
    setComparisonVersions({
      version1: comparisonVersions.version2,
      version2: comparisonVersions.version1,
    });
  };

  // Handle milestone save
  const handleMilestoneSave = async (name: string) => {
    if (!milestoneDialogVersion) return;
    await markMilestone.mutateAsync({
      versionId: milestoneDialogVersion.id,
      contentItemId,
      milestoneName: name,
    });
    setMilestoneDialogVersion(null);
  };

  // Handle milestone remove
  const handleMilestoneRemove = async () => {
    if (!milestoneDialogVersion) return;
    await unmarkMilestone.mutateAsync({
      versionId: milestoneDialogVersion.id,
      contentItemId,
    });
    setMilestoneDialogVersion(null);
  };

  // Handle restore confirm
  const handleRestoreConfirm = async () => {
    if (!restoreDialogVersion || !user) return;
    await restoreVersion.mutateAsync({
      versionId: restoreDialogVersion.id,
      contentItemId,
    });
    setRestoreDialogVersion(null);
    onVersionRestored?.();
  };

  // Close and reset state
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setComparisonMode(false);
      setSelectedVersions(new Set());
      setShowMilestonesOnly(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              {t('versions.history')}
              {versions.length > 0 && (
                <span className="text-muted-foreground font-normal text-sm">
                  ({versions.length})
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Controls bar */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="milestones-only"
                  checked={showMilestonesOnly}
                  onCheckedChange={setShowMilestonesOnly}
                />
                <Label htmlFor="milestones-only" className="text-sm cursor-pointer">
                  {t('versions.showMilestonesOnly')}
                </Label>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {comparisonMode ? (
                <>
                  <span className="text-sm text-muted-foreground">
                    {selectedVersions.size}/2 selected
                  </span>
                  <Button
                    size="sm"
                    disabled={selectedVersions.size !== 2}
                    onClick={handleStartComparison}
                  >
                    <GitCompare className="h-4 w-4 mr-1" />
                    {t('versions.compare')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setComparisonMode(false);
                      setSelectedVersions(new Set());
                    }}
                  >
                    {t('common.cancel')}
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setComparisonMode(true)}
                  disabled={versions.length < 2}
                >
                  <GitCompare className="h-4 w-4 mr-1" />
                  {t('versions.selectToCompare')}
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Version list */}
          <ScrollArea className="flex-1 min-h-0 -mx-6 px-6">
            {isLoading ? (
              <div className="space-y-2 py-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
            ) : filteredVersions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                {showMilestonesOnly
                  ? t('versions.noMilestones')
                  : t('editor.noVersions')}
              </div>
            ) : (
              <div className="space-y-1 py-2">
                {filteredVersions.map((version) => (
                  <VersionListItem
                    key={version.id}
                    version={version}
                    isActive={version.id === currentVersionId}
                    isSelected={selectedVersions.has(version.id)}
                    selectionMode={comparisonMode}
                    onSelect={() => {
                      onVersionSelect?.(version.id);
                      if (!comparisonMode) {
                        onOpenChange(false);
                      }
                    }}
                    onCheckboxChange={(checked) => toggleVersionSelection(version.id, checked)}
                    onRestore={() => setRestoreDialogVersion(version)}
                    onCompare={() => handleCompareWithCurrent(version)}
                    onSetMilestone={() => setMilestoneDialogVersion(version)}
                    onRemoveMilestone={() => setMilestoneDialogVersion(version)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Nested dialogs */}
      <MilestoneDialog
        open={!!milestoneDialogVersion}
        onOpenChange={(open) => !open && setMilestoneDialogVersion(null)}
        version={milestoneDialogVersion}
        onSave={handleMilestoneSave}
        onRemove={milestoneDialogVersion?.is_milestone ? handleMilestoneRemove : undefined}
        isLoading={markMilestone.isPending || unmarkMilestone.isPending}
      />

      <RestoreVersionDialog
        open={!!restoreDialogVersion}
        onOpenChange={(open) => !open && setRestoreDialogVersion(null)}
        version={restoreDialogVersion}
        onConfirm={handleRestoreConfirm}
        isLoading={restoreVersion.isPending}
      />

      <VersionComparisonDialog
        open={!!comparisonVersions.version1 && !!comparisonVersions.version2}
        onOpenChange={(open) => {
          if (!open) {
            setComparisonVersions({ version1: null, version2: null });
          }
        }}
        version1={comparisonVersions.version1}
        version2={comparisonVersions.version2}
        onSwap={handleSwapVersions}
      />
    </>
  );
}
