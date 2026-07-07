import { useTranslation } from "react-i18next";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { BilingualLabel } from "@/components/shared/BilingualLabel";

export default function SettingsPage() {
  const { t } = useTranslation();
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading)
    return (
      <div className="max-w-2xl space-y-6">
        <div className="text-muted-foreground">{t("common.loading")}</div>
      </div>
    );

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl">
        <BilingualLabel ja="設定" en="Settings" />
      </h1>
      <section className="space-y-2">
        <h2 className="text-lg">
          <BilingualLabel ja="言語" en="Language" />
        </h2>
        <LanguageToggle />
      </section>
      {user && (
        <section className="space-y-1 text-sm">
          <div>
            {user.full_name} ({user.email})
          </div>
          <div className="text-muted-foreground">{user.role}</div>
        </section>
      )}
    </div>
  );
}
