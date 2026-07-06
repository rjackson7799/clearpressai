/**
 * Resolve a bilingual pair to the active-language string. The imperative
 * companion to <BilingualLabel> (which does the same for JSX) — use it for
 * toasts and other places that need a plain string, not a React node.
 *
 *   const { i18n } = useTranslation();
 *   toast.success(pickLang(i18n.language, '保存しました', 'Saved'));
 */
export function pickLang(language: string, ja: string, en: string): string {
  return language.startsWith("ja") ? ja : en;
}
