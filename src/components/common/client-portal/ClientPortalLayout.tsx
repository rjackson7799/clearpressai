/**
 * ClearPress AI - Client Portal Layout
 * Precision Clarity Design System
 *
 * Mobile-first layout with frosted glass navigation
 * - Warm paper background gradient
 * - Frosted sidebar on desktop
 * - Bottom navigation on mobile
 */

import { Outlet } from 'react-router-dom';

import { Header } from '../Header';
import { ClientSidebar } from './ClientSidebar';
import { ClientBottomNav } from './ClientBottomNav';
import { InstallPrompt } from '@/components/pwa';
import { LAYOUT } from '@/lib/constants';

export function ClientPortalLayout() {
  return (
    <div
      className="min-h-screen"
      style={{
        // Warm paper gradient background
        background: `linear-gradient(
          180deg,
          oklch(98.5% 0.003 80) 0%,
          oklch(96.5% 0.004 80) 50%,
          oklch(95% 0.005 80) 100%
        )`,
      }}
    >
      {/* Desktop Sidebar - frosted glass effect */}
      <aside
        className="hidden lg:flex fixed left-0 top-0 h-full z-40"
        style={{ width: LAYOUT.SIDEBAR_WIDTH }}
      >
        <ClientSidebar />
      </aside>

      {/* Mobile Header - hidden on desktop */}
      <Header
        variant="client"
        showLogo
        showNotifications
        className="lg:hidden sticky top-0 z-30 glass border-b border-border/50"
      />

      {/* Main Content Area */}
      <main
        className="lg:pl-[260px] min-h-screen"
        style={{
          paddingBottom: LAYOUT.BOTTOM_NAV_HEIGHT + 16,
        }}
      >
        {/* Content container with max-width for readability */}
        <div className="max-w-4xl mx-auto p-4 lg:p-6 lg:py-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation - frosted glass effect */}
      <ClientBottomNav />

      {/* PWA Install Prompt - mobile only */}
      <InstallPrompt />
    </div>
  );
}
