/**
 * ClearPress AI - Command Palette
 * A searchable command palette for keyboard-driven navigation
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Command as CommandIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCommandPalette, type Command } from '@/contexts/CommandPaletteContext';
import { useKeyboardShortcuts, formatShortcut, isMacPlatform } from '@/hooks/use-keyboard-shortcuts';

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface CommandPaletteProps {
  className?: string;
}

export function CommandPalette({ className }: CommandPaletteProps) {
  const { t } = useLanguage();
  const { isOpen, close, toggle, commands, activeContext, getCommandsByContext, executeCommand } = useCommandPalette();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Register Cmd/Ctrl+K to toggle palette
  useKeyboardShortcuts([
    {
      key: 'k',
      ctrlOrMeta: true,
      handler: toggle,
      preventDefault: true,
    },
    // Escape to close (backup, Dialog handles this too)
    {
      key: 'Escape',
      handler: close,
      enabled: isOpen,
    },
  ]);

  // Filter commands based on search and context
  const filteredCommands = useMemo(() => {
    const contextCommands = getCommandsByContext(activeContext);

    if (!search.trim()) {
      return contextCommands;
    }

    const searchLower = search.toLowerCase();
    return contextCommands.filter(command => {
      const labelMatch = command.label.toLowerCase().includes(searchLower);
      const descMatch = command.description?.toLowerCase().includes(searchLower);
      const categoryMatch = command.category?.toLowerCase().includes(searchLower);
      return labelMatch || descMatch || categoryMatch;
    });
  }, [commands, search, activeContext, getCommandsByContext]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {};

    for (const command of filteredCommands) {
      const category = command.category || t('commandPalette.categories.general');
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(command);
    }

    return groups;
  }, [filteredCommands, t]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      // Focus input after dialog animation
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset selection when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Keyboard navigation within the palette
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            executeCommand(filteredCommands[selectedIndex].id);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, executeCommand]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selectedElement = listRef.current.querySelector('[data-selected="true"]');
    selectedElement?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const isMac = isMacPlatform();

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && close()}>
      <DialogContent
        className={cn(
          'max-w-lg p-0 gap-0 overflow-hidden',
          className
        )}
        showCloseButton={false}
      >
        {/* Hidden title for accessibility */}
        <DialogTitle className="sr-only">
          {t('commandPalette.title')}
        </DialogTitle>

        {/* Search Input */}
        <div className="flex items-center border-b px-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('commandPalette.placeholder')}
            className="border-0 shadow-none focus-visible:ring-0 h-12"
          />
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            {isMac ? '⌘' : 'Ctrl'}K
          </kbd>
        </div>

        {/* Command List */}
        <div
          ref={listRef}
          className="max-h-[300px] overflow-y-auto p-2"
        >
          {filteredCommands.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {t('commandPalette.noResults')}
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, categoryCommands]) => (
              <div key={category} className="mb-2">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  {category}
                </div>
                {categoryCommands.map(command => {
                  const globalIndex = filteredCommands.indexOf(command);
                  const isSelected = globalIndex === selectedIndex;
                  const Icon = command.icon || CommandIcon;

                  return (
                    <button
                      key={command.id}
                      data-selected={isSelected}
                      className={cn(
                        'w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors',
                        'hover:bg-accent hover:text-accent-foreground',
                        isSelected && 'bg-accent text-accent-foreground'
                      )}
                      onClick={() => executeCommand(command.id)}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                    >
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 text-left">
                        <div>{command.label}</div>
                        {command.description && (
                          <div className="text-xs text-muted-foreground">
                            {command.description}
                          </div>
                        )}
                      </div>
                      {command.shortcut && (
                        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                          {command.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer with hints */}
        <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1">↑</kbd>
              <kbd className="rounded border bg-muted px-1">↓</kbd>
              {t('commandPalette.hints.navigate')}
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1">↵</kbd>
              {t('commandPalette.hints.select')}
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="rounded border bg-muted px-1">Esc</kbd>
            {t('commandPalette.hints.close')}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Shortcut hint component for displaying in buttons/tooltips
 */
export function ShortcutHint({
  shortcut,
  className,
}: {
  shortcut: { key: string; ctrlOrMeta?: boolean; shift?: boolean; alt?: boolean };
  className?: string;
}) {
  return (
    <kbd className={cn(
      'inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground',
      className
    )}>
      {formatShortcut(shortcut)}
    </kbd>
  );
}
