/**
 * PWA Update Prompt Component
 *
 * Shows a toast notification when a new version is available
 */

import { RefreshCw, X } from 'lucide-react';
import { usePWAUpdate } from '@/hooks/use-pwa';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

export function PWAUpdatePrompt() {
  const { needRefresh, offlineReady, close, update } = usePWAUpdate();
  const { t } = useLanguage();

  if (!needRefresh && !offlineReady) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-80 z-[100] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg p-4 animate-in slide-in-from-bottom-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <RefreshCw className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
            {needRefresh ? t('pwa.updateAvailable') : t('pwa.offlineReady')}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {needRefresh
              ? t('pwa.updateDescription')
              : t('pwa.offlineReadyDescription')}
          </p>
          {needRefresh && (
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={update}>
                {t('pwa.update')}
              </Button>
              <Button size="sm" variant="ghost" onClick={close}>
                {t('common.later')}
              </Button>
            </div>
          )}
          {offlineReady && (
            <Button size="sm" variant="ghost" onClick={close} className="mt-3">
              {t('common.ok')}
            </Button>
          )}
        </div>
        <button
          onClick={close}
          className="flex-shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
