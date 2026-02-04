/**
 * ClearPress AI - Comment Thread
 * List of comments with nested replies and interaction
 */

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useCreateComment,
  useUpdateComment,
  useResolveComment,
  useUnresolveComment,
  useDeleteComment,
} from '@/hooks/use-comments';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CommentForm } from './CommentForm';
import { CommentItem } from './CommentItem';
import { MessageSquare } from 'lucide-react';
import type { Comment } from '@/types';

interface CommentThreadProps {
  comments: Comment[];
  currentUserId?: string;
  contentItemId: string;
  versionId?: string;
  isLoading?: boolean;
  onCommentAdded?: () => void;
}

export function CommentThread({
  comments,
  currentUserId,
  contentItemId,
  versionId,
  isLoading = false,
  onCommentAdded,
}: CommentThreadProps) {
  const { t } = useLanguage();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Mutations
  const createComment = useCreateComment();
  const updateComment = useUpdateComment();
  const resolveComment = useResolveComment();
  const unresolveComment = useUnresolveComment();
  const deleteComment = useDeleteComment();

  // Handle new top-level comment
  const handleAddComment = async (content: string) => {
    await createComment.mutateAsync({
      content_item_id: contentItemId,
      version_id: versionId,
      content,
    });
    onCommentAdded?.();
  };

  // Handle reply to a comment
  const handleReply = async (content: string, parentId: string) => {
    await createComment.mutateAsync({
      content_item_id: contentItemId,
      version_id: versionId,
      content,
      parent_id: parentId,
    });
    setReplyingTo(null);
    onCommentAdded?.();
  };

  // Handle edit comment
  const handleEdit = async (commentId: string, content: string) => {
    await updateComment.mutateAsync({
      commentId,
      content,
      contentItemId,
    });
    setEditingId(null);
  };

  // Handle resolve
  const handleResolve = async (commentId: string) => {
    await resolveComment.mutateAsync({
      commentId,
      contentItemId,
    });
  };

  // Handle unresolve
  const handleUnresolve = async (commentId: string) => {
    await unresolveComment.mutateAsync({
      commentId,
      contentItemId,
    });
  };

  // Handle delete
  const handleDelete = async (commentId: string) => {
    await deleteComment.mutateAsync({
      commentId,
      contentItemId,
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="py-4">
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* New comment form */}
      <Card>
        <CardContent className="py-4">
          <CommentForm
            onSubmit={handleAddComment}
            isLoading={createComment.isPending}
            placeholder={t('comments.addPlaceholder')}
          />
        </CardContent>
      </Card>

      {/* Comments list */}
      {comments.length > 0 ? (
        <Card>
          <CardContent className="py-4 space-y-4">
            {comments.map((comment) => (
              <div key={comment.id}>
                {/* Top-level comment */}
                <CommentItem
                  comment={comment}
                  currentUserId={currentUserId}
                  onReply={(id) => setReplyingTo(id)}
                  onResolve={handleResolve}
                  onUnresolve={handleUnresolve}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isEditing={editingId === comment.id}
                  isEditLoading={updateComment.isPending}
                />

                {/* Nested replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-3 ml-11 space-y-3 border-l-2 border-muted pl-4">
                    {comment.replies.map((reply) => (
                      <CommentItem
                        key={reply.id}
                        comment={reply}
                        currentUserId={currentUserId}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        isNested
                        isEditing={editingId === reply.id}
                        isEditLoading={updateComment.isPending}
                      />
                    ))}
                  </div>
                )}

                {/* Reply form */}
                {replyingTo === comment.id && (
                  <div className="mt-3 ml-11 border-l-2 border-primary/30 pl-4">
                    <p className="text-xs text-muted-foreground mb-2">
                      {t('comments.replyTo').replace('{name}', comment.user?.name ?? 'Unknown')}
                    </p>
                    <CommentForm
                      onSubmit={(content) => handleReply(content, comment.id)}
                      onCancel={() => setReplyingTo(null)}
                      showCancel
                      autoFocus
                      isLoading={createComment.isPending}
                    />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        /* Empty state */
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground text-sm">
                {t('comments.empty')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default CommentThread;
