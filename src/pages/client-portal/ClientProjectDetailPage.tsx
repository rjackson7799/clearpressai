/**
 * ClearPress AI - Client Portal Project Detail Page
 * Shows project details and content items for review
 */

import { Link, useParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProject } from '@/hooks/use-projects';
import { useContentItems } from '@/hooks/use-content';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  FileText,
  Calendar,
  Shield,
  Edit3,
} from 'lucide-react';
import type { ContentStatus, ContentType } from '@/types';

const CONTENT_TYPE_LABELS: Record<ContentType, { ja: string; en: string }> = {
  press_release: { ja: 'プレスリリース', en: 'Press Release' },
  blog_post: { ja: 'ブログ記事', en: 'Blog Post' },
  social_media: { ja: 'ソーシャルメディア', en: 'Social Media' },
  internal_memo: { ja: '社内文書', en: 'Internal Memo' },
  faq: { ja: 'FAQ', en: 'FAQ' },
  executive_statement: { ja: '経営者声明', en: 'Executive Statement' },
};

const CONTENT_STATUS_CONFIG: Record<
  ContentStatus,
  { label: { ja: string; en: string }; color: string; icon: React.ElementType }
> = {
  draft: {
    label: { ja: '下書き', en: 'Draft' },
    color: 'bg-gray-100 text-gray-800',
    icon: Edit3,
  },
  submitted: {
    label: { ja: '提出済み', en: 'Submitted' },
    color: 'bg-blue-100 text-blue-800',
    icon: FileText,
  },
  in_review: {
    label: { ja: 'レビュー待ち', en: 'In Review' },
    color: 'bg-purple-100 text-purple-800',
    icon: AlertCircle,
  },
  needs_revision: {
    label: { ja: '修正依頼', en: 'Needs Revision' },
    color: 'bg-orange-100 text-orange-800',
    icon: AlertCircle,
  },
  approved: {
    label: { ja: '承認済み', en: 'Approved' },
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
  },
};

export function ClientProjectDetailPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const { language } = useLanguage();

  // Fetch project details
  const { data: project, isLoading: isLoadingProject, error: projectError } = useProject(projectId);

  // Fetch content items for the project
  const { data: contentData, isLoading: isLoadingContent } = useContentItems(projectId);

  const isLoading = isLoadingProject || isLoadingContent;
  const contentItems = contentData?.data ?? [];

  // Filter to show items that are reviewable (in_review status)
  const reviewableItems = contentItems.filter((item) => item.status === 'in_review');
  const otherItems = contentItems.filter((item) => item.status !== 'in_review');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="space-y-4">
        <Link to="/client/projects">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === 'ja' ? '戻る' : 'Back'}
          </Button>
        </Link>
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 mx-auto text-destructive mb-2" />
              <p className="text-muted-foreground">
                {language === 'ja'
                  ? 'プロジェクトが見つかりませんでした'
                  : 'Project not found'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Back button */}
      <Link to="/client/projects">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {language === 'ja' ? '戻る' : 'Back'}
        </Button>
      </Link>

      {/* Project header */}
      <Card>
        <CardContent className="py-4">
          <h1 className="text-xl font-semibold mb-2">{project.name}</h1>
          <p className="text-sm text-muted-foreground mb-3">{project.brief}</p>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {project.target_date && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {new Date(project.target_date).toLocaleDateString(
                  language === 'ja' ? 'ja-JP' : 'en-US'
                )}
              </span>
            )}
            <Badge variant="secondary">
              {contentItems.length}{' '}
              {language === 'ja' ? 'コンテンツ' : 'content items'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Items needing review */}
      {reviewableItems.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-purple-600" />
              {language === 'ja' ? 'レビュー待ち' : 'Awaiting Your Review'}
              <Badge variant="secondary" className="ml-auto">
                {reviewableItems.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {reviewableItems.map((item) => {
              const typeLabel = CONTENT_TYPE_LABELS[item.type];
              const complianceScore = (item as { current_version?: { compliance_score?: number } }).current_version?.compliance_score;

              return (
                <Link
                  key={item.id}
                  to={`/client/projects/${projectId}/content/${item.id}`}
                >
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {typeLabel[language]}
                        </Badge>
                        {complianceScore !== undefined && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Shield className="h-3 w-3" />
                            {complianceScore}%
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Other items */}
      {otherItems.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {language === 'ja' ? 'その他のコンテンツ' : 'Other Content'}
              <Badge variant="secondary" className="ml-auto">
                {otherItems.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {otherItems.map((item) => {
              const typeLabel = CONTENT_TYPE_LABELS[item.type];
              const statusConfig = CONTENT_STATUS_CONFIG[item.status];
              const StatusIcon = statusConfig.icon;

              return (
                <Link
                  key={item.id}
                  to={`/client/projects/${projectId}/content/${item.id}`}
                >
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {typeLabel[language]}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={`${statusConfig.color} text-xs`}
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label[language]}
                        </Badge>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {contentItems.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {language === 'ja'
                  ? 'コンテンツはまだありません'
                  : 'No content items yet'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ClientProjectDetailPage;
