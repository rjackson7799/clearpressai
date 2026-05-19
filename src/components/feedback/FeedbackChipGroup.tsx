import { useState } from 'react';
import { PlusIcon, XIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ChipPreset } from './feedback-chip-presets';

interface Props {
  presets: readonly ChipPreset[];
  value: readonly string[];
  onChange: (next: string[]) => void;
  max: number;
  maxLength: number;
  disabled?: boolean;
  /** id for accessibility — paired with a sibling label */
  ariaLabelledBy?: string;
}

// Multi-select chips with preset toggles + a custom-add input. Stored
// values are the chip labels (Japanese form) — matches what the LLM
// reads in T4's user message and what the firm UI displays in T7.
export function FeedbackChipGroup({
  presets,
  value,
  onChange,
  max,
  maxLength,
  disabled = false,
  ariaLabelledBy,
}: Props) {
  const [draft, setDraft] = useState('');

  const isFull = value.length >= max;
  const presetActive = (preset: ChipPreset) => value.includes(preset.ja);

  function togglePreset(preset: ChipPreset) {
    if (disabled) return;
    if (presetActive(preset)) {
      onChange(value.filter((v) => v !== preset.ja));
    } else if (!isFull) {
      onChange([...value, preset.ja]);
    }
  }

  function addCustom() {
    if (disabled) return;
    const trimmed = draft.trim();
    if (!trimmed || trimmed.length > maxLength) return;
    if (value.includes(trimmed)) {
      setDraft('');
      return;
    }
    if (!isFull) {
      onChange([...value, trimmed]);
      setDraft('');
    }
  }

  function removeChip(chip: string) {
    if (disabled) return;
    onChange(value.filter((v) => v !== chip));
  }

  return (
    <div aria-labelledby={ariaLabelledBy} className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <Badge
            key={p.id}
            variant={presetActive(p) ? 'default' : 'outline'}
            className={`cursor-pointer select-none px-3 py-1 text-sm transition-opacity ${
              disabled ? 'pointer-events-none opacity-50' : ''
            } ${isFull && !presetActive(p) ? 'opacity-50' : ''}`}
            onClick={() => togglePreset(p)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                togglePreset(p);
              }
            }}
          >
            <span>{p.ja}</span>
            <span className="ml-1.5 text-xs opacity-70">{p.en}</span>
          </Badge>
        ))}
      </div>

      {value.filter((c) => !presets.some((p) => p.ja === c)).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value
            .filter((c) => !presets.some((p) => p.ja === c))
            .map((c) => (
              <Badge key={c} variant="secondary" className="px-3 py-1 text-sm">
                <span>{c}</span>
                <button
                  type="button"
                  onClick={() => removeChip(c)}
                  className="ml-1.5 rounded hover:bg-muted-foreground/20"
                  aria-label={`Remove ${c}`}
                  disabled={disabled}
                >
                  <XIcon className="size-3" />
                </button>
              </Badge>
            ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={maxLength}
          disabled={disabled || isFull}
          placeholder="他のキーワードを追加 / Add custom"
          className="text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addCustom();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addCustom}
          disabled={disabled || isFull || draft.trim().length === 0}
        >
          <PlusIcon className="size-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {value.length} / {max}
      </p>
    </div>
  );
}

