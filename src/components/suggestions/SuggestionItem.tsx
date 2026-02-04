/**
 * ClearPress AI - Suggestion Item
 * Single suggestion display with before/after and actions
 */

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check, X, MoreHorizontal, Trash2, MessageSquare } from 'lucide-react';
import type { ClientSuggestion } from '@/types';

interface SuggestionItemProps {
  suggestion: ClientSuggestion;
  onAccept?: (suggestionId: string) => void;
  onReject?: (suggestionId: string) => void;
  onDelete?: (suggestionId: string) => void;
  currentUserId?: string;
  isActionLoading?: boolean;
  canReview?: boolean;
}

export function SuggestionItem({
  suggestion,
  onAccept,
  onReject,
  onDelete,
  currentUserId,
  isActionLoading = false,
  canReview = false,
}: SuggestionItemProps) {
  const { language, t } = useLanguage();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isOwner = currentUserId === suggestion.user_id;
  const isPending = suggestion.status === 'pending';

  // Get user initials for avatar fallback
  const getInitials = (name?: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      language === 'ja' ? 'ja-JP' : 'en-US',
      {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    );
  };

  const handleDelete = () => {
    onDelete?.(suggestion.id);
    setShowDeleteDialog(false);
  };

  const getStatusBadge = () => {
    switch (suggestion.status) {
      case 'accepted':
        return (
          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
            {t('suggestions.accept')}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
            {t('suggestions.reject')}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
            {t('suggestions.pending')}
          </Badge>
        );
    }
  };

  return (
    <>
      <div className="border-b last:border-0 pb-4 last:pb-0">
        {/* Header: Avatar, Name, Timestamp, Status */}
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={suggestion.user?.avatar_url} />
            <AvatarFallback className="text-xs">
              {getInitials(suggestion.user?.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">
                {suggestion.user?.name ?? 'Unknown'}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDate(suggestion.created_at)}
              </span>
              {getStatusBadge()}
            </div>

            {/* Before/After diff display */}
            <div className="mt-3 space-y-2 text-sm">
              {/* Before text */}
              <div className="flex items-start gap-2">
                <span className="text-xs font-medium text-muted-foreground w-14 flex-shrink-0 pt-0.5">
                  {t('suggestions.before')}:
                </span>
                <span className="bg-red-50 text-red-800 px-2 py-1 rounded line-through">
                  {suggestion.before_text}
                </span>
              </div>

              {/* After text */}
              <div className="flex items-start gap-2">
                <span className="text-xs font-medium text-muted-foreground w-14 flex-shrink-0 pt-0.5">
                  {t('suggestions.after')}:
                </span>
                <span className="bg-green-50 text-green-800 px-2 py-1 rounded">
                  {suggestion.after_text}
                </span>
              </div>
            </div>

            {/* Reason if provided */}
            {suggestion.reason && (
              <div className="mt-3 flex items-start gap-2 text-xs bg-muted/50 rounded-md p-2 border-l-2 border-primary/30">
                <MessageSquare className="h-3 w-3 flex-shrink-0 mt-0.5 text-muted-foreground" />
                <div>
                  <span className="font-medium text-muted-foreground">{t('suggestions.reason')}:</span>{' '}
                  <span className="text-muted-foreground">{suggestion.reason}</span>
                </div>
              </div>
            )}

            {/* Action buttons for reviewers (PR staff) - only for pending suggestions */}
            {canReview && isPending && (
              <div className="mt-3 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAccept?.(suggestion.id)}
                  disabled={isActionLoading}
                  className="h-8 text-green-700 border-green-300 hover:bg-green-50"
                >
                  <Check className="h-3 w-3 mr-1" />
                  {t('suggestions.accept')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onReject?.(suggestion.id)}
                  disabled={isActionLoading}
                  className="h-8 text-red-700 border-red-300 hover:bg-red-50"
                >
                  <X className="h-3 w-3 mr-1" />
                  {t('suggestions.reject')}
                </Button>
              </div>
            )}
          </div>

          {/* Actions dropdown - for owner to delete pending suggestions */}
          {isOwner && isPending && onDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {language === 'ja' ? '削除' : 'Delete'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ja' ? '提案を削除' : 'Delete Suggestion'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ja'
                ? 'この提案を削除してもよろしいですか？この操作は取り消せません。'
                : 'Are you sure you want to delete this suggestion? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'ja' ? 'キャンセル' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {language === 'ja' ? '削除' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default SuggestionItem;
