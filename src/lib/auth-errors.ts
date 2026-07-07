/**
 * Map raw Supabase auth error messages to localized, user-safe copy. Supabase
 * returns English technical strings ("Invalid login credentials"); showing
 * those verbatim is both untranslated and leaky. Falls back to a generic
 * localized message for anything unrecognized.
 */
export function explainAuthError(
  message: string | undefined,
  language: string,
): string {
  const ja = language.startsWith("ja");
  const m = (message ?? "").toLowerCase();

  if (m.includes("invalid login credentials")) {
    return ja
      ? "メールアドレスまたはパスワードが正しくありません"
      : "Incorrect email or password.";
  }
  if (m.includes("email not confirmed")) {
    return ja
      ? "メールアドレスの確認が完了していません"
      : "Your email address has not been confirmed.";
  }
  if (
    m.includes("for security purposes") ||
    m.includes("rate limit") ||
    m.includes("too many")
  ) {
    return ja
      ? "リクエストが多すぎます。しばらくしてから再度お試しください"
      : "Too many attempts. Please try again in a moment.";
  }
  if (m.includes("expired") || (m.includes("invalid") && m.includes("link"))) {
    return ja
      ? "リンクの有効期限が切れているか無効です。もう一度お試しください"
      : "This link is invalid or has expired. Please try again.";
  }
  if (
    m.includes("password") &&
    (m.includes("at least") ||
      m.includes("should be") ||
      m.includes("characters"))
  ) {
    return ja
      ? "パスワードは12文字以上で入力してください"
      : "Password must be at least 12 characters.";
  }

  return ja
    ? "問題が発生しました。もう一度お試しください"
    : "Something went wrong. Please try again.";
}
