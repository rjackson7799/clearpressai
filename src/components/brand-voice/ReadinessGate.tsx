import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useBrandVoiceSamples } from "@/hooks/useBrandVoiceSamples";
import { useBrandVoiceProfile } from "@/hooks/useBrandVoiceProfile";
import {
  useExtractVoice,
  type ExtractVoiceError,
} from "@/hooks/useExtractVoice";
import { MIN_USABLE_CHARS } from "@/lib/utils/file-extraction";

const MIN_SAMPLES = 5;

function formatRelative(iso: string, locale: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.round(ms / 60_000);
  const rtf = new Intl.RelativeTimeFormat(locale === "ja" ? "ja" : "en", {
    numeric: "auto",
  });
  if (mins < 1) return rtf.format(0, "minute");
  if (mins < 60) return rtf.format(-mins, "minute");
  const hours = Math.round(mins / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  const days = Math.round(hours / 24);
  return rtf.format(-days, "day");
}

interface Props {
  clientId: string;
}

export function ReadinessGate({ clientId }: Props) {
  const { t, i18n } = useTranslation();
  const { data: samples = [] } = useBrandVoiceSamples(clientId);
  const { data: profile } = useBrandVoiceProfile(clientId);
  const extract = useExtractVoice(clientId);
  const [confirmReExtract, setConfirmReExtract] = useState(false);

  const usableSamples = samples.filter(
    (s) => (s.content_text?.length ?? 0) >= MIN_USABLE_CHARS,
  );
  const usableCount = usableSamples.length;
  const hasFiltered = samples.length > usableCount;
  const ready = usableCount >= MIN_SAMPLES;

  const runExtract = async () => {
    try {
      await extract.mutateAsync(usableSamples);
      toast.success(t("brandVoice.extractedToast"));
    } catch (e) {
      const err = e as ExtractVoiceError;
      toast.error(
        t(`brandVoice.extractErrors.${err.code}`, {
          defaultValue: err.message,
        }),
      );
    }
  };

  const onExtractClick = () => {
    if (profile?.user_edited) {
      setConfirmReExtract(true);
      return;
    }
    runExtract();
  };

  return (
    <div className="space-y-3">
      <div
        className={
          "flex flex-col gap-2 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between " +
          (ready
            ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200"
            : "bg-muted")
        }
      >
        <div className="text-sm">
          <div className="font-medium">
            {ready
              ? `${t("brandVoice.readinessOk")} (${usableCount}/${MIN_SAMPLES}+)`
              : t("brandVoice.readinessShort", {
                  count: MIN_SAMPLES - usableCount,
                })}
          </div>
          {hasFiltered && (
            <div className="text-xs text-muted-foreground">
              {t("brandVoice.readinessFilteredHint")}
            </div>
          )}
          {profile?.last_extracted_at && (
            <div className="mt-1 text-xs text-muted-foreground">
              {t("brandVoice.lastExtractedAt", {
                when: formatRelative(profile.last_extracted_at, i18n.language),
              })}
            </div>
          )}
        </div>
        <Button
          disabled={!ready || extract.isPending}
          onClick={onExtractClick}
        >
          {extract.isPending ? (
            <>
              <Loader2Icon className="mr-2 size-4 animate-spin" />
              {t("brandVoice.extracting")}
            </>
          ) : (
            t("brandVoice.extractButton")
          )}
        </Button>
      </div>

      <AlertDialog
        open={confirmReExtract}
        onOpenChange={setConfirmReExtract}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("brandVoice.reExtractWarningTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("brandVoice.reExtractWarningBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmReExtract(false);
                runExtract();
              }}
            >
              {t("brandVoice.extractButton")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
