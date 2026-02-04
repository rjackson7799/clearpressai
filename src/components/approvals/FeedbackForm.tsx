/**
 * ClearPress AI - Feedback Form
 * Reusable textarea with template selection for approval feedback
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FeedbackFormProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showTemplates?: boolean;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  selectedTemplate?: string;
  onTemplateChange?: (templateId: string) => void;
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

export function FeedbackForm({
  value,
  onChange,
  placeholder,
  showTemplates = false,
  required = false,
  disabled = false,
  rows = 4,
  selectedTemplate = '',
  onTemplateChange,
}: FeedbackFormProps) {
  const { language, t } = useLanguage();
  const templates = FEEDBACK_TEMPLATES[language];

  const handleTemplateSelect = (templateId: string) => {
    onTemplateChange?.(templateId);
    const template = templates.find((tpl) => tpl.id === templateId);
    if (template) {
      onChange(template.text);
    }
  };

  const defaultPlaceholder = language === 'ja'
    ? 'フィードバックを入力...'
    : 'Enter feedback...';

  return (
    <div className="space-y-3">
      {showTemplates && (
        <div className="space-y-1.5">
          <Label className="text-sm text-muted-foreground">
            {t('approvals.selectTemplate')}
          </Label>
          <Select
            value={selectedTemplate}
            onValueChange={handleTemplateSelect}
            disabled={disabled}
          >
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
        </div>
      )}
      <div className="space-y-1.5">
        {showTemplates && (
          <Label className="text-sm text-muted-foreground">
            {t('approvals.customFeedback')}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
        <Textarea
          placeholder={placeholder || defaultPlaceholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          disabled={disabled}
          className={required && !value.trim() ? 'border-destructive/50' : ''}
        />
      </div>
    </div>
  );
}

export { FEEDBACK_TEMPLATES };
export default FeedbackForm;
