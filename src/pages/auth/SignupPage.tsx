/**
 * ClearPress AI - Signup Page
 * Creates new organization and PR Admin user
 */

import { useState } from 'react';
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
import { Loader2, Globe } from 'lucide-react';
import { toast } from 'sonner';

const signupSchema = z
  .object({
    name: z.string().min(1),
    email: z.string().email(),
    organizationName: z.string().min(1),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export function SignupPage() {
  const { t, language, setLanguage } = useLanguage();
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setError(null);

    const { error } = await signUp(
      data.email,
      data.password,
      data.name,
      data.organizationName
    );

    if (error) {
      setError(error.message || t('errors.server_error'));
      setIsLoading(false);
      return;
    }

    toast.success(t('auth.signUpSuccess'));
    navigate('/auth/login', { replace: true });
  };

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
          <CardTitle className="text-2xl">{t('auth.signUp')}</CardTitle>
          <CardDescription>{t('auth.signUpDescription')}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-error bg-error-light rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="organizationName">{t('auth.organizationName')}</Label>
              <Input
                id="organizationName"
                type="text"
                placeholder="Tokyo PR Agency"
                {...register('organizationName')}
                aria-invalid={!!errors.organizationName}
              />
              {errors.organizationName && (
                <p className="text-sm text-error">{t('errors.required')}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">{t('auth.name')}</Label>
              <Input
                id="name"
                type="text"
                placeholder="Taro Yamada"
                {...register('name')}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-sm text-error">{t('errors.required')}</p>
              )}
            </div>
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
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('auth.createAccount')}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              {t('auth.alreadyHaveAccount')}{' '}
              <Link to="/auth/login" className="text-primary hover:underline">
                {t('auth.login')}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default SignupPage;
