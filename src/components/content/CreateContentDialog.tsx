/**
 * CreateContentDialog - Dialog to create a new content item
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ContentTypeSelector } from '@/components/editor';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCreateContentItem } from '@/hooks/use-content';
import { useProjects } from '@/hooks/use-projects';
import type { ContentType } from '@/types';
import { Loader2 } from 'lucide-react';

interface CreateContentDialogProps {
  /** Project ID - if not provided, user will select from dropdown */
  projectId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Callback when content is created. When projectId prop is not provided, also returns projectId */
  onCreated: (contentId: string, projectId?: string) => void;
}

export function CreateContentDialog({
  projectId: propProjectId,
  open,
  onOpenChange,
  onCreated,
}: CreateContentDialogProps) {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ContentType>('press_release');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // Fetch projects for dropdown when no projectId prop is provided
  const { data: projectsData, isLoading: projectsLoading } = useProjects(
    { per_page: 100 },
  );

  const createMutation = useCreateContentItem();

  // Use prop projectId or selected projectId
  const effectiveProjectId = propProjectId || selectedProjectId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !effectiveProjectId) return;

    try {
      const result = await createMutation.mutateAsync({
        projectId: effectiveProjectId,
        data: {
          type,
          title: title.trim(),
        },
      });

      setTitle('');
      setType('press_release');
      setSelectedProjectId('');
      onCreated(result.id, effectiveProjectId);
    } catch {
      // Error handled by mutation
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setTitle('');
      setType('press_release');
      setSelectedProjectId('');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('content.newContent')}</DialogTitle>
            <DialogDescription>
              {t('editor.createContentDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Project selector - only show when projectId is not provided */}
            {!propProjectId && (
              <div className="space-y-2">
                <Label htmlFor="project-select">{t('projects.title')}</Label>
                <Select
                  value={selectedProjectId}
                  onValueChange={setSelectedProjectId}
                  disabled={projectsLoading}
                >
                  <SelectTrigger id="project-select">
                    <SelectValue placeholder={t('projects.selectProject')} />
                  </SelectTrigger>
                  <SelectContent>
                    {projectsData?.data.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="content-title">{t('editor.contentTitle')}</Label>
              <Input
                id="content-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('editor.contentTitlePlaceholder')}
                autoFocus={!!propProjectId}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('content.contentType')}</Label>
              <ContentTypeSelector value={type} onChange={setType} />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || !effectiveProjectId || createMutation.isPending}
            >
              {createMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {t('common.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
