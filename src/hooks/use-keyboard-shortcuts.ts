/**
 * ClearPress AI - Keyboard Shortcuts Hook
 * Global keyboard event listener with platform-aware modifier key handling
 */

import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  /** The key to listen for (lowercase, e.g., 'k', 's', 'enter') */
  key: string;
  /** Require Ctrl key (Windows/Linux) or Cmd key (Mac) */
  ctrlOrMeta?: boolean;
  /** Require Shift key */
  shift?: boolean;
  /** Require Alt key */
  alt?: boolean;
  /** Handler function to execute */
  handler: () => void;
  /** Whether the shortcut is currently enabled */
  enabled?: boolean;
  /** Prevent default browser behavior */
  preventDefault?: boolean;
}

/**
 * Detects if the current platform is macOS
 */
export function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform);
}

/**
 * Formats a shortcut for display based on platform
 */
export function formatShortcut(shortcut: Pick<KeyboardShortcut, 'key' | 'ctrlOrMeta' | 'shift' | 'alt'>): string {
  const isMac = isMacPlatform();
  const parts: string[] = [];

  if (shortcut.ctrlOrMeta) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (shortcut.shift) {
    parts.push(isMac ? '⇧' : 'Shift');
  }
  if (shortcut.alt) {
    parts.push(isMac ? '⌥' : 'Alt');
  }

  // Format key for display
  const keyDisplay = shortcut.key === 'enter'
    ? (isMac ? '↵' : 'Enter')
    : shortcut.key.toUpperCase();
  parts.push(keyDisplay);

  return isMac ? parts.join('') : parts.join('+');
}

/**
 * Hook for registering keyboard shortcuts
 *
 * @example
 * useKeyboardShortcuts([
 *   { key: 's', ctrlOrMeta: true, handler: handleSave },
 *   { key: 'k', ctrlOrMeta: true, handler: openPalette },
 * ]);
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]): void {
  // Use ref to avoid stale closures while maintaining stable event listener
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const isMac = isMacPlatform();
    const modifierKey = isMac ? event.metaKey : event.ctrlKey;

    // Don't trigger shortcuts when typing in inputs (unless it's a command palette trigger)
    const target = event.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' ||
                   target.tagName === 'TEXTAREA' ||
                   target.isContentEditable;

    for (const shortcut of shortcutsRef.current) {
      // Skip disabled shortcuts
      if (shortcut.enabled === false) continue;

      // Check if all conditions match
      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlOrMetaMatches = shortcut.ctrlOrMeta ? modifierKey : !modifierKey;
      const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const altMatches = shortcut.alt ? event.altKey : !event.altKey;

      if (keyMatches && ctrlOrMetaMatches && shiftMatches && altMatches) {
        // For Ctrl/Cmd shortcuts, allow them even in inputs (common behavior)
        // For non-modifier shortcuts, skip if in input
        if (!shortcut.ctrlOrMeta && isInput) continue;

        if (shortcut.preventDefault !== false) {
          event.preventDefault();
          event.stopPropagation();
        }

        shortcut.handler();
        return;
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Hook for a single keyboard shortcut (convenience wrapper)
 */
export function useKeyboardShortcut(
  key: string,
  handler: () => void,
  options: Omit<KeyboardShortcut, 'key' | 'handler'> = {}
): void {
  useKeyboardShortcuts([{ key, handler, ...options }]);
}
