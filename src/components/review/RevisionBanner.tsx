import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ArrowRightIcon, LockIcon, PencilIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { BilingualLabel } from '@/components/shared/BilingualLabel';
import { RequestRevisionDialog } from '@/components/audit/RequestRevisionDialog';
import { pickLang } from '@/lib/bilingual';
import type { AuditReport } from '@/types/domain';

interface RevisionBannerProps {
  projectId: string | undefined;
  latestReport: AuditReport | null | undefined;
}

// Two mutually-exclusive banners on the review page, driven by the project's
// latest audit report:
//  - finalized  -> "Editing locked" + a one-click "Revise & edit" that creates
//    the draft V1.1 (existing revise RPC) and unlocks the editor in place.
//  - draft V1.1 -> guidance to the remaining sign + redeliver steps. It points
//    ONLY at the audit page: create_delivery rejects while the head report is a
//    draft (audit_not_finalized), so a delivery link here would be a dead end.
export function RevisionBanner({ projectId, latestReport }: RevisionBannerProps) {
  const { i18n } = useTranslation();
  const [reviseOpen, setReviseOpen] = useState(false);

  const isLocked = latestReport?.status === 'finalized';
  const isDraftRevision =
    latestReport?.status === 'draft' &&
    latestReport?.previous_version_id != null;

  if (isLocked) {
    return (
      <>
        <Alert>
          <LockIcon className="size-4" />
          <AlertTitle>
            <BilingualLabel ja="編集ロック中" en="Editing locked" />
          </AlertTitle>
          <AlertDescription>
            <p>
              <BilingualLabel
                ja="本案件は確定済の監査レポートに紐づいています。修正には改訂が必要です。"
                en="This project is tied to a finalized audit report. To edit, request a revision."
              />
            </p>
            <Button type="button" size="sm" onClick={() => setReviseOpen(true)}>
              <PencilIcon className="size-4" />
              <BilingualLabel ja="改訂して編集" en="Revise & edit" />
            </Button>
          </AlertDescription>
        </Alert>
        <RequestRevisionDialog
          report={latestReport ?? undefined}
          open={reviseOpen}
          onOpenChange={setReviseOpen}
          projectId={projectId}
          defaultComment={pickLang(
            i18n.language,
            'クライアントフィードバック対応（本文の手動修正）',
            'Client feedback: manual copy revision',
          )}
          onRevised={() =>
            toast.success(
              pickLang(
                i18n.language,
                '改訂版を作成しました。本文を編集できます。',
                'Revision created. You can now edit the copy.',
              ),
            )
          }
        />
      </>
    );
  }

  if (isDraftRevision && projectId) {
    return (
      <Alert>
        <PencilIcon className="size-4" />
        <AlertTitle>
          <BilingualLabel ja="下書き改訂中" en="Draft revision in progress" />
        </AlertTitle>
        <AlertDescription>
          <p>
            <BilingualLabel
              ja="本文を編集し、変更した案のコンプライアンスを再確認してから、V1.1を署名・確定し、新しい配信を作成してください。"
              en="Edit the copy, re-check compliance on changed variants, then sign & finalize V1.1 and compose a new delivery."
            />
          </p>
          <Button asChild size="sm">
            <Link to={`/projects/${projectId}/audit`}>
              <BilingualLabel
                ja="コンプライアンスを再確認して署名"
                en="Re-check compliance & sign V1.1"
              />
              <ArrowRightIcon className="size-4" />
            </Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
