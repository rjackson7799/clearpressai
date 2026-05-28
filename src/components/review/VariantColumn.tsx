import { useState } from 'react';
import { AlertTriangleIcon, CheckIcon, RefreshCwIcon, ShieldAlertIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { BilingualLabel } from '@/components/shared/BilingualLabel';
import { VariantEditor } from '@/components/review/VariantEditor';
import type { ContentVariant } from '@/types/domain';
import type { ComplianceFindingWithStale } from '@/hooks/useComplianceFindings';

export interface VariantColumnProps {
  variant: ContentVariant;
  findings: ComplianceFindingWithStale[];
  onApproveToggle: (next: boolean) => void;
  onRegenerate: () => void;
  onSaveBody: (body: string) => Promise<void> | void;
  onOpenCompliance: () => void;
  approving?: boolean;
  regenerating?: boolean;
  // I2 corollary: when the project's latest audit report is finalized, the
  // column locks. Editor is read-only and approve/regenerate are disabled
  // until the user requests a revision on the audit page.
  locked?: boolean;
}

export function VariantColumn({
  variant,
  findings,
  onApproveToggle,
  onRegenerate,
  onSaveBody,
  onOpenCompliance,
  approving,
  regenerating,
  locked = false,
}: VariantColumnProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const minutes = Math.max(1, Math.round(variant.reading_time_seconds / 60));

  const unresolved = findings.filter((f) => f.resolution_status === 'unresolved');
  const blockerCount = unresolved.filter((f) => f.severity === 'blocker').length;
  const warningCount = unresolved.filter((f) => f.severity === 'warning').length;
  const noteCount = unresolved.filter((f) => f.severity === 'note').length;
  const anyStale = findings.some((f) => f.is_stale);
  const hasFindings = findings.length > 0;

  return (
    <div className="rounded-md border bg-card flex flex-col">
      <div className="flex flex-col gap-2 px-4 py-3 border-b">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="shrink-0">
            案{variant.variant_index}
          </Badge>
          <span className="text-sm font-medium whitespace-nowrap">
            {variant.variant_label}
          </span>
          {variant.internal_approved && (
            <Badge variant="default" className="gap-1 shrink-0">
              <CheckIcon className="size-3" />
              <BilingualLabel ja="承認済" en="Approved" />
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant={variant.internal_approved ? 'outline' : 'default'}
            size="sm"
            disabled={approving || dirty || locked}
            onClick={() => onApproveToggle(!variant.internal_approved)}
          >
            {variant.internal_approved ? (
              <BilingualLabel ja="承認を取り消す" en="Unapprove" />
            ) : (
              <BilingualLabel ja="承認" en="Approve" />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={regenerating || dirty || locked}
            onClick={() => setConfirmOpen(true)}
          >
            <RefreshCwIcon className="size-3" />
            <BilingualLabel ja="再生成" en="Regenerate" />
          </Button>
        </div>
      </div>

      <div className="px-4 py-4 flex-1">
        <VariantEditor
          key={variant.updated_at}
          initialBodyText={variant.body_text}
          onSave={onSaveBody}
          onDirtyChange={setDirty}
          readOnly={locked}
        />
      </div>

      {hasFindings && (
        <div className="px-4 py-2 border-t flex items-center justify-between gap-2">
          <button
            type="button"
            className="flex items-center gap-1.5 text-xs hover:underline"
            onClick={onOpenCompliance}
          >
            <ShieldAlertIcon className="size-3.5" />
            {blockerCount > 0 && (
              <Badge variant="destructive" className="px-1.5">
                {blockerCount}
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="default" className="px-1.5">
                {warningCount}
              </Badge>
            )}
            {noteCount > 0 && (
              <Badge variant="secondary" className="px-1.5">
                {noteCount}
              </Badge>
            )}
            <BilingualLabel ja="指摘を見る" en="View findings" />
          </button>
          {anyStale && (
            <span className="flex items-center gap-1 text-xs text-amber-700">
              <AlertTriangleIcon className="size-3" />
              <BilingualLabel ja="要再チェック" en="Stale" />
            </span>
          )}
        </div>
      )}

      <div className="px-4 py-2 border-t text-xs text-muted-foreground flex items-center justify-between">
        <span>{variant.char_count}字</span>
        <span>
          <BilingualLabel ja={`読了時間 約${minutes}分`} en={`~${minutes} min read`} />
        </span>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <BilingualLabel
                ja={`案${variant.variant_index}を再生成しますか？`}
                en={`Regenerate variant ${variant.variant_index}?`}
              />
            </AlertDialogTitle>
            <AlertDialogDescription>
              <BilingualLabel
                ja="現在の本文とコンプライアンス検査結果は削除されます。"
                en="The current body and compliance findings will be discarded."
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <BilingualLabel ja="キャンセル" en="Cancel" />
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false);
                onRegenerate();
              }}
            >
              <BilingualLabel ja="再生成" en="Regenerate" />
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
