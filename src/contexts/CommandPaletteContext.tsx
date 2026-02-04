/**
 * ClearPress AI - Command Palette Context
 * Provides global command registration and execution for keyboard shortcuts
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { LucideIcon } from 'lucide-react';

export type CommandContext = 'global' | 'editor' | 'project' | 'dashboard';

export interface Command {
  /** Unique identifier for the command */
  id: string;
  /** Display label (should be translated) */
  label: string;
  /** Optional description */
  description?: string;
  /** Keyboard shortcut display string (e.g., "⌘S" or "Ctrl+S") */
  shortcut?: string;
  /** Icon component from lucide-react */
  icon?: LucideIcon;
  /** Handler function to execute */
  action: () => void;
  /** Context where this command is available */
  context?: CommandContext;
  /** Category for grouping in palette */
  category?: string;
  /** Whether the command is currently enabled */
  enabled?: boolean;
}

interface CommandPaletteContextType {
  /** Whether the command palette is open */
  isOpen: boolean;
  /** Open the command palette */
  open: () => void;
  /** Close the command palette */
  close: () => void;
  /** Toggle the command palette */
  toggle: () => void;
  /** All registered commands */
  commands: Command[];
  /** Register a command */
  registerCommand: (command: Command) => void;
  /** Unregister a command by ID */
  unregisterCommand: (id: string) => void;
  /** Register multiple commands at once */
  registerCommands: (commands: Command[]) => void;
  /** Execute a command by ID */
  executeCommand: (id: string) => void;
  /** Get commands filtered by context */
  getCommandsByContext: (context: CommandContext) => Command[];
  /** Current active context */
  activeContext: CommandContext;
  /** Set the active context */
  setActiveContext: (context: CommandContext) => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextType | null>(null);

interface CommandPaletteProviderProps {
  children: ReactNode;
}

export function CommandPaletteProvider({ children }: CommandPaletteProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [commands, setCommands] = useState<Command[]>([]);
  const [activeContext, setActiveContext] = useState<CommandContext>('global');

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  const registerCommand = useCallback((command: Command) => {
    setCommands(prev => {
      // Replace if command with same ID exists
      const filtered = prev.filter(c => c.id !== command.id);
      return [...filtered, command];
    });
  }, []);

  const unregisterCommand = useCallback((id: string) => {
    setCommands(prev => prev.filter(c => c.id !== id));
  }, []);

  const registerCommands = useCallback((newCommands: Command[]) => {
    setCommands(prev => {
      const ids = new Set(newCommands.map(c => c.id));
      const filtered = prev.filter(c => !ids.has(c.id));
      return [...filtered, ...newCommands];
    });
  }, []);

  const executeCommand = useCallback((id: string) => {
    const command = commands.find(c => c.id === id);
    if (command && command.enabled !== false) {
      close();
      // Execute after a small delay to allow palette to close
      setTimeout(() => command.action(), 50);
    }
  }, [commands, close]);

  const getCommandsByContext = useCallback((context: CommandContext) => {
    return commands.filter(c => {
      // Global commands are always available
      if (c.context === 'global' || !c.context) return true;
      // Context-specific commands only available in their context
      return c.context === context;
    }).filter(c => c.enabled !== false);
  }, [commands]);

  const value = useMemo(() => ({
    isOpen,
    open,
    close,
    toggle,
    commands,
    registerCommand,
    unregisterCommand,
    registerCommands,
    executeCommand,
    getCommandsByContext,
    activeContext,
    setActiveContext,
  }), [
    isOpen,
    open,
    close,
    toggle,
    commands,
    registerCommand,
    unregisterCommand,
    registerCommands,
    executeCommand,
    getCommandsByContext,
    activeContext,
    setActiveContext,
  ]);

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette() {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error('useCommandPalette must be used within a CommandPaletteProvider');
  }
  return context;
}

/**
 * Hook to register commands when a component mounts and unregister on unmount
 */
export function useRegisterCommands(commands: Command[], deps: unknown[] = []) {
  const { registerCommands, unregisterCommand } = useCommandPalette();

  // Register commands on mount and when deps change
  // Using a stable approach to avoid infinite loops
  const commandIds = commands.map(c => c.id);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => {
    registerCommands(commands);
  }, [registerCommands, ...deps]);

  // Cleanup on unmount - unregister all commands
  useMemo(() => {
    return () => {
      commandIds.forEach(id => unregisterCommand(id));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export default CommandPaletteContext;
