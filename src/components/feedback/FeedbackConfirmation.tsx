import { CheckCircle2Icon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  /** ISO-ish timestamp from the server */
  submittedAt: string;
  /** Sender / firm name from the snapshot — for the "from {firm}" banner */
  fromName: string;
}

function formatJp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${String(
    d.getHours(),
  ).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// Shared between the just-submitted and already-submitted states. No form,
// no AI / "generate" copy (PRD §5.5 tonal direction).
export function FeedbackConfirmation({ submittedAt, fromName }: Props) {
  return (
    <Card>
      <CardContent className="py-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-primary/10 p-4">
            <CheckCircle2Icon className="size-10 text-primary" aria-hidden />
          </div>
          <div>
            <div className="text-lg font-medium">
              フィードバックを受け付けました
            </div>
            <div className="mt-0.5 text-sm text-muted-foreground">
              Feedback received
            </div>
          </div>
          <div className="text-sm">
            <span className="text-foreground">{formatJp(submittedAt)}</span>
            <span className="ml-2 text-muted-foreground">に送信済み</span>
          </div>
          <p className="max-w-md text-sm text-muted-foreground">
            ご協力ありがとうございました。
            {fromName} よりお礼申し上げます。
            <br />
            Thank you for your feedback — {fromName}.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
