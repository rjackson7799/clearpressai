import { useTranslation } from "react-i18next";

type Props = { ja: string; en: string; className?: string };

export function BilingualLabel({ ja, en, className }: Props) {
  const { i18n } = useTranslation();
  const isJaPrimary = i18n.language.startsWith("ja");
  const primary = isJaPrimary ? ja : en;
  const secondary = isJaPrimary ? en : ja;

  return (
    <span className={className}>
      <span className="text-foreground">{primary}</span>
      <span className="text-muted-foreground ml-2 text-sm">{secondary}</span>
    </span>
  );
}
