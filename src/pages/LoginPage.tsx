import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BilingualLabel } from "@/components/shared/BilingualLabel";

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function signInWithPassword(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setPending(false);
    if (error) setError(error.message);
    else navigate("/");
  }

  async function sendMagicLink() {
    setPending(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${import.meta.env.VITE_APP_URL}/` },
    });
    setPending(false);
    if (error) setError(error.message);
    else setError(`${t("auth.magic_link")} ✓`);
  }

  return (
    <div className="min-h-screen grid place-items-center p-8">
      <form onSubmit={signInWithPassword} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl">
          <BilingualLabel ja="ログイン" en="Log in" />
        </h1>
        <div className="space-y-2">
          <Label htmlFor="email">
            <BilingualLabel ja="メールアドレス" en="Email" />
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            minLength={12}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={pending || !email || !password}>
            {t("auth.login")}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending || !email}
            onClick={sendMagicLink}
          >
            {t("auth.magic_link")}
          </Button>
        </div>
        <Link to="/forgot-password" className="text-sm underline">
          {t("auth.forgot_password")}
        </Link>
      </form>
    </div>
  );
}
