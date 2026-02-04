/**
 * ClearPress AI - Version Selector
 * Dropdown to select different content versions
 */

import { useLanguage } from '@/contexts/LanguageContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { History, Star, Clock } from 'lucide-react';
import type { ContentVersion } from '@/types';

interface VersionSelectorProps {
  versions: ContentVersion[];
  currentVersionId: string | undefined;
  onVersionChange: (versionId: string) => void;
  isLoading?: boolean;
}

export function VersionSelector({
  versions,
  currentVersionId,
  onVersionChange,
  isLoading = false,
}: VersionSelectorProps) {
  const { language } = useLanguage();

  if (versions.length <= 1) {
    return null;
  }

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

  return (
    <div className="flex items-center gap-2">
      <History className="h-4 w-4 text-muted-foreground" />
      <Select
        value={currentVersionId}
        onValueChange={onVersionChange}
        disabled={isLoading}
      >
        <SelectTrigger className="w-52">
          <SelectValue placeholder={language === 'ja' ? 'バージョン選択' : 'Select version'} />
        </SelectTrigger>
        <SelectContent>
          {versions
            .sort((a, b) => b.version_number - a.version_number)
            .map((version, index) => (
              <SelectItem key={version.id} value={version.id}>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    v{version.version_number}
                  </span>
                  {index === 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {language === 'ja' ? '最新' : 'Latest'}
                    </Badge>
                  )}
                  {version.is_milestone && (
                    <Star className="h-3 w-3 text-yellow-500" />
                  )}
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(version.created_at)}
                  </span>
                </div>
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default VersionSelector;
