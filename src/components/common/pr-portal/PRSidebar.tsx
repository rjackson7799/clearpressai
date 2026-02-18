/**
 * ClearPress AI - PR Portal Sidebar
 * Desktop sidebar navigation with collapsible state
 */

import { NavLink } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { LAYOUT } from '@/lib/constants';

import { Logo } from '../Logo';
import { UserMenu } from '../UserMenu';
import { NotificationCenter } from '@/components/notifications';
import { PR_NAV_ITEMS } from './PRNavItems';

interface PRSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function PRSidebar({ isCollapsed, onToggleCollapse }: PRSidebarProps) {
  const { t } = useLanguage();
  const { isPRAdmin } = useAuth();

  const visibleItems = PR_NAV_ITEMS.filter(
    (item) => !item.adminOnly || isPRAdmin
  );

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-card border-r transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-60'
      )}
      style={{
        width: isCollapsed
          ? LAYOUT.SIDEBAR_COLLAPSED_WIDTH
          : LAYOUT.SIDEBAR_WIDTH,
      }}
    >
      {/* Logo section */}
      <div className="flex items-center justify-between h-16 px-4 border-b">
        <Logo size="sm" showText={!isCollapsed} />
        <div className="flex items-center gap-1">
          <NotificationCenter variant="pr" />
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onToggleCollapse}
              aria-label={t('nav.collapse')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Collapsed expand button */}
      {isCollapsed && (
        <div className="flex justify-center py-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onToggleCollapse}
            aria-label={t('nav.expand')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Navigation items */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => (
          <NavLink
            key={item.key}
            to={item.href}
            end
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground',
                isCollapsed && 'justify-center px-2'
              )
            }
            title={isCollapsed ? t(item.labelKey) : undefined}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!isCollapsed && (
              <span className="text-sm font-medium">{t(item.labelKey)}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t p-2">
        <UserMenu compact={isCollapsed} />
      </div>
    </aside>
  );
}
