import { useTranslation } from "react-i18next";
import { AlertTriangleIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Presentational fallback for AppErrorBoundary. Kept as a function component
 * (not inline in the class boundary) so it can use hooks for localization.
 * `minimal` is used on the public feedback route so a crash there does not
 * expose internal app chrome.
 */
export function ErrorFallback({
  variant = "app",
}: {
  variant?: "app" | "minimal";
}) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8 text-center">
      <div className="rounded-full bg-destructive/10 p-3">
        <AlertTriangleIcon className="size-7 text-destructive" aria-hidden />
      </div>
      <div className="space-y-1">
        <h1 className="text-lg font-medium">{t("errors.boundaryTitle")}</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {variant === "minimal"
            ? t("errors.boundaryBodyMinimal")
            : t("errors.boundaryBody")}
        </p>
      </div>
      <Button onClick={() => window.location.reload()}>
        <RefreshCwIcon className="size-4" aria-hidden />
        {t("errors.reload")}
      </Button>
    </div>
  );
}
