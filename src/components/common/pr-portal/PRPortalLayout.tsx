/**
 * ClearPress AI - PR Portal Layout
 * Main layout wrapper for PR Admin and Staff with sidebar navigation
 */

import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Users, Plus } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useSidebarState } from '@/hooks/use-sidebar-state';
import { useKeyboardShortcuts, formatShortcut } from '@/hooks/use-keyboard-shortcuts';
import { useCommandPalette } from '@/contexts/CommandPaletteContext';
import { useLanguage } from '@/contexts/LanguageContext';

import { Header } from '../Header';
import { PRSidebar } from './PRSidebar';
import { PRMobileNav } from './PRMobileNav';
import { CommandPalette } from '../CommandPalette';
import { CreateContentDialog } from '@/components/content/CreateContentDialog';

export function PRPortalLayout() {
  const { isCollapsed, toggle } = useSidebarState();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { registerCommands, unregisterCommand } = useCommandPalette();

  // Register global navigation commands
  useEffect(() => {
    const commands = [
      {
        id: 'nav-dashboard',
        label: t('commandPalette.commands.goToDashboard'),
        icon: LayoutDashboard,
        action: () => navigate('/pr'),
        category: t('commandPalette.categories.navigation'),
        context: 'global' as const,
      },
      {
        id: 'nav-projects',
        label: t('commandPalette.commands.goToProjects'),
        icon: FolderKanban,
        action: () => navigate('/pr/projects'),
        category: t('commandPalette.categories.navigation'),
        context: 'global' as const,
      },
      {
        id: 'nav-clients',
        label: t('commandPalette.commands.goToClients'),
        icon: Users,
        action: () => navigate('/pr/clients'),
        category: t('commandPalette.categories.navigation'),
        context: 'global' as const,
      },
      {
        id: 'create-content',
        label: t('commandPalette.commands.createContent'),
        description: t('commandPalette.commands.createContentDescription'),
        shortcut: formatShortcut({ key: 'n', ctrlOrMeta: true }),
        icon: Plus,
        action: () => setShowCreateDialog(true),
        category: t('commandPalette.categories.content'),
        context: 'global' as const,
      },
    ];

    registerCommands(commands);

    return () => {
      commands.forEach(cmd => unregisterCommand(cmd.id));
    };
  }, [navigate, t, registerCommands, unregisterCommand]);

  // Register Cmd/Ctrl+N shortcut for creating new content
  useKeyboardShortcuts([
    {
      key: 'n',
      ctrlOrMeta: true,
      handler: () => setShowCreateDialog(true),
    },
  ]);

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
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Command Palette - global keyboard shortcut handler */}
      <CommandPalette />

      {/* Create Content Dialog - triggered by Cmd/Ctrl+N */}
      <CreateContentDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreated={(contentId, projectId) => {
          setShowCreateDialog(false);
          if (projectId) {
            navigate(`/pr/projects/${projectId}/content/${contentId}`);
          }
        }}
      />
    </div>
  );
}
