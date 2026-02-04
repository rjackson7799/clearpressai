/**
 * ClearPress AI - Client Detail Page
 * Detail page for viewing and managing a single client
 */

import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useClient, useClientIndustries } from '@/hooks/use-clients';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  LayoutDashboard,
  Palette,
  Users,
} from 'lucide-react';
import {
  ClientInfoCard,
  ClientSettingsCard,
  StyleProfileEditor,
  StyleExtractionPanel,
  ClientUsersSection,
  EditClientDialog,
  DeleteClientDialog,
} from '@/components/clients';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Loading skeleton
function ClientDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <Skeleton className="h-10 w-64" />

      {/* Content skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </div>
  );
}

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isPRAdmin } = useAuth();

  const { data: client, isLoading, error } = useClient(id);
  const { data: industries } = useClientIndustries(id);

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [extractionDialogOpen, setExtractionDialogOpen] = useState(false);

  // Get client initials for avatar
  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  // Handle delete success - navigate back to list
  const handleDeleteSuccess = () => {
    navigate('/pr/clients');
  };

  if (isLoading) {
    return <ClientDetailSkeleton />;
  }

  if (error || !client) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {t('errors.not_found')}
        </h2>
        <p className="text-gray-500 mb-4">{t('common.error')}</p>
        <Button variant="outline" asChild>
          <Link to="/pr/clients">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('clients.backToClients')}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        to="/pr/clients"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        {t('clients.backToClients')}
      </Link>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            {client.logo_url && (
              <AvatarImage src={client.logo_url} alt={client.name} />
            )}
            <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-semibold">
              {getInitials(client.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {client.name}
            </h1>
            {client.description && (
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                {client.description}
              </p>
            )}
          </div>
        </div>
        {isPRAdmin && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              {t('common.edit')}
            </Button>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('common.delete')}
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            {t('clients.tabOverview')}
          </TabsTrigger>
          <TabsTrigger value="style" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            {t('clients.tabStyleProfile')}
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('clients.tabUsers')}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <ClientInfoCard client={client} industries={industries} />
            <ClientSettingsCard client={client} />
          </div>
        </TabsContent>

        {/* Style Profile Tab */}
        <TabsContent value="style">
          <StyleProfileEditor
            client={client}
            onOpenExtraction={() => setExtractionDialogOpen(true)}
          />
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <ClientUsersSection clientId={client.id} clientName={client.name} />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <EditClientDialog
        client={editDialogOpen ? client : null}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      {/* Delete Dialog */}
      <DeleteClientDialog
        client={deleteDialogOpen ? client : null}
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open && !client) {
            handleDeleteSuccess();
          }
        }}
      />

      {/* Style Extraction Dialog */}
      <Dialog open={extractionDialogOpen} onOpenChange={setExtractionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('styleExtraction.title')}</DialogTitle>
          </DialogHeader>
          <StyleExtractionPanel
            clientId={client.id}
            onExtractionComplete={() => {
              // Close dialog after successful extraction
              setExtractionDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
