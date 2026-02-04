/**
 * ClearPress AI - Logo Component
 * App logo with size variants
 */

import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Logo icon - stylized "CP" mark */}
      <div
        className={cn(
          'rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold',
          sizeClasses[size]
        )}
      >
        <span className={size === 'sm' ? 'text-xs' : 'text-sm'}>CP</span>
      </div>
      {showText && (
        <span className={cn('font-semibold', textSizeClasses[size])}>
          ClearPress AI
        </span>
      )}
    </div>
  );
}
