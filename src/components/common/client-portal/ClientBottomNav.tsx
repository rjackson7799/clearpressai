/**
 * ClearPress AI - Client Portal Bottom Navigation
 * Precision Clarity Design System
 *
 * Mobile bottom navigation with frosted glass
 * - 72px height for better touch targets
 * - Vermillion active state with scale animation
 * - Safe area support for notched devices
 */

import { NavLink } from 'react-router-dom';

import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { LAYOUT } from '@/lib/constants';

import { CLIENT_NAV_ITEMS } from './ClientNavItems';

export function ClientBottomNav() {
  const { t } = useLanguage();

  return (
    <nav
      className={cn(
        'lg:hidden fixed bottom-0 left-0 right-0 z-50',
        'glass border-t border-border/30',
        'shadow-[0_-4px_20px_rgba(0,0,0,0.06)]'
      )}
      style={{
        height: LAYOUT.BOTTOM_NAV_HEIGHT,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-center justify-around h-full max-w-lg mx-auto px-2">
        {CLIENT_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.key}
            to={item.href}
            end={item.href === '/client'}
            className={({ isActive }) =>
              cn(
                'group flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-xl',
                'transition-all duration-150 ease-out',
                'active:scale-95',
                isActive
                  ? 'text-[oklch(55%_0.18_25)]'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={cn(
                    'relative flex items-center justify-center',
                    'transition-transform duration-200',
                    isActive ? 'scale-110' : 'group-hover:scale-105'
                  )}
                >
                  <item.icon
                    className={cn(
                      'h-5 w-5',
                      isActive && 'drop-shadow-sm'
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                    fill={isActive ? 'currentColor' : 'none'}
                  />
                  {/* Active indicator dot */}
                  {isActive && (
                    <span
                      className={cn(
                        'absolute -bottom-1.5 w-1 h-1 rounded-full',
                        'bg-[oklch(55%_0.18_25)]',
                        'animate-scale-in'
                      )}
                    />
                  )}
                </div>
                <span
                  className={cn(
                    'text-[11px] font-medium',
                    'transition-all duration-150',
                    isActive
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-70 translate-y-0.5'
                  )}
                >
                  {t(item.labelKey)}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
