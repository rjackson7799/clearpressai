/**
 * ClearPress AI - PR Portal Navigation Items
 * Navigation configuration for PR Admin and Staff
 */

import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  FileText,
  UsersRound,
  BarChart3,
  Settings,
} from 'lucide-react';

export interface NavItem {
  key: string;
  labelKey: string;
  icon: LucideIcon;
  href: string;
  /** Only visible to pr_admin role */
  adminOnly?: boolean;
}

export const PR_NAV_ITEMS: NavItem[] = [
  {
    key: 'dashboard',
    labelKey: 'nav.dashboard',
    icon: LayoutDashboard,
    href: '/pr',
  },
  {
    key: 'projects',
    labelKey: 'nav.projects',
    icon: FolderKanban,
    href: '/pr/projects',
  },
  {
    key: 'clients',
    labelKey: 'nav.clients',
    icon: Users,
    href: '/pr/clients',
  },
  {
    key: 'content',
    labelKey: 'content.title',
    icon: FileText,
    href: '/pr/content',
  },
  {
    key: 'team',
    labelKey: 'nav.team',
    icon: UsersRound,
    href: '/pr/team',
    adminOnly: true,
  },
  {
    key: 'analytics',
    labelKey: 'nav.analytics',
    icon: BarChart3,
    href: '/pr/analytics',
    adminOnly: true,
  },
  {
    key: 'settings',
    labelKey: 'nav.settings',
    icon: Settings,
    href: '/pr/settings',
  },
];
