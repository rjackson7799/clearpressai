import { useTranslation } from "react-i18next";

export default function SettingsPage() {
  const { t } = useTranslation();
  return <div className="p-8">{t("settings.title")}</div>;
}
