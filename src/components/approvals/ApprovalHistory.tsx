/**
 * ClearPress AI - Approval History
 * List of past approvals for a content item
 */

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApprovals } from '@/hooks/use-approvals';
import { ApprovalHistoryItem } from './ApprovalHistoryItem';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { History, ChevronDown, ChevronUp } from 'lucide-react';

interface ApprovalHistoryProps {
  contentItemId: string;
  maxItems?: number;
  showEmpty?: boolean;
  showVersion?: boolean;
  title?: string;
  className?: string;
  variant?: 'card' | 'inline';
}

export function ApprovalHistory({
  contentItemId,
  maxItems = 5,
  showEmpty = true,
  showVersion = false,
  title,
  className = '',
  variant = 'card',
}: ApprovalHistoryProps) {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: approvals, isLoading, error } = useApprovals(contentItemId);

  const displayedApprovals = isExpanded
    ? approvals
    : approvals?.slice(0, maxItems);
  const hasMore = (approvals?.length ?? 0) > maxItems;

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={className}>
        {variant === 'card' ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4" />
                <Skeleton className="h-4 w-24" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`text-sm text-destructive ${className}`}>
        {t('common.error')}
      </div>
    );
  }

  // Empty state
  if (!approvals || approvals.length === 0) {
    if (!showEmpty) return null;

    const emptyContent = (
      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
        <History className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">{t('approvals.noHistory')}</p>
      </div>
    );

    if (variant === 'card') {
      return (
        <Card className={className}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" />
              {title || t('approvals.history')}
            </CardTitle>
          </CardHeader>
          <CardContent>{emptyContent}</CardContent>
        </Card>
      );
    }

    return <div className={className}>{emptyContent}</div>;
  }

  // Content
  const historyContent = (
    <div className="space-y-2">
      {displayedApprovals?.map((approval) => (
        <ApprovalHistoryItem
          key={approval.id}
          approval={approval}
          showVersion={showVersion}
        />
      ))}
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              {t('approvals.collapse')}
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              {t('approvals.viewAll')} ({approvals.length})
            </>
          )}
        </Button>
      )}
    </div>
  );

  if (variant === 'card') {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" />
            {title || t('approvals.history')}
            {approvals.length > 0 && (
              <span className="text-xs font-normal text-muted-foreground">
                ({approvals.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>{historyContent}</CardContent>
      </Card>
    );
  }

  return <div className={className}>{historyContent}</div>;
}

export default ApprovalHistory;
