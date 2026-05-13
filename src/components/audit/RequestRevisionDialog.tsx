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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BilingualLabel } from "@/components/shared/BilingualLabel";
import { useReviseAuditReport } from "@/hooks/useReviseAuditReport";
import type { AuditReport } from "@/types/domain";

interface RequestRevisionDialogProps {
  report: AuditReport | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | undefined;
  onRevised?: (newReport: AuditReport) => void;
}

// P0004 -> localized guidance, narrower set than SignAuditDialog.
const ERROR_MESSAGES: Record<string, { ja: string; en: string }> = {
  not_authenticated: { ja: "認証が必要です", en: "Not authenticated" },
  report_not_found: {
    ja: "レポートが見つかりません",
    en: "Report not found",
  },
  source_not_finalized: {
    ja: "確定済のレポートのみ改訂できます",
    en: "Only finalized reports can be revised",
  },
  not_head_of_chain: {
    ja: "このバージョンは既に改訂済です。最新版から改訂を開始してください。",
    en: "This version has already been superseded. Start a revision from the latest version.",
  },
  draft_report_already_exists: {
    ja: "改訂作業中のドラフトが既に存在します。",
    en: "A draft revision is already in progress.",
  },
};

function explainError(message: string): { ja: string; en: string } | null {
  for (const key of Object.keys(ERROR_MESSAGES)) {
    if (message.includes(key)) return ERROR_MESSAGES[key];
  }
  return null;
}

export function RequestRevisionDialog({
  report,
  open,
  onOpenChange,
  projectId,
  onRevised,
}: RequestRevisionDialogProps) {
  const revise = useReviseAuditReport(projectId);
  const [comment, setComment] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset local state on dismiss; avoids react-hooks/set-state-in-effect.
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setErrorMessage(null);
      setComment("");
    }
    onOpenChange(next);
  };

  const handleSubmit = () => {
    if (!report) return;
    setErrorMessage(null);
    revise.mutate(
      { auditReportId: report.id, comment: comment.trim() },
      {
        onSuccess: (newReport) => {
          handleOpenChange(false);
          onRevised?.(newReport);
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
            <BilingualLabel ja="改訂を要求" en="Request revision" />
          </DialogTitle>
          <DialogDescription>
            <BilingualLabel
              ja="現在のレポートを複製し、新しい下書きバージョンを作成します。確定したレポートはアーカイブとして保持され、新しい下書きで編集を行えます。"
              en="Clones the current report into a new draft version. The finalized report stays as an archive; the draft becomes editable."
            />
          </DialogDescription>
        </DialogHeader>

        {report && (
          <div className="text-sm space-y-1 rounded-md border bg-muted/40 p-3">
            <p className="font-mono text-xs">{report.report_id_display}</p>
            <p>
              <BilingualLabel ja="現在のバージョン" en="Current version" />{" "}
              {report.version}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="revision-comment">
            <BilingualLabel ja="改訂理由" en="Revision reason" />
          </Label>
          <Textarea
            id="revision-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="例: クライアントから誇大表現の指摘を受けたため再修正"
            rows={4}
            disabled={revise.isPending}
          />
        </div>

        {errorMessage && (
          <Alert variant="destructive">
            <AlertCircleIcon className="size-4" />
            <AlertTitle>
              <BilingualLabel ja="改訂を開始できません" en="Cannot revise" />
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
            disabled={revise.isPending}
          >
            <BilingualLabel ja="キャンセル" en="Cancel" />
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={revise.isPending || !report}
          >
            {revise.isPending ? (
              <BilingualLabel ja="作成中…" en="Creating…" />
            ) : (
              <BilingualLabel ja="改訂版を作成" en="Create revision" />
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
