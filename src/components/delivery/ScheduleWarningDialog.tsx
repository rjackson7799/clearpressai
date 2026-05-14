import { AlertTriangleIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BilingualLabel } from '@/components/shared/BilingualLabel';
import { getHoliday } from '@/lib/schedule-warnings';
import type { SchedulingWarning } from '@/lib/types/delivery';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warnings: SchedulingWarning[];
  scheduledFor: string | null;
  onAcknowledge: () => void;
}

const WARNING_LABELS: Record<SchedulingWarning, { ja: string; en: string; detail: { ja: string; en: string } }> = {
  outside_business_hours: {
    ja: '営業時間外の送信',
    en: 'Outside business hours',
    detail: {
      ja: '指定された送信時刻は日本時間 09:00–18:00 の営業時間外です。',
      en: 'The scheduled time is outside Japan business hours (09:00–18:00 JST).',
    },
  },
  japanese_holiday: {
    ja: '日本の祝日',
    en: 'Japanese public holiday',
    detail: {
      ja: '指定された日付は日本の祝日です。',
      en: 'The scheduled date is a Japanese public holiday.',
    },
  },
};

export function ScheduleWarningDialog({
  open,
  onOpenChange,
  warnings,
  scheduledFor,
  onAcknowledge,
}: Props) {
  const holiday = getHoliday(scheduledFor);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <span className="flex items-center gap-2">
              <AlertTriangleIcon className="size-4 text-amber-500" />
              <BilingualLabel
                ja="送信タイミングの確認"
                en="Confirm send timing"
              />
            </span>
          </DialogTitle>
          <DialogDescription>
            <BilingualLabel
              ja="以下の点について続行を確認してください。確認内容は監査トレイルに記録されます。"
              en="Please confirm the following before continuing. Your acknowledgement is recorded in the audit trail."
            />
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-3">
          {warnings.map((code) => {
            const meta = WARNING_LABELS[code];
            return (
              <li
                key={code}
                className="rounded-md border bg-amber-50 dark:bg-amber-950/30 p-3 text-sm space-y-1"
              >
                <div className="font-medium">
                  <BilingualLabel ja={meta.ja} en={meta.en} />
                </div>
                <p className="text-xs text-muted-foreground">
                  <BilingualLabel ja={meta.detail.ja} en={meta.detail.en} />
                </p>
                {code === 'japanese_holiday' && holiday && (
                  <p className="text-xs">
                    {holiday.name_ja}{' '}
                    <span className="text-muted-foreground">
                      ({holiday.name_en})
                    </span>
                  </p>
                )}
              </li>
            );
          })}
        </ul>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <BilingualLabel ja="キャンセル" en="Cancel" />
          </Button>
          <Button onClick={onAcknowledge}>
            <BilingualLabel ja="このまま続行" en="Continue anyway" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
