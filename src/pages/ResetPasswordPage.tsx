import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BilingualLabel } from "@/components/shared/BilingualLabel";
import { AuthShell } from "@/components/shared/AuthShell";

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setError(error.message);
    else navigate("/");
  }

  return (
    <AuthShell
      title={<BilingualLabel ja="新しいパスワード" en="New password" />}
      subtitle={
        <BilingualLabel
          ja="12文字以上のパスワードを設定してください"
          en="Set a new password (12 characters or more)"
        />
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">
            <BilingualLabel ja="パスワード" en="Password" />
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={12}
            required
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full">
          {t("common.save")}
        </Button>
      </form>
    </AuthShell>
  );
}
