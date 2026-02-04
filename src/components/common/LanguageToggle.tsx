/**
 * ClearPress AI - Language Toggle Component
 * Switch between Japanese and English
 */

import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface LanguageToggleProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'icon';
  className?: string;
}

export function LanguageToggle({
  variant = 'ghost',
  size = 'sm',
  className,
}: LanguageToggleProps) {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'ja' ? 'en' : 'ja');
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleLanguage}
      className={cn('font-medium', className)}
    >
      {language === 'ja' ? 'EN' : 'JA'}
    </Button>
  );
}
