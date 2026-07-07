import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { pickLang } from '@/lib/bilingual';
import { TARGET_AUDIENCES } from '@/lib/project-options';
import type { TargetAudience } from '@/types/domain';

interface Props {
  value: TargetAudience;
  onChange: (value: TargetAudience) => void;
  disabled?: boolean;
  'aria-labelledby'?: string;
}

// Single-select audience "master control" chips (radio semantics).
// Badge-as-toggle, mirroring the FeedbackChipGroup interaction/a11y.
export function AudienceChips({
  value,
  onChange,
  disabled,
  ...aria
}: Props) {
  const { i18n } = useTranslation();
  return (
    <div
      role="radiogroup"
      aria-labelledby={aria['aria-labelledby']}
      className="flex flex-wrap gap-2"
    >
      {TARGET_AUDIENCES.map((option) => {
        const active = option.value === value;
        return (
          <Badge
            key={option.value}
            variant={active ? 'default' : 'outline'}
            role="radio"
            aria-checked={active}
            tabIndex={disabled ? -1 : 0}
            className={`cursor-pointer select-none px-3 py-1 text-sm ${
              disabled ? 'pointer-events-none opacity-50' : ''
            }`}
            onClick={() => {
              if (!disabled) onChange(option.value);
            }}
            onKeyDown={(e) => {
              if (disabled) return;
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onChange(option.value);
              }
            }}
          >
            {pickLang(i18n.language, option.ja, option.en)}
          </Badge>
        );
      })}
    </div>
  );
}
