import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";

export function LanguageToggle() {
  const { i18n } = useTranslation();

  async function change(value: string) {
    await i18n.changeLanguage(value);
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await supabase.from("users").update({ language_pref: value }).eq("id", data.user.id);
    }
  }

  return (
    <Select value={i18n.language.startsWith("ja") ? "ja" : "en"} onValueChange={change}>
      <SelectTrigger className="w-28">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ja">日本語</SelectItem>
        <SelectItem value="en">English</SelectItem>
      </SelectContent>
    </Select>
  );
}
