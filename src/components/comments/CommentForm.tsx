/**
 * ClearPress AI - Comment Form
 * Input form for new comments and replies
 */

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, X } from 'lucide-react';

interface CommentFormProps {
  onSubmit: (content: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  autoFocus?: boolean;
  onCancel?: () => void;
  showCancel?: boolean;
  initialValue?: string;
}

export function CommentForm({
  onSubmit,
  placeholder,
  isLoading = false,
  autoFocus = false,
  onCancel,
  showCancel = false,
  initialValue = '',
}: CommentFormProps) {
  const { t } = useLanguage();
  const [content, setContent] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus when requested
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Reset content when initialValue changes (for edit mode)
  useEffect(() => {
    setContent(initialValue);
  }, [initialValue]);

  const handleSubmit = () => {
    if (!content.trim() || isLoading) return;
    onSubmit(content.trim());
    setContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl + Enter to submit
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
    // Escape to cancel (if cancel is available)
    if (e.key === 'Escape' && onCancel) {
      e.preventDefault();
      onCancel();
    }
  };

  const handleCancel = () => {
    setContent('');
    onCancel?.();
  };

  return (
    <div className="flex gap-2">
      <Textarea
        ref={textareaRef}
        placeholder={placeholder ?? t('comments.addPlaceholder')}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={2}
        className="flex-1 resize-none"
        disabled={isLoading}
      />
      <div className="flex flex-col gap-1">
        <Button
          onClick={handleSubmit}
          disabled={!content.trim() || isLoading}
          size="icon"
          title={t('common.save')}
        >
          <Send className="h-4 w-4" />
        </Button>
        {showCancel && (
          <Button
            onClick={handleCancel}
            variant="outline"
            size="icon"
            title={t('comments.cancel')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default CommentForm;
