/**
 * ClearPress AI - Auth Context
 * Manages authentication state and user profile
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import type { Database } from '@/types/database';

type UserProfile = Database['public']['Tables']['users']['Row'] & {
  organization?: Database['public']['Tables']['organizations']['Row'] | null;
};

type UserRole = Database['public']['Enums']['user_role'];

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isPRAdmin: boolean;
  isPRStaff: boolean;
  isClientUser: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string,
    name: string,
    organizationName: string
  ) => Promise<{ error: AuthError | Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data as UserProfile;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;
    const profileData = await fetchProfile(user.id);
    setProfile(profileData);
  }, [user?.id, fetchProfile]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const profileData = await fetchProfile(session.user.id);
          setProfile(profileData);
        }
      } catch (error) {
        console.error('Error during auth initialization:', error);
      } finally {
        setIsLoading(false);
      }
    }).catch((error) => {
      console.error('Error getting session:', error);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const profileData = await fetchProfile(session.user.id);
          setProfile(profileData);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('Error during auth state change:', error);
      } finally {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    organizationName: string
  ) => {
    // 1. Create the auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return { error: authError };
    }

    if (!authData.user) {
      return { error: new Error('User creation failed') };
    }

    // 2. Call the database function to create org and profile (bypasses RLS)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: rpcError } = await (supabase.rpc as any)('create_user_and_organization', {
      user_id: authData.user.id,
      user_email: email,
      user_name: name,
      org_name: organizationName,
    });

    if (rpcError) {
      console.error('Error in signup:', rpcError);
      return { error: rpcError };
    }

    // Check if the function returned an error
    if (data && typeof data === 'object' && 'success' in data && !data.success) {
      return { error: new Error((data as { error?: string }).error || 'Signup failed') };
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const requestPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  };

  const role = profile?.role ?? null;
  const isAuthenticated = !!session && !!profile;
  const isPRAdmin = role === 'pr_admin';
  const isPRStaff = role === 'pr_staff';
  const isClientUser = role === 'client_user';

  const value: AuthContextType = {
    session,
    user,
    profile,
    role,
    isLoading,
    isAuthenticated,
    isPRAdmin,
    isPRStaff,
    isClientUser,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    requestPasswordReset,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
