/**
 * Install Prompt Component
 *
 * Shows a banner prompting users to install the PWA
 * Only shown on mobile devices in the client portal
 */

import { Download, X } from 'lucide-react';
import { useState } from 'react';
import { useInstallPrompt } from '@/hooks/use-pwa';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { STORAGE_KEYS } from '@/lib/constants';

const INSTALL_DISMISSED_KEY = `${STORAGE_KEYS.THEME}-install-dismissed`;

export function InstallPrompt() {
  const { canInstall, promptInstall } = useInstallPrompt();
  const { t } = useLanguage();
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem(INSTALL_DISMISSED_KEY) === 'true';
  });

  if (!canInstall || isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(INSTALL_DISMISSED_KEY, 'true');
  };

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
      setIsDismissed(true);
    }
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 md:hidden z-[100] bg-gradient-to-r from-primary to-primary/90 text-white rounded-lg shadow-lg p-4 animate-in slide-in-from-bottom-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <Download className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">
            {t('pwa.installTitle')}
          </p>
          <p className="text-xs text-white/80 mt-1">
            {t('pwa.installDescription')}
          </p>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              variant="secondary"
              className="bg-white text-primary hover:bg-white/90"
              onClick={handleInstall}
            >
              {t('pwa.install')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={handleDismiss}
            >
              {t('common.later')}
            </Button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-white/60 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
