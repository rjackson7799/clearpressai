/**
 * ClearPress AI - Approval History Item
 * Display a single approval record with user info, status, and feedback
 */

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ja, enUS } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from 'lucide-react';
import type { Approval } from '@/types';

interface ApprovalHistoryItemProps {
  approval: Approval;
  showVersion?: boolean;
}

const STATUS_CONFIG = {
  approved: {
    icon: CheckCircle,
    colorClass: 'bg-[var(--color-success-light)] text-[var(--color-success)]',
    iconClass: 'text-[var(--color-success)]',
  },
  rejected: {
    icon: XCircle,
    colorClass: 'bg-[var(--color-error-light)] text-[var(--color-error)]',
    iconClass: 'text-[var(--color-error)]',
  },
  changes_requested: {
    icon: AlertCircle,
    colorClass: 'bg-[var(--color-warning-light)] text-[var(--color-warning)]',
    iconClass: 'text-[var(--color-warning)]',
  },
};

export function ApprovalHistoryItem({
  approval,
  showVersion = false,
}: ApprovalHistoryItemProps) {
  const { language, t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  const config = STATUS_CONFIG[approval.status];
  const StatusIcon = config.icon;
  const dateLocale = language === 'ja' ? ja : enUS;

  const getStatusLabel = (status: Approval['status']) => {
    switch (status) {
      case 'approved':
        return t('approvals.approved');
      case 'rejected':
        return t('approvals.rejected');
      case 'changes_requested':
        return t('approvals.changesRequested');
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const hasFeedback = approval.feedback && approval.feedback.trim().length > 0;
  const feedbackPreviewLength = 100;
  const needsExpansion = hasFeedback && approval.feedback!.length > feedbackPreviewLength;

  return (
    <div className="flex gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
      {/* User Avatar */}
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarImage src={approval.user?.avatar_url} alt={approval.user?.name} />
        <AvatarFallback className="text-xs">
          {getInitials(approval.user?.name)}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm truncate">
              {approval.user?.name || t('common.unknown')}
            </span>
            <Badge variant="secondary" className={config.colorClass}>
              <StatusIcon className={`h-3 w-3 mr-1 ${config.iconClass}`} />
              {getStatusLabel(approval.status)}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(new Date(approval.created_at), {
              addSuffix: true,
              locale: dateLocale,
            })}
          </span>
        </div>

        {/* Version Info (optional) */}
        {showVersion && approval.version_id && (
          <div className="text-xs text-muted-foreground">
            {t('approvals.version')}: {approval.version_id.slice(0, 8)}
          </div>
        )}

        {/* Feedback */}
        {hasFeedback && (
          <div className="space-y-1">
            <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
              <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <p className="whitespace-pre-wrap break-words">
                {needsExpansion && !isExpanded
                  ? `${approval.feedback!.slice(0, feedbackPreviewLength)}...`
                  : approval.feedback}
              </p>
            </div>
            {needsExpansion && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    {t('approvals.collapse')}
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    {t('approvals.viewAll')}
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* No Feedback */}
        {!hasFeedback && (
          <p className="text-xs text-muted-foreground italic">
            {t('approvals.noFeedback')}
          </p>
        )}
      </div>
    </div>
  );
}

export default ApprovalHistoryItem;
