/**
 * ContentTypeSelector - Select content type for new content items
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Newspaper,
  MessageSquare,
  Building2,
  HelpCircle,
  Mic,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ContentType } from '@/types';

interface ContentTypeSelectorProps {
  value: ContentType;
  onChange: (value: ContentType) => void;
  disabled?: boolean;
}

const CONTENT_TYPES: { value: ContentType; icon: React.ReactNode }[] = [
  { value: 'press_release', icon: <Newspaper className="h-4 w-4" /> },
  { value: 'blog_post', icon: <FileText className="h-4 w-4" /> },
  { value: 'social_media', icon: <MessageSquare className="h-4 w-4" /> },
  { value: 'internal_memo', icon: <Building2 className="h-4 w-4" /> },
  { value: 'faq', icon: <HelpCircle className="h-4 w-4" /> },
  { value: 'executive_statement', icon: <Mic className="h-4 w-4" /> },
];

export function ContentTypeSelector({
  value,
  onChange,
  disabled = false,
}: ContentTypeSelectorProps) {
  const { t } = useLanguage();

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={t('content.contentType')} />
      </SelectTrigger>
      <SelectContent>
        {CONTENT_TYPES.map((type) => (
          <SelectItem key={type.value} value={type.value}>
            <div className="flex items-center gap-2">
              {type.icon}
              <span>{t(`content.${type.value}`)}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function getContentTypeIcon(type: ContentType): React.ReactNode {
  const typeConfig = CONTENT_TYPES.find((t) => t.value === type);
  return typeConfig?.icon ?? <FileText className="h-4 w-4" />;
}
