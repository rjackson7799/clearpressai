import { useTranslation } from "react-i18next";

type Props = { ja: string; en: string; className?: string };

export function BilingualLabel({ ja, en, className }: Props) {
  const { i18n } = useTranslation();
  const label = i18n.language.startsWith("ja") ? ja : en;
  return <span className={className}>{label}</span>;
}
