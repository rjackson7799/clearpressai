import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import i18n from "@/locales/i18n";
import { pickLang } from "@/lib/bilingual";
import { consumeIntentionalSignOut } from "@/lib/auth-events";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // Track whether a session was ever established so we can distinguish an
  // expiry (SIGNED_OUT after a real session) from the initial no-session load.
  const hadSession = useRef(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) hadSession.current = true;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (s) {
        hadSession.current = true;
      } else if (
        event === "SIGNED_OUT" &&
        hadSession.current &&
        !consumeIntentionalSignOut()
      ) {
        // Involuntary sign-out (expired/failed refresh) — tell the user why
        // before ProtectedRoute bounces them to /login.
        toast.error(
          pickLang(
            i18n.language,
            "セッションの有効期限が切れました。再度サインインしてください。",
            "Your session expired. Please sign in again.",
          ),
        );
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, loading };
}
