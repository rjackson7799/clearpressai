import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BilingualLabel } from "@/components/shared/BilingualLabel";
import { AuthShell } from "@/components/shared/AuthShell";
import { explainAuthError } from "@/lib/auth-errors";

export default function ForgotPasswordPage() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${import.meta.env.VITE_APP_URL}/reset-password`,
    });
    setMsg(
      error
        ? explainAuthError(error.message, i18n.language)
        : `${t("auth.reset_password")} ✓`,
    );
  }

  return (
    <AuthShell
      title={<BilingualLabel ja="パスワード再設定" en="Reset password" />}
      subtitle={
        <BilingualLabel
          ja="再設定用リンクをメールでお送りします"
          en="We'll email you a link to reset your password"
        />
      }
      footer={
        <Link
          to="/login"
          className="text-muted-foreground hover:text-foreground underline underline-offset-4"
        >
          <BilingualLabel ja="ログインに戻る" en="Back to log in" />
        </Link>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">
            <BilingualLabel ja="メールアドレス" en="Email" />
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>
        {msg && <p className="text-sm">{msg}</p>}
        <Button type="submit" disabled={!email} className="w-full">
          {t("auth.reset_password")}
        </Button>
      </form>
    </AuthShell>
  );
}
