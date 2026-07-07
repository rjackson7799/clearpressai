import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Ordered most-specific-first; first match wins. Keeps the browser tab and
// the <html lang> attribute in sync with the route + active language, which
// index.html cannot do (it hardcodes a single title + lang="ja").
const ROUTES: { test: RegExp; ja: string; en: string }[] = [
  { test: /^\/login/, ja: "ログイン", en: "Log in" },
  { test: /^\/forgot-password/, ja: "パスワード再設定", en: "Reset password" },
  { test: /^\/reset-password/, ja: "新しいパスワード", en: "New password" },
  { test: /^\/f\//, ja: "フィードバック", en: "Feedback" },
  { test: /^\/clients\/new/, ja: "新規クライアント", en: "New client" },
  { test: /^\/clients\/[^/]+/, ja: "クライアント詳細", en: "Client" },
  { test: /^\/clients/, ja: "クライアント", en: "Clients" },
  { test: /^\/projects\/new/, ja: "新規プロジェクト", en: "New project" },
  { test: /^\/projects\/[^/]+\/review/, ja: "レビュー", en: "Review" },
  { test: /^\/projects\/[^/]+\/audit/, ja: "監査レポート", en: "Audit report" },
  { test: /^\/projects\/[^/]+\/deliveries/, ja: "配信履歴", en: "Deliveries" },
  { test: /^\/projects\/[^/]+\/deliver/, ja: "配信作成", en: "Compose delivery" },
  { test: /^\/projects/, ja: "プロジェクト", en: "Projects" },
  { test: /^\/settings/, ja: "設定", en: "Settings" },
  { test: /^\/help/, ja: "ヘルプ", en: "Help" },
  { test: /^\/$/, ja: "ダッシュボード", en: "Dashboard" },
];

export function DocumentHead() {
  const location = useLocation();
  const { i18n } = useTranslation();
  const ja = i18n.language.startsWith("ja");

  useEffect(() => {
    document.documentElement.lang = ja ? "ja" : "en";
  }, [ja]);

  useEffect(() => {
    const match = ROUTES.find((r) => r.test.test(location.pathname));
    const section = match ? (ja ? match.ja : match.en) : null;
    document.title = section ? `${section} — ClearPress AI` : "ClearPress AI";
  }, [location.pathname, ja]);

  return null;
}
