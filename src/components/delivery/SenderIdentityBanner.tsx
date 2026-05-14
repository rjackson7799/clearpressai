import { MailIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BilingualLabel } from '@/components/shared/BilingualLabel';
import { useFirmConfig } from '@/hooks/useFirmConfig';

export function SenderIdentityBanner() {
  const { data, isPending, error } = useFirmConfig();

  if (isPending) return <Skeleton className="h-16 w-full" />;
  if (error || !data) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error?.message ?? 'firm config unavailable'}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-1">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <MailIcon className="size-3" />
        <BilingualLabel ja="送信者情報 (固定)" en="Sender (fixed)" />
      </div>
      <div>
        <span className="text-muted-foreground mr-2">From:</span>
        <span className="font-medium">{data.from_name}</span>{' '}
        <span className="text-muted-foreground">&lt;{data.from_email}&gt;</span>
      </div>
      <div>
        <span className="text-muted-foreground mr-2">Reply-To:</span>
        <span>{data.reply_to_email}</span>
      </div>
      <p className="text-xs text-muted-foreground pt-1">
        <BilingualLabel
          ja="社内BCCは自動で適用されます。"
          en="Standard internal BCC will be applied automatically."
        />
      </p>
    </div>
  );
}
