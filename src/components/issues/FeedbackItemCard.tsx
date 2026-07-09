import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Trash2Icon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { pickLang } from "@/lib/bilingual";
import {
  INTERNAL_FEEDBACK_STATUSES,
  feedbackStatusLabel,
  feedbackTypeLabel,
  feedbackTypeVariant,
} from "@/lib/internal-feedback";
import type { InternalFeedbackStatus } from "@/types/domain";
import {
  useUpdateFeedbackStatus,
  useDeleteInternalFeedback,
  useFeedbackAttachmentUrls,
  type InternalFeedbackWithAttachments,
} from "@/hooks/useInternalFeedback";

export function FeedbackItemCard({
  item,
}: {
  item: InternalFeedbackWithAttachments;
}) {
  const { t, i18n } = useTranslation();
  const updateStatus = useUpdateFeedbackStatus();
  const del = useDeleteInternalFeedback();

  const attachments = item.internal_feedback_attachments ?? [];
  const paths = attachments.map((a) => a.storage_path);
  const { data: urls } = useFeedbackAttachmentUrls(paths);

  const typeLabel = feedbackTypeLabel(item.type);

  const handleDelete = () => {
    del.mutate(item.id, {
      onSuccess: () => toast.success(t("internalFeedback.toasts.deleted")),
      onError: () => toast.error(t("internalFeedback.toasts.deleteFailed")),
    });
  };

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={feedbackTypeVariant(item.type)}>
              {pickLang(i18n.language, typeLabel.ja, typeLabel.en)}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(item.created_at).toLocaleString(
                i18n.language.startsWith("ja") ? "ja-JP" : "en-US",
              )}
            </span>
            {item.created_by_user?.email && (
              <span className="text-xs text-muted-foreground">
                · {item.created_by_user.email}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={item.status}
              onValueChange={(status) =>
                updateStatus.mutate(
                  { id: item.id, status: status as InternalFeedbackStatus },
                  {
                    onSuccess: () =>
                      toast.success(t("internalFeedback.toasts.statusUpdated")),
                    onError: () =>
                      toast.error(
                        t("internalFeedback.toasts.statusUpdateFailed"),
                      ),
                  },
                )
              }
              disabled={updateStatus.isPending}
            >
              <SelectTrigger className="h-8 w-[9.5rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTERNAL_FEEDBACK_STATUSES.map((s) => {
                  const label = feedbackStatusLabel(s);
                  return (
                    <SelectItem key={s} value={s}>
                      {pickLang(i18n.language, label.ja, label.en)}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={t("common.delete")}
                  disabled={del.isPending}
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {pickLang(
                      i18n.language,
                      "このフィードバックを削除しますか？",
                      "Delete this feedback?",
                    )}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {pickLang(
                      i18n.language,
                      "この操作は取り消せません。添付画像も削除されます。",
                      "This cannot be undone. Attached images are also removed.",
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    {t("common.delete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <p className="whitespace-pre-wrap text-sm">{item.message}</p>

        {attachments.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {attachments.map((a) => {
              const url = urls?.[a.storage_path];
              return (
                <li key={a.id}>
                  {url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={url}
                        alt={a.filename}
                        className="size-20 rounded-md border object-cover"
                      />
                    </a>
                  ) : (
                    <div className="size-20 animate-pulse rounded-md border bg-muted" />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
