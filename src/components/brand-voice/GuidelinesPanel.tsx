import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useArchiveGuideline,
  useCreateGuideline,
  useGuidelines,
} from "@/hooks/useGuidelines";
import type { GuidelineSourceType } from "@/types/domain";

const SOURCE_COLORS: Record<GuidelineSourceType, string> = {
  extraction: "bg-blue-100 text-blue-900 hover:bg-blue-100 border-blue-200",
  internal_annotation: "",
  client_feedback:
    "bg-emerald-100 text-emerald-900 hover:bg-emerald-100 border-emerald-200",
  legal_review:
    "bg-amber-100 text-amber-900 hover:bg-amber-100 border-amber-200",
};

interface Props {
  clientId: string;
}

export function GuidelinesPanel({ clientId }: Props) {
  const { t, i18n } = useTranslation();
  const { data: guidelines, isLoading } = useGuidelines(clientId);
  const createGuideline = useCreateGuideline(clientId);
  const archiveGuideline = useArchiveGuideline(clientId);
  const [draft, setDraft] = useState("");
  const [pendingArchive, setPendingArchive] = useState<string | null>(null);

  const handleAdd = async () => {
    const text = draft.trim();
    if (!text) return;
    try {
      await createGuideline.mutateAsync({
        guideline_text: text,
        source_type: "internal_annotation",
      });
      setDraft("");
      toast.success(t("guidelines.createdToast"));
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-2 rounded-md border bg-card p-4">
        <h3 className="text-sm font-medium">{t("guidelines.addAnnotation")}</h3>
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t("guidelines.annotationPlaceholder")}
          rows={3}
        />
        <div>
          <Button
            onClick={handleAdd}
            disabled={!draft.trim() || createGuideline.isPending}
          >
            {t("guidelines.save")}
          </Button>
        </div>
      </section>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : !guidelines || guidelines.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t("guidelines.empty")}
        </div>
      ) : (
        <ul className="space-y-2">
          {guidelines.map((g) => {
            const sourceType = g.source_type as GuidelineSourceType;
            return (
              <li
                key={g.id}
                className="space-y-2 rounded-md border bg-card p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant="outline"
                    className={SOURCE_COLORS[sourceType] ?? ""}
                  >
                    {t(`guidelines.source.${sourceType}`)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(g.created_at).toLocaleString(
                      i18n.language === "ja" ? "ja-JP" : "en-US",
                    )}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm">{g.guideline_text}</p>
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPendingArchive(g.id)}
                  >
                    {t("guidelines.archive")}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <AlertDialog
        open={pendingArchive !== null}
        onOpenChange={(open) => !open && setPendingArchive(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("guidelines.confirmArchive")}</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!pendingArchive) return;
                try {
                  await archiveGuideline.mutateAsync(pendingArchive);
                  toast.success(t("guidelines.archivedToast"));
                  setPendingArchive(null);
                } catch (e) {
                  toast.error((e as Error).message);
                }
              }}
            >
              {t("guidelines.archive")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
