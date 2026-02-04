/**
 * ClearPress AI - Common Components Barrel Export
 */

// Core components
export { Header } from './Header';
export { Logo } from './Logo';
export { LanguageToggle } from './LanguageToggle';
export { UserMenu } from './UserMenu';

// PR Portal components
export { PRPortalLayout, PRSidebar, PRMobileNav, PR_NAV_ITEMS } from './pr-portal';
export type { NavItem as PRNavItem } from './pr-portal';

// Client Portal components
export { ClientPortalLayout, ClientSidebar, ClientBottomNav, CLIENT_NAV_ITEMS } from './client-portal';
export type { NavItem as ClientNavItem } from './client-portal';
