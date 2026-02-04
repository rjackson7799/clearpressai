/**
 * ClearPress AI - Header Component
 * Shared header with responsive variants for PR and Client portals
 */

import { Menu } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { NotificationCenter } from '@/components/notifications';
import { cn } from '@/lib/utils';
import { LAYOUT } from '@/lib/constants';

import { Logo } from './Logo';
import { LanguageToggle } from './LanguageToggle';
import { UserMenu } from './UserMenu';

interface HeaderProps {
  /** Show logo in header (typically false when sidebar has logo) */
  showLogo?: boolean;
  /** Show mobile menu trigger button */
  showMobileMenuTrigger?: boolean;
  /** Callback when mobile menu button is clicked */
  onMobileMenuOpen?: () => void;
  /** Show notification bell */
  showNotifications?: boolean;
  /** Portal variant for styling */
  variant?: 'pr' | 'client';
  /** Additional content to render in header */
  children?: ReactNode;
  /** Additional classes */
  className?: string;
}

export function Header({
  showLogo = false,
  showMobileMenuTrigger = false,
  onMobileMenuOpen,
  showNotifications = false,
  variant = 'pr',
  children,
  className,
}: HeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 border-b bg-card',
        className
      )}
      style={{
        height: `${LAYOUT.HEADER_HEIGHT_MOBILE}px`,
      }}
    >
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        {/* Left section */}
        <div className="flex items-center gap-3">
          {showMobileMenuTrigger && (
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={onMobileMenuOpen}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          {showLogo && <Logo size="sm" />}
          {children}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {showNotifications && <NotificationCenter variant={variant} />}
          <LanguageToggle />
          {/* UserMenu always visible for easy logout access */}
          <UserMenu compact />
        </div>
      </div>
    </header>
  );
}
