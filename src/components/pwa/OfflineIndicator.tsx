/**
 * Offline Indicator Component
 *
 * Shows a banner when the user is offline
 */

import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/use-pwa';
import { useLanguage } from '@/contexts/LanguageContext';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const { t } = useLanguage();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2 safe-area-top">
      <WifiOff className="h-4 w-4" />
      <span>{t('pwa.offline')}</span>
    </div>
  );
}
