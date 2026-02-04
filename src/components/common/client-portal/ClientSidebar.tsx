/**
 * ClearPress AI - Client Portal Sidebar
 * Precision Clarity Design System
 *
 * Desktop sidebar with frosted glass effect
 * - Vermillion accent on active state
 * - Spring animations on hover
 * - Display font for section titles
 */

import { NavLink } from 'react-router-dom';

import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { LAYOUT } from '@/lib/constants';

import { Logo } from '../Logo';
import { LanguageToggle } from '../LanguageToggle';
import { UserMenu } from '../UserMenu';
import { NotificationCenter } from '@/components/notifications';
import { CLIENT_NAV_ITEMS } from './ClientNavItems';

export function ClientSidebar() {
  const { t } = useLanguage();

  return (
    <aside
      className="flex flex-col h-full glass border-r border-border/30"
      style={{ width: LAYOUT.SIDEBAR_WIDTH }}
    >
      {/* Logo section with subtle bottom fade */}
      <div className="flex items-center justify-between h-[72px] px-5 border-b border-border/30">
        <Logo size="sm" />
        <div className="flex items-center gap-2">
          <NotificationCenter variant="client" />
          <LanguageToggle />
        </div>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        {CLIENT_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.key}
            to={item.href}
            end={item.href === '/client'}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 px-4 py-3 rounded-xl',
                'transition-all duration-150 ease-out',
                'hover:scale-[1.02] active:scale-[0.98]',
                isActive
                  ? [
                      'bg-[oklch(95%_0.03_25)]',
                      'border-l-[3px] border-[oklch(55%_0.18_25)]',
                      'text-[oklch(42%_0.2_25)]',
                      'shadow-sm',
                    ].join(' ')
                  : [
                      'text-muted-foreground',
                      'hover:bg-muted/60',
                      'hover:text-foreground',
                    ].join(' ')
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn(
                    'h-5 w-5 shrink-0 transition-transform duration-150',
                    isActive && 'text-[oklch(55%_0.18_25)]',
                    !isActive && 'group-hover:scale-110'
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span
                  className={cn(
                    'text-sm font-medium',
                    isActive && 'font-semibold'
                  )}
                >
                  {t(item.labelKey)}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User section with border */}
      <div className="border-t border-border/30 p-3">
        <UserMenu />
      </div>
    </aside>
  );
}
