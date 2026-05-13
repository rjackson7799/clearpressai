import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const { data, error } = await supabase
        .from("users")
        .select("id, email, full_name, full_name_kana, role, language_pref")
        .eq("id", auth.user.id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}
