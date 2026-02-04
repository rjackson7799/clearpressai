/**
 * Profile Form Component
 * Editable form for user profile information
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, User, Mail, Building2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserProfile } from '@/services/profile';
import { cn } from '@/lib/utils';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const { t, language } = useLanguage();
  const { profile, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    if (!profile?.id) return;

    setIsLoading(true);
    try {
      await updateUserProfile(profile.id, data);
      await refreshProfile();
      toast.success(t('profile.updateSuccess'));
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(t('profile.updateError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    reset({ name: profile?.name || '' });
    setIsEditing(false);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(language === 'ja' ? 'ja-JP' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const roleKey = profile?.role as 'pr_admin' | 'pr_staff' | 'client_user';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            {t('profile.personalInfo')}
          </CardTitle>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              {t('common.edit')}
            </Button>
          )}
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-5">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-5">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                {t('profile.name')}
              </Label>
              {isEditing ? (
                <>
                  <Input
                    id="name"
                    type="text"
                    {...register('name')}
                    aria-invalid={!!errors.name}
                    className={cn(errors.name && 'border-red-500')}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{t('errors.required')}</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-900 py-2">{profile?.name}</p>
              )}
            </div>

            {/* Email Field (read-only) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-gray-400" />
                {t('profile.email')}
              </Label>
              <p className="text-sm text-gray-900 py-2">{profile?.email}</p>
            </div>

            {/* Role Field (read-only) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                {t('profile.role')}
              </Label>
              <div className="py-2">
                <Badge
                  variant="secondary"
                  className={cn(
                    'font-medium',
                    roleKey === 'pr_admin' && 'bg-violet-100 text-violet-700',
                    roleKey === 'pr_staff' && 'bg-blue-100 text-blue-700',
                    roleKey === 'client_user' && 'bg-emerald-100 text-emerald-700'
                  )}
                >
                  {t(`roles.${roleKey}`)}
                </Badge>
              </div>
            </div>

            {/* Organization Field (read-only) */}
            {profile?.organization && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-gray-400" />
                  {t('profile.organization')}
                </Label>
                <p className="text-sm text-gray-900 py-2">
                  {profile.organization.name}
                </p>
              </div>
            )}

            {/* Account Created (read-only) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                {t('profile.createdAt')}
              </Label>
              <p className="text-sm text-gray-900 py-2">
                {formatDate(profile?.created_at || null)}
              </p>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('common.save')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  {t('common.cancel')}
                </Button>
              </div>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
