import { Loader2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";

/** Centered branded spinner for full-page loading (auth gate, route suspense). */
export function FullPageLoader() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2Icon
        className="size-6 animate-spin text-muted-foreground"
        aria-label={t("common.loading")}
      />
    </div>
  );
}
