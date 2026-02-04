/**
 * Notification Settings Component
 * Manage email and in-app notification preferences
 */

import { useState, useEffect } from 'react';
import { Bell, Mail, Smartphone, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPreferences, useUpdateNotificationPreferences } from '@/hooks/use-settings';
import type { NotificationPreferences } from '@/services/settings';

export function NotificationSettings() {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const { data: preferences, isLoading } = useUserPreferences(user?.id);
  const updateNotifications = useUpdateNotificationPreferences();

  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>({
    email_project_assigned: true,
    email_content_submitted: true,
    email_feedback_received: true,
    email_content_approved: true,
    email_deadline_reminder: true,
    email_digest: 'none',
    in_app_all: true,
    push_enabled: false,
  });

  // Update local state when preferences load
  useEffect(() => {
    if (preferences?.notifications) {
      setNotifPrefs((prev) => ({
        ...prev,
        ...preferences.notifications,
      }));
    }
  }, [preferences]);

  const handleToggle = (key: keyof NotificationPreferences) => {
    setNotifPrefs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleDigestChange = (value: 'none' | 'daily' | 'weekly') => {
    setNotifPrefs((prev) => ({
      ...prev,
      email_digest: value,
    }));
  };

  const handleSave = () => {
    if (user?.id) {
      updateNotifications.mutate({
        userId: user.id,
        notifications: notifPrefs,
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-6 w-10 bg-gray-200 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4" />
            {t('settings.emailNotifications')}
          </CardTitle>
          <CardDescription>
            {language === 'ja'
              ? 'メール通知の設定を管理します'
              : 'Manage your email notification preferences'}
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6 space-y-4">
          <NotificationToggle
            label={t('settings.notifyProjectAssigned')}
            description={language === 'ja' ? 'プロジェクトが割り当てられた時' : 'When assigned to a project'}
            checked={notifPrefs.email_project_assigned ?? true}
            onCheckedChange={() => handleToggle('email_project_assigned')}
          />

          <NotificationToggle
            label={t('settings.notifyContentSubmitted')}
            description={language === 'ja' ? 'コンテンツがレビューに提出された時' : 'When content is submitted for review'}
            checked={notifPrefs.email_content_submitted ?? true}
            onCheckedChange={() => handleToggle('email_content_submitted')}
          />

          <NotificationToggle
            label={t('settings.notifyFeedbackReceived')}
            description={language === 'ja' ? 'フィードバックを受け取った時' : 'When feedback is received'}
            checked={notifPrefs.email_feedback_received ?? true}
            onCheckedChange={() => handleToggle('email_feedback_received')}
          />

          <NotificationToggle
            label={t('settings.notifyContentApproved')}
            description={language === 'ja' ? 'コンテンツが承認された時' : 'When content is approved'}
            checked={notifPrefs.email_content_approved ?? true}
            onCheckedChange={() => handleToggle('email_content_approved')}
          />

          <NotificationToggle
            label={t('settings.notifyDeadlineReminder')}
            description={language === 'ja' ? '締め切りが近づいた時' : 'When deadlines are approaching'}
            checked={notifPrefs.email_deadline_reminder ?? true}
            onCheckedChange={() => handleToggle('email_deadline_reminder')}
          />

          <Separator className="my-4" />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('settings.emailDigest')}</Label>
              <p className="text-sm text-muted-foreground">
                {language === 'ja' ? '活動サマリーをまとめて受け取る' : 'Receive activity summary'}
              </p>
            </div>
            <Select
              value={notifPrefs.email_digest || 'none'}
              onValueChange={handleDigestChange}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  {language === 'ja' ? 'なし' : 'None'}
                </SelectItem>
                <SelectItem value="daily">
                  {language === 'ja' ? '毎日' : 'Daily'}
                </SelectItem>
                <SelectItem value="weekly">
                  {language === 'ja' ? '週次' : 'Weekly'}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* In-App Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4" />
            {t('settings.inAppNotifications')}
          </CardTitle>
          <CardDescription>
            {language === 'ja'
              ? 'アプリ内通知の設定を管理します'
              : 'Manage your in-app notification preferences'}
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6 space-y-4">
          <NotificationToggle
            label={t('settings.enableInAppNotifications')}
            description={language === 'ja' ? 'アプリ内で通知を表示する' : 'Show notifications within the app'}
            checked={notifPrefs.in_app_all ?? true}
            onCheckedChange={() => handleToggle('in_app_all')}
          />
        </CardContent>
      </Card>

      {/* Push Notifications (PWA) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Smartphone className="h-4 w-4" />
            {t('settings.pushNotifications')}
          </CardTitle>
          <CardDescription>
            {language === 'ja'
              ? 'プッシュ通知の設定（PWA）'
              : 'Push notification settings (PWA)'}
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6 space-y-4">
          <NotificationToggle
            label={t('settings.enablePushNotifications')}
            description={language === 'ja' ? 'ブラウザのプッシュ通知を有効にする' : 'Enable browser push notifications'}
            checked={notifPrefs.push_enabled ?? false}
            onCheckedChange={() => handleToggle('push_enabled')}
          />
          <p className="text-xs text-muted-foreground">
            {language === 'ja'
              ? 'プッシュ通知を有効にするには、ブラウザの通知許可が必要です'
              : 'Browser notification permission required to enable push notifications'}
          </p>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateNotifications.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {t('settings.saveNotifications')}
        </Button>
      </div>
    </div>
  );
}

// Helper component for toggle items
function NotificationToggle({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
