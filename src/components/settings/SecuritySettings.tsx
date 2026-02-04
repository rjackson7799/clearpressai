/**
 * Security Settings Component
 * Password change and security options
 */

import { useState } from 'react';
import { Key, Shield, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUpdatePassword } from '@/hooks/use-settings';

export function SecuritySettings() {
  const { t, language } = useLanguage();
  const updatePassword = useUpdatePassword();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return language === 'ja' ? '8文字以上で入力してください' : 'Must be at least 8 characters';
    }
    if (!/[A-Z]/.test(password)) {
      return language === 'ja' ? '大文字を含めてください' : 'Must contain an uppercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return language === 'ja' ? '数字を含めてください' : 'Must contain a number';
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate new password
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setErrors({ newPassword: passwordError });
      return;
    }

    // Confirm passwords match
    if (newPassword !== confirmPassword) {
      setErrors({
        confirmPassword: language === 'ja' ? 'パスワードが一致しません' : 'Passwords do not match',
      });
      return;
    }

    // Update password
    updatePassword.mutate(newPassword, {
      onSuccess: () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Key className="h-4 w-4" />
            {t('settings.changePassword')}
          </CardTitle>
          <CardDescription>
            {language === 'ja'
              ? 'アカウントのパスワードを変更します'
              : 'Change your account password'}
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t('settings.currentPassword')}</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">{t('settings.newPassword')}</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-sm text-red-500">{errors.newPassword}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {language === 'ja'
                  ? '8文字以上、大文字と数字を含む'
                  : '8+ characters, uppercase letter, and number'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('settings.confirmPassword')}</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={updatePassword.isPending || !currentPassword || !newPassword || !confirmPassword}
            >
              {updatePassword.isPending
                ? (language === 'ja' ? '更新中...' : 'Updating...')
                : t('settings.updatePassword')
              }
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication (Placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            {t('settings.twoFactorAuth')}
          </CardTitle>
          <CardDescription>
            {language === 'ja'
              ? '二要素認証でアカウントを保護します'
              : 'Protect your account with two-factor authentication'}
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <div className="flex items-center justify-between max-w-md">
            <div>
              <p className="text-sm font-medium">
                {language === 'ja' ? '二要素認証' : 'Two-Factor Authentication'}
              </p>
              <p className="text-sm text-muted-foreground">
                {language === 'ja' ? '準備中' : 'Coming soon'}
              </p>
            </div>
            <Button variant="outline" disabled>
              {language === 'ja' ? '設定' : 'Set up'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions (Placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t('settings.activeSessions')}
          </CardTitle>
          <CardDescription>
            {language === 'ja'
              ? 'このアカウントでログイン中のデバイス'
              : 'Devices currently logged into this account'}
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            {language === 'ja' ? '準備中' : 'Coming soon'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
