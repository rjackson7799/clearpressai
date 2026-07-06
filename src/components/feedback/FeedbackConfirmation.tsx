import { useTranslation } from 'react-i18next';
import { CheckCircle2Icon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  /** ISO-ish timestamp from the server */
  submittedAt: string;
  /** Sender / firm name from the snapshot — for the "from {firm}" banner */
  fromName: string;
}

// Shared between the just-submitted and already-submitted states. No form,
// no AI / "generate" copy (PRD §5.5 tonal direction).
export function FeedbackConfirmation({ submittedAt, fromName }: Props) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith('ja') ? 'ja-JP' : 'en-US';
  const d = new Date(submittedAt);
  const dateLabel = Number.isNaN(d.getTime())
    ? submittedAt
    : new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);

  return (
    <Card>
      <CardContent className="py-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-primary/10 p-4">
            <CheckCircle2Icon className="size-10 text-primary" aria-hidden />
          </div>
          <div className="text-lg font-medium">
            {t('feedback.confirmation.title')}
          </div>
          <div className="text-sm text-muted-foreground">
            {t('feedback.confirmation.submittedAt', { date: dateLabel })}
          </div>
          <p className="max-w-md text-sm text-muted-foreground">
            {t('feedback.confirmation.thanks', { firm: fromName })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
