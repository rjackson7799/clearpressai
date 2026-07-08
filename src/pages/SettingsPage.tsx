import { useTranslation } from "react-i18next";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { BilingualLabel } from "@/components/shared/BilingualLabel";
import { PageShell } from "@/components/shared/PageShell";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SettingsPage() {
  const { t } = useTranslation();
  const { data: user, isLoading } = useCurrentUser();

  const header = (
    <PageHeader
      title={<BilingualLabel ja="設定" en="Settings" />}
      subtitle={
        <BilingualLabel
          ja="アカウントと表示に関する設定を管理します。"
          en="Manage your account and display preferences."
        />
      }
    />
  );

  if (isLoading)
    return (
      <PageShell className="max-w-2xl">
        {header}
        <div className="text-muted-foreground">{t("common.loading")}</div>
      </PageShell>
    );

  return (
    <PageShell className="max-w-2xl">
      {header}
      <Card>
        <CardHeader>
          <CardTitle>
            <BilingualLabel ja="言語" en="Language" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LanguageToggle />
        </CardContent>
      </Card>
      {user && (
        <Card>
          <CardHeader>
            <CardTitle>
              <BilingualLabel ja="アカウント" en="Account" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div>
              {user.full_name} ({user.email})
            </div>
            <div className="text-muted-foreground">{user.role}</div>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
