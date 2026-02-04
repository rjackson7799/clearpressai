/**
 * ClearPress AI - Layout Constants
 * Precision Clarity Design System
 *
 * Shared dimension values for consistent UI
 */

export const LAYOUT = {
  /** Sidebar width in pixels (expanded) - increased for Japanese text */
  SIDEBAR_WIDTH: 260,
  /** Sidebar width in pixels (collapsed) */
  SIDEBAR_COLLAPSED_WIDTH: 72,
  /** Detail panel width in pixels */
  DETAIL_PANEL_WIDTH: 360,
  /** Header height in pixels (desktop) */
  HEADER_HEIGHT_DESKTOP: 64,
  /** Header height in pixels (mobile) */
  HEADER_HEIGHT_MOBILE: 56,
  /** Bottom navigation height in pixels - increased for better touch targets */
  BOTTOM_NAV_HEIGHT: 72,
} as const;

/** Animation timing constants (in ms) */
export const ANIMATION = {
  /** Fast transitions (color, opacity) */
  FAST: 150,
  /** Normal transitions */
  NORMAL: 200,
  /** Slow transitions (layout changes) */
  SLOW: 300,
  /** Slower transitions (page transitions) */
  SLOWER: 500,
  /** Compliance ring animation */
  RING: 800,
  /** Stagger delay between items */
  STAGGER: 50,
} as const;

/** Breakpoints matching Tailwind defaults */
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

/** LocalStorage keys */
export const STORAGE_KEYS = {
  SIDEBAR_COLLAPSED: 'clearpress-sidebar-collapsed',
  LANGUAGE: 'clearpress-language',
  THEME: 'clearpress-theme',
} as const;

/** Compliance score thresholds */
export const COMPLIANCE_THRESHOLDS = {
  EXCELLENT: 90,
  GOOD: 70,
  WARNING: 50,
} as const;

/** Content status workflow order */
export const STATUS_ORDER = [
  'draft',
  'submitted',
  'in_review',
  'needs_revision',
  'approved',
] as const;

/** Project status workflow order */
export const PROJECT_STATUS_ORDER = [
  'requested',
  'in_progress',
  'in_review',
  'approved',
  'completed',
  'archived',
] as const;
