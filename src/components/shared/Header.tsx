import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "./LanguageToggle";

export function Header() {
  const { t } = useTranslation();
  return (
    <header className="h-14 border-b px-4 flex items-center justify-between">
      <div className="font-medium">ClearPress AI</div>
      <div className="flex items-center gap-3">
        <LanguageToggle />
        <Button variant="ghost" onClick={() => supabase.auth.signOut()}>
          {t("common.logout")}
        </Button>
      </div>
    </header>
  );
}
