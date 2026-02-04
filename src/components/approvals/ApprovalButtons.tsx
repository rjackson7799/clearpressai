/**
 * ClearPress AI - Approval Buttons
 * Self-contained approve/reject buttons with dialogs and feedback form
 */

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApproveContent, useRequestChanges } from '@/hooks/use-approvals';
import { FeedbackForm } from './FeedbackForm';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CheckCircle, MessageSquare, Loader2 } from 'lucide-react';

interface ApprovalButtonsProps {
  contentItemId: string;
  versionId: string;
  onSuccess?: () => void;
  layout?: 'horizontal' | 'vertical' | 'stacked';
  size?: 'sm' | 'default' | 'lg';
  disabled?: boolean;
  showLabels?: boolean;
}

export function ApprovalButtons({
  contentItemId,
  versionId,
  onSuccess,
  layout = 'horizontal',
  size = 'default',
  disabled = false,
  showLabels = true,
}: ApprovalButtonsProps) {
  const { language, t } = useLanguage();
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isChangesDialogOpen, setIsChangesDialogOpen] = useState(false);
  const [approveFeedback, setApproveFeedback] = useState('');
  const [changesFeedback, setChangesFeedback] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const approveContent = useApproveContent();
  const requestChanges = useRequestChanges();

  const isLoading = approveContent.isPending || requestChanges.isPending;

  const handleApprove = async () => {
    await approveContent.mutateAsync({
      contentItemId,
      versionId,
      feedback: approveFeedback || undefined,
    });
    setIsApproveDialogOpen(false);
    setApproveFeedback('');
    onSuccess?.();
  };

  const handleRequestChanges = async () => {
    if (!changesFeedback.trim()) return;
    await requestChanges.mutateAsync({
      contentItemId,
      versionId,
      feedback: changesFeedback,
    });
    setIsChangesDialogOpen(false);
    setChangesFeedback('');
    setSelectedTemplate('');
    onSuccess?.();
  };

  const handleApproveDialogClose = (open: boolean) => {
    setIsApproveDialogOpen(open);
    if (!open) {
      setApproveFeedback('');
    }
  };

  const handleChangesDialogClose = (open: boolean) => {
    setIsChangesDialogOpen(open);
    if (!open) {
      setChangesFeedback('');
      setSelectedTemplate('');
    }
  };

  // Layout classes
  const containerClass = {
    horizontal: 'flex flex-row gap-2',
    vertical: 'flex flex-col gap-2',
    stacked: 'grid grid-cols-2 gap-2',
  }[layout];

  // Size classes for buttons
  const sizeClass = {
    sm: 'h-8 px-3 text-xs',
    default: '',
    lg: 'h-11 px-6',
  }[size];

  const buttonClass = layout === 'horizontal' || layout === 'stacked'
    ? 'flex-1'
    : 'w-full';

  return (
    <div className={containerClass}>
      {/* Approve Button */}
      <Dialog open={isApproveDialogOpen} onOpenChange={handleApproveDialogClose}>
        <DialogTrigger asChild>
          <Button
            variant="default"
            className={`${buttonClass} ${sizeClass} bg-[var(--color-success)] hover:bg-[var(--color-success)]/90`}
            disabled={disabled || isLoading}
          >
            <CheckCircle className="h-4 w-4" />
            {showLabels && <span className="ml-2">{t('approvals.approve')}</span>}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'ja' ? 'コンテンツを承認' : 'Approve Content'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ja'
                ? 'このコンテンツを承認しますか？任意でコメントを追加できます。'
                : 'Do you want to approve this content? You can optionally add a comment.'}
            </DialogDescription>
          </DialogHeader>
          <FeedbackForm
            value={approveFeedback}
            onChange={setApproveFeedback}
            placeholder={
              language === 'ja' ? 'コメント（任意）' : 'Comment (optional)'
            }
            disabled={isLoading}
            rows={3}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleApproveDialogClose(false)}
              disabled={isLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isLoading}
              className="bg-[var(--color-success)] hover:bg-[var(--color-success)]/90"
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('review.approve')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Changes Button */}
      <Dialog open={isChangesDialogOpen} onOpenChange={handleChangesDialogClose}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className={`${buttonClass} ${sizeClass}`}
            disabled={disabled || isLoading}
          >
            <MessageSquare className="h-4 w-4" />
            {showLabels && <span className="ml-2">{t('approvals.requestChanges')}</span>}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'ja' ? '修正を依頼' : 'Request Changes'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ja'
                ? '修正してほしい内容を記入してください。'
                : 'Please describe what changes are needed.'}
            </DialogDescription>
          </DialogHeader>
          <FeedbackForm
            value={changesFeedback}
            onChange={setChangesFeedback}
            showTemplates
            required
            disabled={isLoading}
            rows={5}
            selectedTemplate={selectedTemplate}
            onTemplateChange={setSelectedTemplate}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleChangesDialogClose(false)}
              disabled={isLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleRequestChanges}
              disabled={isLoading || !changesFeedback.trim()}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('common.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ApprovalButtons;
