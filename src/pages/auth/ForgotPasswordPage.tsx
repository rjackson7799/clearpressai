/**
 * ClearPress AI - Forgot Password Page
 * Request password reset via email
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
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
import { Loader2, Globe, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const { t, language, setLanguage } = useLanguage();
  const { requestPasswordReset } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    const { error } = await requestPasswordReset(data.email);

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    setSubmittedEmail(data.email);
    setIsSuccess(true);
    setIsLoading(false);
  };

  // Success state - show confirmation message
  if (isSuccess) {
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
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-light">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <CardTitle className="text-2xl">{t('auth.checkYourEmail')}</CardTitle>
            <CardDescription className="mt-2">
              {t('auth.checkYourEmailDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex items-center justify-center gap-2 rounded-lg bg-muted p-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{submittedEmail}</span>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Link to="/auth/login" className="w-full">
              <Button variant="outline" className="w-full gap-2">
                <ArrowLeft className="h-4 w-4" />
                {t('auth.backToLogin')}
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Form state
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
          <CardTitle className="text-2xl">{t('auth.forgotPasswordTitle')}</CardTitle>
          <CardDescription>{t('auth.forgotPasswordDescription')}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-error bg-error-light rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                {...register('email')}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-sm text-error">{t('errors.invalid_email')}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('auth.sendResetLink')}
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

export default ForgotPasswordPage;
