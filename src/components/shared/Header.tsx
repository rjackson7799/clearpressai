import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "./LanguageToggle";

export function Header() {
  const { t } = useTranslation();
  return (
    <header className="h-16 border-b px-4 flex items-center justify-between bg-background">
      <div className="flex items-center gap-2.5">
        <div
          aria-hidden="true"
          className="size-7 rounded-md bg-gradient-to-br from-blue-500 to-blue-700 text-white grid place-items-center text-sm font-bold shadow-sm"
        >
          C
        </div>
        <div className="font-semibold tracking-tight">ClearPress AI</div>
      </div>
      <div className="flex items-center gap-3">
        <LanguageToggle />
        <Button variant="ghost" onClick={() => supabase.auth.signOut()}>
          {t("common.logout")}
        </Button>
      </div>
    </header>
  );
}
