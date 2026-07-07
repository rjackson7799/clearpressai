import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BilingualLabel } from "@/components/shared/BilingualLabel";
import { AuthShell } from "@/components/shared/AuthShell";
import { explainAuthError } from "@/lib/auth-errors";

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Return the user to the page they were bounced from (ProtectedRoute sets
  // location.state.from), defaulting to the dashboard.
  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname ?? "/";

  async function signInWithPassword(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setPending(false);
    if (error) setError(explainAuthError(error.message, i18n.language));
    else navigate(from, { replace: true });
  }

  async function sendMagicLink() {
    setPending(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${import.meta.env.VITE_APP_URL}/` },
    });
    setPending(false);
    if (error) setError(explainAuthError(error.message, i18n.language));
    else setError(`${t("auth.magic_link")} ✓`);
  }

  return (
    <AuthShell
      title={<BilingualLabel ja="ログイン" en="Log in" />}
      subtitle={
        <BilingualLabel
          ja="メールアドレスとパスワードでサインイン"
          en="Sign in with your email and password"
        />
      }
      footer={
        <Link
          to="/forgot-password"
          className="text-muted-foreground hover:text-foreground underline underline-offset-4"
        >
          {t("auth.forgot_password")}
        </Link>
      }
    >
      <form onSubmit={signInWithPassword} className="space-y-4">
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
        <div className="space-y-2">
          <Label htmlFor="password">
            <BilingualLabel ja="パスワード" en="Password" />
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            minLength={12}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-col gap-2 pt-1">
          <Button
            type="submit"
            disabled={pending || !email || !password}
            className="w-full"
          >
            {t("auth.login")}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending || !email}
            onClick={sendMagicLink}
            className="w-full"
          >
            {t("auth.magic_link")}
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}
