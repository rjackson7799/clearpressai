import { useState } from "react";
import { AlertCircleIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { BilingualLabel } from "@/components/shared/BilingualLabel";
import { useSignAuditReport } from "@/hooks/useSignAuditReport";
import type { AuditReport } from "@/types/domain";

interface SignAuditDialogProps {
  report: AuditReport | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | undefined;
  onSigned?: () => void;
}

// I3 gate failures arrive as P0004 messages from the RPC, surfaced as
// validation_error/409 by the Edge Function. Map them to localized
// guidance so the reviewer knows what to fix without reading SQL output.
const GATE_MESSAGES: Record<string, { ja: string; en: string }> = {
  not_authenticated: {
    ja: "認証が必要です",
    en: "Not authenticated",
  },
  report_not_found: {
    ja: "レポートが見つかりません",
    en: "Report not found",
  },
  report_not_draft: {
    ja: "下書き状態のレポートしか署名できません",
    en: "Only draft reports can be signed",
  },
  signer_mismatch: {
    ja: "署名者IDが認証ユーザーと一致しません",
    en: "Signer ID does not match the authenticated user",
  },
  no_approved_variants: {
    ja: "承認された案が1件もありません。署名前に少なくとも1案を承認してください。",
    en: "No approved variants. Approve at least one variant before signing.",
  },
  unresolved_blockers_exist: {
    ja: "未解決の阻止指摘事項があります。修正または承認のうえ、再チェックしてください。",
    en: "Unresolved blocker findings remain. Fix or acknowledge, then re-check.",
  },
  compliance_stale: {
    ja: "本文編集後にコンプライアンス再チェックが行われていません。再チェックしてから署名してください。",
    en: "Compliance is stale after a body edit. Re-run compliance, then sign.",
  },
  compliance_not_run: {
    ja: "承認済みの案にコンプライアンスチェック履歴がありません。再チェックを実行してください。",
    en: "Approved variants have no compliance_checked event. Run compliance first.",
  },
  snapshot_mismatch: {
    ja: "スナップショットがサーバーの状態と一致しません。ページを再読み込みして再試行してください。",
    en: "Snapshot disagreed with server state. Reload the page and try again.",
  },
};

function explainError(message: string): { ja: string; en: string } | null {
  for (const key of Object.keys(GATE_MESSAGES)) {
    if (message.includes(key)) return GATE_MESSAGES[key];
  }
  return null;
}

export function SignAuditDialog({
  report,
  open,
  onOpenChange,
  projectId,
  onSigned,
}: SignAuditDialogProps) {
  const sign = useSignAuditReport(projectId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset stale error when the dialog dismisses so the next open starts
  // clean. Avoids react-hooks/set-state-in-effect by piggybacking on the
  // close transition rather than a useEffect.
  const handleOpenChange = (next: boolean) => {
    if (!next) setErrorMessage(null);
    onOpenChange(next);
  };

  const handleSign = () => {
    if (!report) return;
    setErrorMessage(null);
    sign.mutate(
      { auditReportId: report.id },
      {
        onSuccess: () => {
          handleOpenChange(false);
          onSigned?.();
        },
        onError: (e) => setErrorMessage(e.message),
      },
    );
  };

  const localized = errorMessage ? explainError(errorMessage) : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <BilingualLabel
              ja="監査レポートに署名"
              en="Sign audit report"
            />
          </DialogTitle>
          <DialogDescription>
            <BilingualLabel
              ja="本レポートを確定し、内容のスナップショットに対する署名を保存します。確定後は内容を編集できません。改訂が必要な場合は確定後に「改訂を要求」ボタンを使用してください。"
              en="This finalizes the report and stores an HMAC signature over the content snapshot. Finalized reports cannot be edited; use Request Revision afterward if changes are needed."
            />
          </DialogDescription>
        </DialogHeader>

        {report && (
          <div className="text-sm space-y-1 rounded-md border bg-muted/40 p-3">
            <p className="font-mono text-xs">{report.report_id_display}</p>
            <p>
              <BilingualLabel ja="バージョン" en="Version" /> {report.version}
            </p>
          </div>
        )}

        {errorMessage && (
          <Alert variant="destructive">
            <AlertCircleIcon className="size-4" />
            <AlertTitle>
              <BilingualLabel ja="署名を完了できません" en="Cannot sign" />
            </AlertTitle>
            <AlertDescription>
              {localized ? (
                <BilingualLabel ja={localized.ja} en={localized.en} />
              ) : (
                <span>{errorMessage}</span>
              )}
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={sign.isPending}
          >
            <BilingualLabel ja="キャンセル" en="Cancel" />
          </Button>
          <Button
            type="button"
            onClick={handleSign}
            disabled={sign.isPending || !report}
          >
            {sign.isPending ? (
              <BilingualLabel ja="署名中…" en="Signing…" />
            ) : (
              <BilingualLabel ja="署名して確定" en="Sign & finalize" />
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
