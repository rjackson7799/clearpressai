/**
 * ClearPress AI - Sidebar State Hook
 * Manages sidebar collapsed state with localStorage persistence
 */

import { useState, useCallback } from 'react';
import { STORAGE_KEYS } from '@/lib/constants';

interface UseSidebarStateReturn {
  isCollapsed: boolean;
  toggle: () => void;
  setIsCollapsed: (collapsed: boolean) => void;
}

export function useSidebarState(): UseSidebarStateReturn {
  const [isCollapsed, setIsCollapsedState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED) === 'true';
    }
    return false;
  });

  const setIsCollapsed = useCallback((collapsed: boolean) => {
    setIsCollapsedState(collapsed);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(collapsed));
    }
  }, []);

  const toggle = useCallback(() => {
    setIsCollapsed(!isCollapsed);
  }, [isCollapsed, setIsCollapsed]);

  return { isCollapsed, toggle, setIsCollapsed };
}
