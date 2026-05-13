import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useBrandVoiceSamples,
  useDeleteSample,
} from "@/hooks/useBrandVoiceSamples";
import { MIN_USABLE_CHARS } from "@/lib/utils/file-extraction";
import type { BrandVoiceSample } from "@/types/domain";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(value: string, locale: string) {
  return new Date(value).toLocaleDateString(
    locale === "ja" ? "ja-JP" : "en-US",
    { year: "numeric", month: "short", day: "numeric" },
  );
}

interface Props {
  clientId: string;
}

export function SampleList({ clientId }: Props) {
  const { t, i18n } = useTranslation();
  const { data, isLoading } = useBrandVoiceSamples(clientId);
  const deleteSample = useDeleteSample(clientId);
  const [pending, setPending] = useState<BrandVoiceSample | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <>
      <ul className="space-y-1">
        {data.map((sample) => {
          const chars = sample.content_text?.length ?? 0;
          const lowText = chars < MIN_USABLE_CHARS;
          return (
            <li
              key={sample.id}
              className="flex items-center justify-between gap-2 rounded-md border bg-card px-3 py-2 text-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{sample.filename}</div>
                <div className="text-xs text-muted-foreground">
                  {formatBytes(sample.byte_size)} ·{" "}
                  {formatDate(sample.uploaded_at, i18n.language)}
                </div>
              </div>
              <Badge variant={lowText ? "destructive" : "secondary"}>
                {chars.toLocaleString()} chars
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPending(sample)}
              >
                {t("common.delete")}
              </Button>
            </li>
          );
        })}
      </ul>

      <AlertDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("brandVoice.confirmSampleDeleteTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("brandVoice.confirmSampleDeleteBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!pending) return;
                try {
                  await deleteSample.mutateAsync(pending);
                  toast.success(t("brandVoice.sampleDeletedToast"));
                  setPending(null);
                } catch (e) {
                  toast.error((e as Error).message);
                }
              }}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
