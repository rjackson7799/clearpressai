/**
 * ClearPress AI - Client Portal Content Review Page
 * Precision Clarity Design System
 *
 * Full review interface with line-style tabs
 * Frosted glass action bar
 * Vermillion approval buttons
 */

import { useState, useRef, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useContentItem } from '@/hooks/use-content';
import { useVersions } from '@/hooks/use-versions';
import { useComments } from '@/hooks/use-comments';
import { useSuggestions } from '@/hooks/use-suggestions';
import { useCommentsRealtime } from '@/hooks/use-comments-realtime';
import { useContentRealtime } from '@/hooks/use-content-realtime';
import {
  DocumentViewer,
  ComplianceScoreDisplay,
  VersionSelector,
} from '@/components/review';
import { CommentThread } from '@/components/comments';
import { SuggestionPanel } from '@/components/suggestions';
import { ApprovalButtons, ApprovalHistory } from '@/components/approvals';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  AlertCircle,
  MessageSquare,
  FileText,
  GitCompareArrows,
  History,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { LAYOUT } from '@/lib/constants';
import type { ContentStatus, ContentType, StructuredContent, ComplianceDetails } from '@/types';

const CONTENT_TYPE_LABELS: Record<ContentType, { ja: string; en: string }> = {
  press_release: { ja: 'プレスリリース', en: 'Press Release' },
  blog_post: { ja: 'ブログ記事', en: 'Blog Post' },
  social_media: { ja: 'ソーシャルメディア', en: 'Social Media' },
  internal_memo: { ja: '社内文書', en: 'Internal Memo' },
  faq: { ja: 'FAQ', en: 'FAQ' },
  executive_statement: { ja: '経営者声明', en: 'Executive Statement' },
};

const STATUS_LABELS: Record<ContentStatus, { ja: string; en: string }> = {
  draft: { ja: '下書き', en: 'Draft' },
  submitted: { ja: '提出済み', en: 'Submitted' },
  in_review: { ja: 'レビュー待ち', en: 'In Review' },
  needs_revision: { ja: '修正依頼', en: 'Needs Revision' },
  approved: { ja: '承認済み', en: 'Approved' },
};

// Status badge variant mapping
const STATUS_BADGE_VARIANT: Record<ContentStatus, string> = {
  draft: 'draft',
  submitted: 'in-progress',
  in_review: 'in-review',
  needs_revision: 'needs-revision',
  approved: 'approved',
};

// Tab configuration
const TABS = [
  { value: 'content', icon: FileText, labelJa: 'コンテンツ', labelEn: 'Content' },
  { value: 'suggestions', icon: GitCompareArrows, labelJa: '提案', labelEn: 'Suggestions' },
  { value: 'comments', icon: MessageSquare, labelJa: 'コメント', labelEn: 'Comments' },
  { value: 'history', icon: History, labelJa: '履歴', labelEn: 'History' },
] as const;

// Custom line-style tabs component
function LineTabs({
  value,
  onValueChange,
  language,
  suggestionsCount,
  commentsCount,
}: {
  value: string;
  onValueChange: (value: string) => void;
  language: 'ja' | 'en';
  suggestionsCount: number;
  commentsCount: number;
}) {
  const tabsRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!tabsRef.current) return;

    const activeTab = tabsRef.current.querySelector(`[data-value="${value}"]`) as HTMLElement;
    if (activeTab) {
      setIndicatorStyle({
        width: activeTab.offsetWidth,
        transform: `translateX(${activeTab.offsetLeft}px)`,
      });
    }
  }, [value]);

  const getBadgeCount = (tabValue: string): number | null => {
    if (tabValue === 'suggestions' && suggestionsCount > 0) return suggestionsCount;
    if (tabValue === 'comments' && commentsCount > 0) return commentsCount;
    return null;
  };

  return (
    <div className="relative" ref={tabsRef}>
      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => {
          const isActive = value === tab.value;
          const Icon = tab.icon;
          const badgeCount = getBadgeCount(tab.value);

          return (
            <button
              key={tab.value}
              data-value={tab.value}
              onClick={() => onValueChange(tab.value)}
              className={cn(
                'relative flex items-center gap-1.5 px-4 py-3 text-sm font-medium',
                'transition-colors duration-150',
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground/80'
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4',
                  isActive && 'text-primary'
                )}
              />
              <span className="hidden sm:inline">
                {language === 'ja' ? tab.labelJa : tab.labelEn}
              </span>
              {badgeCount !== null && (
                <Badge
                  variant={isActive ? 'vermillion' : 'secondary'}
                  size="sm"
                  className="ml-0.5"
                >
                  {badgeCount}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* Animated underline indicator */}
      <div
        className={cn(
          'absolute bottom-0 h-0.5 bg-primary rounded-full',
          'transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]'
        )}
        style={indicatorStyle}
      />
    </div>
  );
}

export function ContentReviewPage() {
  const { projectId, contentId } = useParams<{
    projectId: string;
    contentId: string;
  }>();
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [selectedVersionId, setSelectedVersionId] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState('content');

  // Fetch content item
  const {
    data: contentItem,
    isLoading: isLoadingContent,
    error: contentError,
  } = useContentItem(contentId);

  // Fetch versions
  const { data: versions, isLoading: isLoadingVersions } = useVersions(contentId);

  // Fetch comments
  const { data: comments, isLoading: isLoadingComments } = useComments(contentId);

  // Fetch suggestions
  const { data: suggestions, isLoading: isLoadingSuggestions } = useSuggestions(contentId);

  // Real-time subscriptions for collaborative review
  useCommentsRealtime({
    contentItemId: contentId!,
    onNewComment: (comment) => {
      if (comment.user_id !== user?.id) {
        toast.info(language === 'ja' ? '新しいコメントがあります' : 'New comment added');
      }
    },
  });

  useContentRealtime({
    contentItemId: contentId,
    onStatusChange: (_item, _oldStatus, newStatus) => {
      const label = STATUS_LABELS[newStatus as ContentStatus];
      toast.info(
        language === 'ja'
          ? `ステータスが「${label?.ja}」に変更されました`
          : `Status changed to "${label?.en}"`
      );
    },
  });

  const isLoading = isLoadingContent || isLoadingVersions;

  // Get the current version to display
  const currentVersion =
    versions?.find((v) => v.id === selectedVersionId) ??
    versions?.find((v) => v.id === contentItem?.current_version_id) ??
    versions?.[0];

  // Set initial version when loaded
  if (!selectedVersionId && currentVersion && !isLoading) {
    setSelectedVersionId(currentVersion.id);
  }

  const handleApprovalSuccess = () => {
    navigate(`/client/projects/${projectId}`);
  };

  // Count pending suggestions
  const pendingSuggestionsCount = suggestions?.filter((s) => s.status === 'pending').length ?? 0;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-up">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (contentError || !contentItem) {
    return (
      <div className="space-y-6">
        <Link to={`/client/projects/${projectId}`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {language === 'ja' ? '戻る' : 'Back'}
          </Button>
        </Link>
        <Card variant="elevated">
          <CardContent className="py-12">
            <div className="text-center">
              <AlertCircle className="h-10 w-10 mx-auto text-destructive/60 mb-3" />
              <p className="text-muted-foreground font-display">
                {language === 'ja'
                  ? 'コンテンツが見つかりませんでした'
                  : 'Content not found'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const typeLabel = CONTENT_TYPE_LABELS[contentItem.type];
  const statusLabel = STATUS_LABELS[contentItem.status];
  const canReview = contentItem.status === 'in_review';
  const statusVariant = STATUS_BADGE_VARIANT[contentItem.status];

  return (
    <div className="space-y-6 pb-32">
      {/* Back button */}
      <Link to={`/client/projects/${projectId}`} className="inline-block animate-fade-up">
        <Button variant="ghost" size="sm" className="gap-2 hover:gap-3 transition-all">
          <ArrowLeft className="h-4 w-4" />
          {language === 'ja' ? '戻る' : 'Back'}
        </Button>
      </Link>

      {/* Header card */}
      <Card variant="elevated" padding="compact" className="animate-fade-up">
        <CardContent className="py-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <Badge variant="outline" className="font-medium">
              {typeLabel[language]}
            </Badge>
            <Badge
              variant={statusVariant as 'in-review' | 'approved' | 'draft' | 'in-progress' | 'needs-revision'}
            >
              {statusLabel[language]}
            </Badge>
          </div>

          <h1 className="text-xl font-display font-semibold tracking-tight mb-4">
            {contentItem.title}
          </h1>

          {/* Version selector */}
          {versions && versions.length > 1 && (
            <div className="pt-3 border-t border-border/50">
              <VersionSelector
                versions={versions}
                currentVersionId={selectedVersionId}
                onVersionChange={setSelectedVersionId}
                isLoading={isLoadingVersions}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Line-style tabs */}
      <div className="animate-fade-up" style={{ animationDelay: '50ms' }}>
        <LineTabs
          value={activeTab}
          onValueChange={setActiveTab}
          language={language}
          suggestionsCount={pendingSuggestionsCount}
          commentsCount={comments?.length ?? 0}
        />
      </div>

      {/* Tab content */}
      <div className="animate-fade-up" style={{ animationDelay: '100ms' }}>
        {activeTab === 'content' && (
          <div className="space-y-6">
            {/* Compliance Score */}
            <ComplianceScoreDisplay
              score={currentVersion?.compliance_score}
              details={currentVersion?.compliance_details as ComplianceDetails | undefined}
            />

            {/* Document Viewer */}
            <Card variant="elevated" padding="none">
              <CardContent className="p-0">
                <DocumentViewer
                  content={currentVersion?.content as StructuredContent | undefined}
                  isLoading={isLoadingVersions}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'suggestions' && (
          <SuggestionPanel
            suggestions={suggestions ?? []}
            currentUserId={user?.id}
            contentItemId={contentId!}
            isLoading={isLoadingSuggestions}
            canReview={false}
          />
        )}

        {activeTab === 'comments' && (
          <CommentThread
            comments={comments ?? []}
            currentUserId={user?.id}
            contentItemId={contentId!}
            versionId={currentVersion?.id}
            isLoading={isLoadingComments}
          />
        )}

        {activeTab === 'history' && (
          <ApprovalHistory
            contentItemId={contentId!}
            variant="inline"
            showVersion
          />
        )}
      </div>

      {/* Fixed bottom action bar (only for in_review status) */}
      {canReview && currentVersion && (
        <div
          className={cn(
            'fixed left-0 right-0 z-40',
            'glass border-t border-border/30',
            'shadow-[0_-4px_20px_rgba(0,0,0,0.08)]'
          )}
          style={{
            bottom: LAYOUT.BOTTOM_NAV_HEIGHT,
            paddingLeft: 'env(safe-area-inset-left)',
            paddingRight: 'env(safe-area-inset-right)',
          }}
        >
          <div
            className="p-4 lg:ml-[260px]"
          >
            <div className="max-w-2xl mx-auto">
              <ApprovalButtons
                contentItemId={contentId!}
                versionId={currentVersion.id}
                onSuccess={handleApprovalSuccess}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ContentReviewPage;
