/**
 * ClearPress AI - Suggestion Mode Toggle
 * Toggle switch for enabling suggestion mode in content viewer
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PenLine } from 'lucide-react';

interface SuggestionModeToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  pendingCount?: number;
  disabled?: boolean;
}

export function SuggestionModeToggle({
  enabled,
  onToggle,
  pendingCount = 0,
  disabled = false,
}: SuggestionModeToggleProps) {
  const { language, t } = useLanguage();

  const tooltipText =
    language === 'ja'
      ? '提案モードを有効にすると、テキストを選択して編集提案を作成できます'
      : 'Enable suggestion mode to select text and create edit suggestions';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
            <div className="flex items-center gap-2 flex-1">
              <PenLine className="h-4 w-4 text-muted-foreground" />
              <Label
                htmlFor="suggestion-mode"
                className="text-sm font-medium cursor-pointer"
              >
                {t('suggestions.mode')}
              </Label>
              {pendingCount > 0 && (
                <Badge
                  variant="secondary"
                  className="h-5 px-1.5 bg-amber-100 text-amber-800"
                >
                  {pendingCount}
                </Badge>
              )}
            </div>
            <Switch
              id="suggestion-mode"
              checked={enabled}
              onCheckedChange={onToggle}
              disabled={disabled}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="text-xs">{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default SuggestionModeToggle;
