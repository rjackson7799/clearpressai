/**
 * Client Portal Settings Page
 * Settings for client users - profile and notifications
 */

import { Settings, Bell, User } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPreferences, useUpdateUserPreferences, useUpdateNotificationPreferences } from '@/hooks/use-settings';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export function ClientSettingsPage() {
  const { t, language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const { data: preferences, isLoading } = useUserPreferences(user?.id);
  const updatePreferences = useUpdateUserPreferences();
  const updateNotifications = useUpdateNotificationPreferences();

  // Local state for form
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [notifications, setNotifications] = useState({
    email_project_updates: true,
    email_content_ready: true,
    email_deadline_reminders: true,
    in_app_enabled: true,
  });

  // Sync preferences to local state when loaded
  useEffect(() => {
    if (preferences) {
      setTheme(preferences.theme || 'system');
      setNotifications({
        email_project_updates: preferences.notifications?.email_project_updates ?? true,
        email_content_ready: preferences.notifications?.email_content_ready ?? true,
        email_deadline_reminders: preferences.notifications?.email_deadline_reminders ?? true,
        in_app_enabled: preferences.notifications?.in_app_enabled ?? true,
      });
    }
  }, [preferences]);

  const handleLanguageChange = (value: 'ja' | 'en') => {
    setLanguage(value);
    if (user?.id) {
      updatePreferences.mutate({
        userId: user.id,
        preferences: { language: value },
      });
    }
  };

  const handleThemeChange = (value: 'light' | 'dark' | 'system') => {
    setTheme(value);
    if (user?.id) {
      updatePreferences.mutate({
        userId: user.id,
        preferences: { theme: value },
      });
    }
  };

  const handleNotificationChange = (key: keyof typeof notifications, value: boolean) => {
    const updated = { ...notifications, [key]: value };
    setNotifications(updated);
    if (user?.id) {
      updateNotifications.mutate({
        userId: user.id,
        notifications: updated,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
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
            ? '通知とアカウントの設定を管理します'
            : 'Manage your notification and account settings'}
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="preferences" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>{language === 'ja' ? '設定' : 'Preferences'}</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>{t('settings.notifications')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ja' ? '表示設定' : 'Display Settings'}</CardTitle>
              <CardDescription>
                {language === 'ja'
                  ? '言語とテーマを設定します'
                  : 'Configure your language and theme preferences'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Language */}
              <div className="space-y-2">
                <Label>{t('settings.language')}</Label>
                <Select value={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ja">日本語</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Theme */}
              <div className="space-y-2">
                <Label>{language === 'ja' ? 'テーマ' : 'Theme'}</Label>
                <Select value={theme} onValueChange={handleThemeChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      {language === 'ja' ? 'ライト' : 'Light'}
                    </SelectItem>
                    <SelectItem value="dark">
                      {language === 'ja' ? 'ダーク' : 'Dark'}
                    </SelectItem>
                    <SelectItem value="system">
                      {language === 'ja' ? 'システム設定に従う' : 'System'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.notifications')}</CardTitle>
              <CardDescription>
                {language === 'ja'
                  ? 'メールとアプリ内通知の設定'
                  : 'Configure email and in-app notifications'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Notifications */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900">
                  {language === 'ja' ? 'メール通知' : 'Email Notifications'}
                </h4>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>
                      {language === 'ja' ? 'プロジェクト更新' : 'Project Updates'}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {language === 'ja'
                        ? 'プロジェクトのステータス変更時に通知'
                        : 'Get notified when project status changes'}
                    </p>
                  </div>
                  <Switch
                    checked={notifications.email_project_updates}
                    onCheckedChange={(checked) =>
                      handleNotificationChange('email_project_updates', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>
                      {language === 'ja' ? 'コンテンツ準備完了' : 'Content Ready for Review'}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {language === 'ja'
                        ? 'レビュー待ちのコンテンツがある時に通知'
                        : 'Get notified when content is ready for your review'}
                    </p>
                  </div>
                  <Switch
                    checked={notifications.email_content_ready}
                    onCheckedChange={(checked) =>
                      handleNotificationChange('email_content_ready', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>
                      {language === 'ja' ? '期限リマインダー' : 'Deadline Reminders'}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {language === 'ja'
                        ? 'レビュー期限が近づいた時に通知'
                        : 'Get reminded when review deadlines are approaching'}
                    </p>
                  </div>
                  <Switch
                    checked={notifications.email_deadline_reminders}
                    onCheckedChange={(checked) =>
                      handleNotificationChange('email_deadline_reminders', checked)
                    }
                  />
                </div>
              </div>

              {/* In-App Notifications */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-900">
                  {language === 'ja' ? 'アプリ内通知' : 'In-App Notifications'}
                </h4>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>
                      {language === 'ja' ? '通知を有効にする' : 'Enable Notifications'}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {language === 'ja'
                        ? 'アプリ内で通知を受け取る'
                        : 'Receive notifications within the app'}
                    </p>
                  </div>
                  <Switch
                    checked={notifications.in_app_enabled}
                    onCheckedChange={(checked) =>
                      handleNotificationChange('in_app_enabled', checked)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ClientSettingsPage;
