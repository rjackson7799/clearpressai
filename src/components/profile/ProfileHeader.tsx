/**
 * Profile Header Component
 * Displays user avatar, name, role, and organization
 */

import { useMemo } from 'react';
import { User, Building2, CheckCircle2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export function ProfileHeader() {
  const { t } = useLanguage();
  const { profile } = useAuth();

  const userInitials = useMemo(() => {
    if (!profile?.name) return 'U';
    return profile.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [profile?.name]);

  const roleKey = profile?.role as 'pr_admin' | 'pr_staff' | 'client_user';

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-gray-100 p-6 lg:p-8">
      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="profile-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#profile-grid)" />
        </svg>
      </div>

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
        {/* Avatar */}
        <Avatar className="h-20 w-20 border-4 border-white shadow-md">
          {profile?.avatar_url && (
            <AvatarImage src={profile.avatar_url} alt={profile.name} />
          )}
          <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
            {userInitials}
          </AvatarFallback>
        </Avatar>

        {/* User Info */}
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {profile?.name}
            </h1>
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

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <User className="h-4 w-4 text-gray-400" />
              <span>{profile?.email}</span>
            </div>
            {profile?.organization && (
              <div className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-gray-400" />
                <span>{profile.organization.name}</span>
              </div>
            )}
          </div>

          {profile?.is_active && (
            <div className="flex items-center gap-1.5 text-sm text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
              <span>{t('profile.active')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
