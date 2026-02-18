/**
 * ClearPress AI - Project Content Section
 * Section displaying content items for a project
 */

import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useContentItems } from '@/hooks/use-content';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Plus, ChevronRight } from 'lucide-react';
import type { ContentItem, ContentStatus, ContentType } from '@/types';

interface ProjectContentSectionProps {
  projectId: string;
  onCreateContent?: () => void;
}

// Status badge colors
const STATUS_STYLES: Record<ContentStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-700',
  in_review: 'bg-amber-100 text-amber-700',
  needs_revision: 'bg-orange-100 text-orange-700',
  approved: 'bg-green-100 text-green-700',
};

export function ProjectContentSection({
  projectId,
  onCreateContent,
}: ProjectContentSectionProps) {
  const { t } = useLanguage();
  const { isPRAdmin } = useAuth();
  const { data: contentItems, isLoading } = useContentItems(projectId);

  // Get content type display name
  const getContentTypeName = (type: ContentType): string => {
    return t(`content.${type}`);
  };

  // Get status display name
  const getStatusName = (status: ContentStatus): string => {
    return t(`content.status_${status}`);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-400" />
            {t('projects.contentItems')}
            {contentItems && (
              <Badge variant="secondary" className="ml-2">
                {contentItems.data.length}
              </Badge>
            )}
          </CardTitle>
          {isPRAdmin && onCreateContent && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCreateContent}
              className="h-8"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('content.newContent')}
            </Button>
          )}
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-5">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : contentItems && contentItems.data.length > 0 ? (
          <div className="space-y-1">
            {contentItems.data.map((item: ContentItem) => (
              <Link
                key={item.id}
                to={`/pr/projects/${projectId}/content/${item.id}`}
                className="flex items-center justify-between py-3 px-3 -mx-3 rounded-lg hover:bg-gray-50 group"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {getContentTypeName(item.type)}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Badge
                    variant="secondary"
                    className={`${STATUS_STYLES[item.status]} text-xs`}
                  >
                    {getStatusName(item.status)}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">{t('projects.noContent')}</p>
            {isPRAdmin && onCreateContent && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCreateContent}
                className="mt-3"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('content.newContent')}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
