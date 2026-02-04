/**
 * ClearPress AI - PR Portal Layout
 * Main layout wrapper for PR Admin and Staff with sidebar navigation
 */

import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import { cn } from '@/lib/utils';
import { useSidebarState } from '@/hooks/use-sidebar-state';

import { Header } from '../Header';
import { PRSidebar } from './PRSidebar';
import { PRMobileNav } from './PRMobileNav';

export function PRPortalLayout() {
  const { isCollapsed, toggle } = useSidebarState();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full z-40">
        <PRSidebar isCollapsed={isCollapsed} onToggleCollapse={toggle} />
      </aside>

      {/* Mobile Navigation */}
      <PRMobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />

      {/* Main Content Area - padding adjusts based on sidebar collapsed state */}
      <div
        className={cn(
          'min-h-screen transition-all duration-300',
          isCollapsed ? 'lg:pl-16' : 'lg:pl-60'
        )}
      >
        {/* Header - only show mobile menu trigger, sidebar handles desktop header */}
        <Header
          variant="pr"
          showLogo
          showMobileMenuTrigger
          showNotifications
          onMobileMenuOpen={() => setMobileNavOpen(true)}
          className="lg:hidden"
        />

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
