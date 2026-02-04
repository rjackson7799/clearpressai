/**
 * ClearPress AI - Comment Item
 * Single comment display with actions
 */

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { CommentForm } from './CommentForm';
import {
  MoreHorizontal,
  Reply,
  Pencil,
  Trash2,
  CheckCircle,
  RotateCcw,
  Quote,
} from 'lucide-react';
import type { Comment } from '@/types';

interface CommentItemProps {
  comment: Comment;
  currentUserId?: string;
  onReply?: (commentId: string) => void;
  onResolve?: (commentId: string) => void;
  onUnresolve?: (commentId: string) => void;
  onEdit?: (commentId: string, content: string) => void;
  onDelete?: (commentId: string) => void;
  isNested?: boolean;
  isEditing?: boolean;
  isEditLoading?: boolean;
}

export function CommentItem({
  comment,
  currentUserId,
  onReply,
  onResolve,
  onUnresolve,
  onEdit,
  onDelete,
  isNested = false,
  isEditing = false,
  isEditLoading = false,
}: CommentItemProps) {
  const { language, t } = useLanguage();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [localIsEditing, setLocalIsEditing] = useState(isEditing);

  const isOwner = currentUserId === comment.user_id;
  const hasQuotedText = comment.position?.selected_text;

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

  const handleEditSubmit = (content: string) => {
    onEdit?.(comment.id, content);
    setLocalIsEditing(false);
  };

  const handleEditCancel = () => {
    setLocalIsEditing(false);
  };

  const handleDelete = () => {
    onDelete?.(comment.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className={`${isNested ? '' : 'border-b last:border-0 pb-4 last:pb-0'}`}>
        {/* Header: Avatar, Name, Timestamp, Badge, Actions */}
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={comment.user?.avatar_url} />
            <AvatarFallback className="text-xs">
              {getInitials(comment.user?.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">
                {comment.user?.name ?? 'Unknown'}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDate(comment.created_at)}
              </span>
              {comment.resolved && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  {t('comments.resolved')}
                </Badge>
              )}
            </div>

            {/* Quoted text (for inline comments) */}
            {hasQuotedText && (
              <div className="mt-2 mb-2 flex items-start gap-2 text-xs bg-muted/50 rounded-md p-2 border-l-2 border-primary/30">
                <Quote className="h-3 w-3 flex-shrink-0 mt-0.5 text-muted-foreground" />
                <span className="text-muted-foreground italic line-clamp-2">
                  {comment.position?.selected_text}
                </span>
              </div>
            )}

            {/* Content or Edit Form */}
            {localIsEditing ? (
              <div className="mt-2">
                <CommentForm
                  onSubmit={handleEditSubmit}
                  onCancel={handleEditCancel}
                  showCancel
                  autoFocus
                  initialValue={comment.content}
                  isLoading={isEditLoading}
                />
              </div>
            ) : (
              <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
            )}
          </div>

          {/* Actions dropdown */}
          {!localIsEditing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">{t('comments.actions')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* Reply - only for top-level comments */}
                {!isNested && onReply && (
                  <DropdownMenuItem onClick={() => onReply(comment.id)}>
                    <Reply className="h-4 w-4 mr-2" />
                    {t('comments.reply')}
                  </DropdownMenuItem>
                )}

                {/* Resolve/Unresolve - only for top-level comments */}
                {!isNested && (
                  <>
                    {comment.resolved && onUnresolve ? (
                      <DropdownMenuItem onClick={() => onUnresolve(comment.id)}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        {t('comments.unresolve')}
                      </DropdownMenuItem>
                    ) : onResolve ? (
                      <DropdownMenuItem onClick={() => onResolve(comment.id)}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {t('comments.resolve')}
                      </DropdownMenuItem>
                    ) : null}
                  </>
                )}

                {/* Edit - only for own comments */}
                {isOwner && onEdit && (
                  <>
                    {(!isNested || onReply) && <DropdownMenuSeparator />}
                    <DropdownMenuItem onClick={() => setLocalIsEditing(true)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      {t('comments.edit')}
                    </DropdownMenuItem>
                  </>
                )}

                {/* Delete - only for own comments */}
                {isOwner && onDelete && (
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('comments.delete')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('comments.delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('comments.deleteConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('comments.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('comments.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default CommentItem;
