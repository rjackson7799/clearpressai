/**
 * Profile Page
 * User profile management page for PR Portal and Client Portal
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { ProfileHeader, ProfileForm, PreferencesSection } from '@/components/profile';

export function ProfilePage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{t('profile.title')}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {t('profile.viewProfile')}
        </p>
      </div>

      {/* Profile Header */}
      <ProfileHeader />

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Personal Information - spans 2 columns */}
        <div className="lg:col-span-2">
          <ProfileForm />
        </div>

        {/* Preferences - 1 column */}
        <div className="lg:col-span-1">
          <PreferencesSection />
        </div>
      </div>
    </div>
  );
}
