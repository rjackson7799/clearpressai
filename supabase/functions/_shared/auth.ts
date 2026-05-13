import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export const requireAuthorization = (req: Request): string => {
  const auth = req.headers.get('Authorization');
  if (!auth) {
    throw new AuthError('Missing Authorization header');
  }
  return auth;
};

export const createSupabaseFromRequest = (req: Request): SupabaseClient => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  }
  const authHeader = requireAuthorization(req);
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
};

export const getUserIdFromAuth = async (
  supabase: SupabaseClient,
): Promise<string> => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user?.id) {
    throw new AuthError(
      `Could not resolve auth user: ${error?.message ?? 'no user'}`,
    );
  }
  return data.user.id;
};
