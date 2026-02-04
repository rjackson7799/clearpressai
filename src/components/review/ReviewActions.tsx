/**
 * ClearPress AI - Review Actions
 * Approve/Request Changes buttons for client review
 */

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle, MessageSquare, Loader2 } from 'lucide-react';

interface ReviewActionsProps {
  onApprove: (feedback?: string) => Promise<void>;
  onRequestChanges: (feedback: string) => Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
}

const FEEDBACK_TEMPLATES = {
  ja: [
    { id: 'tone', label: 'トーンの調整', text: 'トーンを調整してください。より[フォーマル/カジュアル]な表現が望ましいです。' },
    { id: 'detail', label: '詳細の追加', text: 'もう少し詳細な情報を追加してください。' },
    { id: 'clarity', label: '明確化', text: '一部の表現がわかりにくいです。より明確な表現に修正してください。' },
    { id: 'factual', label: '事実確認', text: '事実関係の確認をお願いします。' },
    { id: 'compliance', label: 'コンプライアンス', text: 'コンプライアンス上の問題点を修正してください。' },
  ],
  en: [
    { id: 'tone', label: 'Adjust Tone', text: 'Please adjust the tone. A more [formal/casual] approach is preferred.' },
    { id: 'detail', label: 'Add Details', text: 'Please add more detailed information.' },
    { id: 'clarity', label: 'Clarify', text: 'Some expressions are unclear. Please revise for clarity.' },
    { id: 'factual', label: 'Fact Check', text: 'Please verify the factual accuracy.' },
    { id: 'compliance', label: 'Compliance', text: 'Please address the compliance issues.' },
  ],
};

export function ReviewActions({
  onApprove,
  onRequestChanges,
  isLoading = false,
  disabled = false,
}: ReviewActionsProps) {
  const { language } = useLanguage();
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isChangesDialogOpen, setIsChangesDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const templates = FEEDBACK_TEMPLATES[language];

  const handleApprove = async () => {
    await onApprove(feedback || undefined);
    setIsApproveDialogOpen(false);
    setFeedback('');
  };

  const handleRequestChanges = async () => {
    if (!feedback.trim()) return;
    await onRequestChanges(feedback);
    setIsChangesDialogOpen(false);
    setFeedback('');
    setSelectedTemplate('');
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setFeedback(template.text);
    }
  };

  return (
    <div className="flex gap-2">
      {/* Approve Button */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="default"
            className="flex-1 bg-green-600 hover:bg-green-700"
            disabled={disabled || isLoading}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {language === 'ja' ? '承認' : 'Approve'}
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
          <Textarea
            placeholder={
              language === 'ja'
                ? 'コメント（任意）'
                : 'Comment (optional)'
            }
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsApproveDialogOpen(false)}
              disabled={isLoading}
            >
              {language === 'ja' ? 'キャンセル' : 'Cancel'}
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {language === 'ja' ? '承認する' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Changes Button */}
      <Dialog open={isChangesDialogOpen} onOpenChange={setIsChangesDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="flex-1"
            disabled={disabled || isLoading}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            {language === 'ja' ? '修正依頼' : 'Request Changes'}
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
          <div className="space-y-4">
            <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    language === 'ja' ? 'テンプレートを選択' : 'Select a template'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder={
                language === 'ja'
                  ? '修正内容を記入してください'
                  : 'Describe the changes needed'
              }
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={5}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsChangesDialogOpen(false);
                setFeedback('');
                setSelectedTemplate('');
              }}
              disabled={isLoading}
            >
              {language === 'ja' ? 'キャンセル' : 'Cancel'}
            </Button>
            <Button
              onClick={handleRequestChanges}
              disabled={isLoading || !feedback.trim()}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {language === 'ja' ? '送信' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ReviewActions;
