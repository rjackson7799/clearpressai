import { useState } from 'react';
import { CheckIcon, RefreshCwIcon } from 'lucide-react';
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

export interface VariantColumnProps {
  variant: ContentVariant;
  onApproveToggle: (next: boolean) => void;
  onRegenerate: () => void;
  onSaveBody: (body: string) => Promise<void> | void;
  approving?: boolean;
  regenerating?: boolean;
}

export function VariantColumn({
  variant,
  onApproveToggle,
  onRegenerate,
  onSaveBody,
  approving,
  regenerating,
}: VariantColumnProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const minutes = Math.max(1, Math.round(variant.reading_time_seconds / 60));

  return (
    <div className="rounded-md border bg-card flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">案{variant.variant_index}</Badge>
          <span className="text-sm font-medium">{variant.variant_label}</span>
          {variant.internal_approved && (
            <Badge variant="default" className="gap-1">
              <CheckIcon className="size-3" />
              <BilingualLabel ja="承認済" en="Approved" />
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={variant.internal_approved ? 'outline' : 'default'}
            size="sm"
            disabled={approving || dirty}
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
            disabled={regenerating || dirty}
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
        />
      </div>

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
