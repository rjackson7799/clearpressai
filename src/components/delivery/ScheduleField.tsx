import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { BilingualLabel } from '@/components/shared/BilingualLabel';

interface Props {
  value: string | null;
  onChange: (utcIso: string | null) => void;
}

function utcIsoToJstWallclock(iso: string): string {
  const d = new Date(iso);
  const jstMs = d.getTime() + 9 * 60 * 60 * 1000;
  return new Date(jstMs).toISOString().slice(0, 16);
}

function jstWallclockToUtcIso(jstValue: string): string {
  return new Date(`${jstValue}:00+09:00`).toISOString();
}

export function ScheduleField({ value, onChange }: Props) {
  const [mode, setMode] = useState<'now' | 'schedule'>(
    value ? 'schedule' : 'now',
  );

  const jstWall = value ? utcIsoToJstWallclock(value) : '';

  const handleModeChange = (next: string) => {
    const nextMode = next as 'now' | 'schedule';
    setMode(nextMode);
    if (nextMode === 'now') {
      onChange(null);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (!v) {
      onChange(null);
      return;
    }
    onChange(jstWallclockToUtcIso(v));
  };

  return (
    <div className="space-y-3">
      <RadioGroup
        value={mode}
        onValueChange={handleModeChange}
        className="flex gap-6"
      >
        <label className="flex items-center gap-2 cursor-pointer">
          <RadioGroupItem value="now" />
          <BilingualLabel ja="今すぐ送信" en="Send now" />
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <RadioGroupItem value="schedule" />
          <BilingualLabel ja="予約送信" en="Schedule" />
        </label>
      </RadioGroup>

      {mode === 'schedule' && (
        <div className="space-y-1">
          <Input
            type="datetime-local"
            value={jstWall}
            onChange={handleDateChange}
            className="max-w-xs"
          />
          <p className="text-xs text-muted-foreground">
            <BilingualLabel ja="日本時間 (JST)" en="Japan Standard Time (JST)" />
          </p>
        </div>
      )}
    </div>
  );
}
