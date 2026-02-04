/**
 * Organization Settings Component
 * Manage organization-level settings (admin only)
 */

import { useState } from 'react';
import { Building2, Palette, Globe, Clock, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import {
  useOrganizationSettings,
  useUpdateOrganizationSettings,
  useUpdateOrganizationName,
} from '@/hooks/use-settings';
import type { OrganizationSettingsData } from '@/services/settings';

export function OrganizationSettings() {
  const { t, language } = useLanguage();
  const { organization, role } = useAuth();
  const isAdmin = role === 'pr_admin';

  const { data: settings, isLoading } = useOrganizationSettings(organization?.id);
  const updateSettings = useUpdateOrganizationSettings();
  const updateName = useUpdateOrganizationName();

  const [orgName, setOrgName] = useState(organization?.name || '');
  const [defaultLanguage, setDefaultLanguage] = useState<'ja' | 'en'>(
    settings?.defaults?.language || 'ja'
  );
  const [timezone, setTimezone] = useState(settings?.timezone || 'Asia/Tokyo');
  const [primaryColor, setPrimaryColor] = useState(
    settings?.branding?.primary_color || '#2563eb'
  );

  // Update local state when settings load
  useState(() => {
    if (settings) {
      setDefaultLanguage(settings.defaults?.language || 'ja');
      setTimezone(settings.timezone || 'Asia/Tokyo');
      setPrimaryColor(settings.branding?.primary_color || '#2563eb');
    }
  });

  const handleSaveName = () => {
    if (organization?.id && orgName.trim()) {
      updateName.mutate({ organizationId: organization.id, name: orgName.trim() });
    }
  };

  const handleSaveSettings = () => {
    if (!organization?.id) return;

    const newSettings: Partial<OrganizationSettingsData> = {
      defaults: {
        language: defaultLanguage,
      },
      timezone,
      branding: {
        primary_color: primaryColor,
      },
    };

    updateSettings.mutate({ organizationId: organization.id, settings: newSettings });
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {language === 'ja'
            ? '組織設定を変更するには管理者権限が必要です'
            : 'Admin privileges required to change organization settings'}
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-10 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-10 bg-gray-200 rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" />
            {t('settings.organizationInfo')}
          </CardTitle>
          <CardDescription>
            {language === 'ja'
              ? '組織の基本情報を管理します'
              : 'Manage basic organization information'}
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orgName">{t('settings.organizationName')}</Label>
            <div className="flex gap-2">
              <Input
                id="orgName"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="max-w-md"
              />
              <Button
                onClick={handleSaveName}
                disabled={updateName.isPending || orgName === organization?.name}
              >
                <Save className="h-4 w-4 mr-2" />
                {t('common.save')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Defaults */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4" />
            {t('settings.defaults')}
          </CardTitle>
          <CardDescription>
            {language === 'ja'
              ? '新規プロジェクトやユーザーのデフォルト設定'
              : 'Default settings for new projects and users'}
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>{t('settings.defaultLanguage')}</Label>
            <Select value={defaultLanguage} onValueChange={(v) => setDefaultLanguage(v as 'ja' | 'en')}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ja">日本語</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('settings.timezone')}</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST)</SelectItem>
                <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                <SelectItem value="America/Los_Angeles">America/Los_Angeles (PST)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4" />
            {t('settings.branding')}
          </CardTitle>
          <CardDescription>
            {language === 'ja'
              ? 'ブランドカラーやロゴの設定'
              : 'Brand colors and logo settings'}
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>{t('settings.primaryColor')}</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-20 rounded border cursor-pointer"
              />
              <Input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-32 font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('settings.logo')}</Label>
            <p className="text-sm text-muted-foreground">
              {language === 'ja' ? '準備中' : 'Coming soon'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} disabled={updateSettings.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {t('settings.saveAll')}
        </Button>
      </div>
    </div>
  );
}
