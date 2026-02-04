/**
 * ClearPress AI - Client Portal Navigation Items
 * Navigation configuration for Client Users
 */

import type { LucideIcon } from 'lucide-react';
import { Home, FileText, Bell, Settings } from 'lucide-react';

export interface NavItem {
  key: string;
  labelKey: string;
  icon: LucideIcon;
  href: string;
}

export const CLIENT_NAV_ITEMS: NavItem[] = [
  {
    key: 'home',
    labelKey: 'nav.home',
    icon: Home,
    href: '/client',
  },
  {
    key: 'projects',
    labelKey: 'nav.projects',
    icon: FileText,
    href: '/client/projects',
  },
  {
    key: 'notifications',
    labelKey: 'nav.notifications',
    icon: Bell,
    href: '/client/notifications',
  },
  {
    key: 'settings',
    labelKey: 'nav.settings',
    icon: Settings,
    href: '/client/settings',
  },
];
