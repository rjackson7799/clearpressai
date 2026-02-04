/**
 * ClearPress AI - Accept Invite Page
 * Handle magic link invitation for new team members
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/services/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, Globe, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Database } from '@/types/database';

type UserRole = Database['public']['Enums']['user_role'];

const setPasswordSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
  });

type SetPasswordFormData = z.infer<typeof setPasswordSchema>;

interface InviteData {
  name: string;
  role: UserRole;
  organization_id: string;
  email: string;
  client_id?: string; // For client_user role auto-assignment
}

type PageState = 'loading' | 'setPassword' | 'creating' | 'success' | 'error';

export function AcceptInvitePage() {
  const { t, language, setLanguage } = useLanguage();
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<InviteData | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetPasswordFormData>({
    resolver: zodResolver(setPasswordSchema),
  });

  // Process the invite token from URL hash
  useEffect(() => {
    // Check if there's an invite token in the URL
    const hash = window.location.hash;
    if (!hash.includes('access_token')) {
      setPageState('error');
      setError(t('auth.inviteInvalid'));
      return;
    }

    // Listen for Supabase to process the hash and establish session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Get user metadata from the invite
          const metadata = session.user.user_metadata;

          // Validate we have the required metadata from the invite
          if (!metadata.organization_id || !metadata.role) {
            setPageState('error');
            setError(t('auth.inviteInvalid'));
            return;
          }

          setInviteData({
            name: metadata.name || '',
            role: metadata.role as UserRole,
            organization_id: metadata.organization_id,
            email: session.user.email || '',
            client_id: metadata.client_id || undefined,
          });
          setPageState('setPassword');
        } else if (event === 'TOKEN_REFRESHED') {
          // Session refresh, ignore
        } else if (event === 'SIGNED_OUT') {
          // User was signed out, show error
          setPageState('error');
          setError(t('auth.inviteExpired'));
        }
      }
    );

    // Give Supabase time to process the hash
    const timeout = setTimeout(() => {
      if (pageState === 'loading') {
        setPageState('error');
        setError(t('auth.inviteInvalid'));
      }
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [t, pageState]);

  const onSubmit = async (data: SetPasswordFormData) => {
    if (!inviteData) return;

    setPageState('creating');
    setError(null);

    try {
      // 1. Update the user's password
      const { error: passwordError } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (passwordError) {
        throw new Error(passwordError.message);
      }

      // 2. Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(userError?.message || 'Failed to get user');
      }

      // 3. Create user profile in the users table
      const { error: profileError } = await supabase.from('users').insert({
        id: user.id,
        email: inviteData.email,
        name: inviteData.name || inviteData.email.split('@')[0] || 'User',
        role: inviteData.role,
        organization_id: inviteData.organization_id,
        is_active: true,
        preferences: { language: 'ja' },
      });

      if (profileError) {
        // Check if profile already exists (user might have accepted invite before)
        if (profileError.code === '23505') { // Unique violation
          setPageState('error');
          setError(t('auth.inviteAlreadyAccepted'));
          return;
        }
        throw new Error(profileError.message);
      }

      // 4. If client_user with client_id, assign to client
      if (inviteData.role === 'client_user' && inviteData.client_id) {
        const { error: assignError } = await supabase.from('client_users').insert({
          client_id: inviteData.client_id,
          user_id: user.id,
        });

        if (assignError && assignError.code !== '23505') {
          // Log error but don't block account creation
          console.error('Error assigning user to client:', assignError);
        }
      }

      // 5. Refresh the auth context profile
      await refreshProfile();

      setPageState('success');
      toast.success(t('auth.inviteAccepted'));

      // 6. Redirect to appropriate portal
      setTimeout(() => {
        if (inviteData.role === 'client_user') {
          navigate('/client');
        } else {
          navigate('/pr');
        }
      }, 1500);
    } catch (err) {
      setPageState('setPassword');
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  // Loading state
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-subtle p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">{t('auth.processingInvite')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Creating account state
  if (pageState === 'creating') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-subtle p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">{t('auth.settingUpAccount')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (pageState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-subtle p-4 relative">
        <div className="absolute top-4 right-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(language === 'ja' ? 'en' : 'ja')}
            className="gap-2"
          >
            <Globe className="h-4 w-4" />
            {language === 'ja' ? 'EN' : 'JA'}
          </Button>
        </div>

        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error-light">
              <AlertCircle className="h-6 w-6 text-error" />
            </div>
            <CardTitle className="text-2xl">
              {error === t('auth.inviteAlreadyAccepted')
                ? t('auth.inviteAlreadyAccepted')
                : t('auth.inviteInvalid')}
            </CardTitle>
            <CardDescription className="mt-2">
              {error || t('auth.inviteExpired')}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => navigate('/auth/login')}>
              {t('auth.backToLogin')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (pageState === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-subtle p-4 relative">
        <div className="absolute top-4 right-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(language === 'ja' ? 'en' : 'ja')}
            className="gap-2"
          >
            <Globe className="h-4 w-4" />
            {language === 'ja' ? 'EN' : 'JA'}
          </Button>
        </div>

        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-light">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <CardTitle className="text-2xl">{t('auth.inviteAccepted')}</CardTitle>
            <CardDescription className="mt-2">
              {t('auth.welcomeToTeam')}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Set password form state
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-subtle p-4 relative">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLanguage(language === 'ja' ? 'en' : 'ja')}
          className="gap-2"
        >
          <Globe className="h-4 w-4" />
          {language === 'ja' ? 'EN' : 'JA'}
        </Button>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t('auth.welcomeToTeam')}</CardTitle>
          <CardDescription>{t('auth.acceptInviteDescription')}</CardDescription>
          {inviteData?.email && (
            <p className="mt-2 text-sm text-muted-foreground">
              {inviteData.email}
            </p>
          )}
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-error bg-error-light rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                aria-invalid={!!errors.password}
              />
              {errors.password && (
                <p className="text-sm text-error">
                  {t('errors.min_length').replace('{min}', '8')}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword')}
                aria-invalid={!!errors.confirmPassword}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-error">{t('auth.passwordMismatch')}</p>
              )}
            </div>
          </CardContent>
          <CardContent className="pt-0">
            <Button type="submit" className="w-full">
              {t('auth.setPassword')}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}

export default AcceptInvitePage;
