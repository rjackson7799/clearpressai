/**
 * ClearPress AI - Reset Password Page
 * Set new password after clicking reset link
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, Globe, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const resetPasswordSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

type PageState = 'loading' | 'ready' | 'success' | 'error';

export function ResetPasswordPage() {
  const { t, language, setLanguage } = useLanguage();
  const { updatePassword, session } = useAuth();
  const navigate = useNavigate();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Check if user has a valid recovery session from URL hash
  useEffect(() => {
    // Supabase processes the hash automatically and sets a session
    // We need to wait a moment for this to happen
    const checkSession = () => {
      // Check if there's a recovery hash in the URL
      const hash = window.location.hash;
      const hasRecoveryToken = hash.includes('type=recovery') || hash.includes('type=magiclink');

      if (hasRecoveryToken || session) {
        // Give Supabase time to process the hash
        setTimeout(() => {
          setPageState('ready');
        }, 500);
      } else {
        // No valid token found
        setPageState('error');
        setError(t('auth.tokenInvalid'));
      }
    };

    checkSession();
  }, [session, t]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsSubmitting(true);
    setError(null);

    const { error } = await updatePassword(data.password);

    if (error) {
      if (error.message.includes('expired') || error.message.includes('invalid')) {
        setError(t('auth.tokenExpired'));
      } else {
        setError(error.message);
      }
      setIsSubmitting(false);
      return;
    }

    setPageState('success');
    toast.success(t('auth.passwordResetSuccess'));

    // Redirect to login after a short delay
    setTimeout(() => {
      navigate('/auth/login');
    }, 2000);
  };

  // Loading state
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-subtle p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">{t('common.loading')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state (invalid/expired token)
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
            <CardTitle className="text-2xl">{t('auth.tokenInvalid')}</CardTitle>
            <CardDescription className="mt-2">
              {error || t('auth.tokenExpired')}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-4">
            <Link to="/auth/forgot-password" className="w-full">
              <Button className="w-full">
                {t('auth.sendResetLink')}
              </Button>
            </Link>
            <Link
              to="/auth/login"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 justify-center"
            >
              <ArrowLeft className="h-3 w-3" />
              {t('auth.backToLogin')}
            </Link>
          </CardFooter>
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
            <CardTitle className="text-2xl">{t('auth.passwordResetSuccess')}</CardTitle>
            <CardDescription className="mt-2">
              {t('auth.backToLogin')}...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Ready state - show password form
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
          <CardTitle className="text-2xl">{t('auth.resetPasswordTitle')}</CardTitle>
          <CardDescription>{t('auth.resetPasswordDescription')}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-error bg-error-light rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.newPassword')}</Label>
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
              <Label htmlFor="confirmPassword">{t('auth.confirmNewPassword')}</Label>
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
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('auth.resetPassword')}
            </Button>
            <Link
              to="/auth/login"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" />
              {t('auth.backToLogin')}
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default ResetPasswordPage;
