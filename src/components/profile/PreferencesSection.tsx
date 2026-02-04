/**
 * Preferences Section Component
 * User preferences for language and other settings
 */

import { Settings, Globe, Key } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
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

export function PreferencesSection() {
  const { t, language, setLanguage } = useLanguage();

  const handleLanguageChange = (value: 'ja' | 'en') => {
    setLanguage(value);
  };

  return (
    <div className="space-y-6">
      {/* Preferences Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Settings className="h-4 w-4 text-gray-400" />
            {t('profile.preferences')}
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-5">
          <div className="space-y-5">
            {/* Language Preference */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-gray-400" />
                {t('profile.language')}
              </Label>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ja">{t('profile.japanese')}</SelectItem>
                  <SelectItem value="en">{t('profile.english')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Actions Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Key className="h-4 w-4 text-gray-400" />
            {t('profile.accountInfo')}
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-5">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-3">
                {language === 'ja'
                  ? 'パスワードを変更する場合は、下のボタンをクリックしてください。'
                  : 'Click the button below to change your password.'}
              </p>
              <Button variant="outline" disabled>
                {t('profile.changePassword')}
              </Button>
              <p className="text-xs text-gray-400 mt-2">
                {language === 'ja' ? '準備中' : 'Coming soon'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
