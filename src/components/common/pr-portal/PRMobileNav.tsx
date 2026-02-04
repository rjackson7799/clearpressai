/**
 * ClearPress AI - PR Portal Mobile Navigation
 * Slide-out navigation for mobile devices
 */

import { NavLink, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

import { Logo } from '../Logo';
import { UserMenu } from '../UserMenu';
import { PR_NAV_ITEMS } from './PRNavItems';

interface PRMobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PRMobileNav({ open, onOpenChange }: PRMobileNavProps) {
  const { t } = useLanguage();
  const { isPRAdmin } = useAuth();
  const location = useLocation();

  // Close sheet on navigation
  useEffect(() => {
    onOpenChange(false);
  }, [location.pathname, onOpenChange]);

  const visibleItems = PR_NAV_ITEMS.filter(
    (item) => !item.adminOnly || isPRAdmin
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle>
            <Logo size="sm" />
          </SheetTitle>
        </SheetHeader>

        {/* Navigation items */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {visibleItems.map((item) => (
            <NavLink
              key={item.key}
              to={item.href}
              end={item.href === '/pr'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground'
                )
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">{t(item.labelKey)}</span>
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 border-t p-2">
          <UserMenu />
        </div>
      </SheetContent>
    </Sheet>
  );
}
