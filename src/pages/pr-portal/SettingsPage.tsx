/**
 * PR Portal Settings Page
 * Tabbed interface for all settings
 */

import { Settings, Building2, Bell, Shield, Plug } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  OrganizationSettings,
  NotificationSettings,
  SecuritySettings,
  IntegrationSettings,
} from '@/components/settings';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

export function SettingsPage() {
  const { t, language } = useLanguage();
  const { role } = useAuth();
  const isAdmin = role === 'pr_admin';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Settings className="h-6 w-6 text-gray-400" />
          <h1 className="text-2xl font-bold text-gray-900">
            {t('settings.title')}
          </h1>
        </div>
        <p className="text-gray-500">
          {language === 'ja'
            ? 'アカウントと組織の設定を管理します'
            : 'Manage your account and organization settings'}
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={isAdmin ? 'organization' : 'notifications'} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          {isAdmin && (
            <TabsTrigger value="organization" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.organization')}</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">{t('settings.notifications')}</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">{t('settings.security')}</span>
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Plug className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.integrations')}</span>
            </TabsTrigger>
          )}
        </TabsList>

        {isAdmin && (
          <TabsContent value="organization">
            <OrganizationSettings />
          </TabsContent>
        )}

        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="security">
          <SecuritySettings />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="integrations">
            <IntegrationSettings />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

export default SettingsPage;
