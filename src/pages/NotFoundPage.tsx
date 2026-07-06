import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8 text-center">
      <div className="space-y-1">
        <p className="text-5xl font-semibold text-muted-foreground">404</p>
        <h1 className="text-lg font-medium">{t("notFound.title")}</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {t("notFound.body")}
        </p>
      </div>
      <Button asChild>
        <Link to="/">{t("notFound.home")}</Link>
      </Button>
    </div>
  );
}
