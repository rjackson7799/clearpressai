import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { LinkIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LanguageToggle } from '@/components/shared/LanguageToggle';
import { FeedbackForm } from '@/components/feedback/FeedbackForm';
import { FeedbackConfirmation } from '@/components/feedback/FeedbackConfirmation';
import { useFeedbackLoad } from '@/hooks/useFeedbackLoad';
import { useFeedbackSubmit } from '@/hooks/useFeedbackSubmit';
import { explainFeedbackError } from '@/lib/feedback-errors';

/**
 * /f/:token — public feedback page (outside AppShell + ProtectedRoute).
 *
 * Four render states keyed off useFeedbackLoad's discriminated union plus
 * a local just-submitted flag:
 *   - loading
 *   - invalid           (token_invalid, expired, format-mismatch)
 *   - already_submitted (FeedbackConfirmation with submitted_at)
 *   - ok                (FeedbackForm; transitions to FeedbackConfirmation
 *                        on successful submit)
 *
 * Header is firm-branded (snapshot.sender.from_name), NOT ClearPress
 * (PRD §5.5). No "AI" / "generate" language anywhere.
 */
export default function FeedbackPage() {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslation();
  const loadQ = useFeedbackLoad(token);
  const submitM = useFeedbackSubmit(token);

  const [justSubmittedAt, setJustSubmittedAt] = useState<string | null>(null);

  const headerName =
    loadQ.data &&
    (loadQ.data.status === 'ok' || loadQ.data.status === 'already_submitted')
      ? loadQ.data.sender.from_name
      : null;
  const projectName =
    loadQ.data &&
    (loadQ.data.status === 'ok' || loadQ.data.status === 'already_submitted')
      ? loadQ.data.project.name
      : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">
              {headerName ?? t('feedback.headerFallback')}
            </div>
            {projectName && (
              <div className="truncate text-xs text-muted-foreground">
                {projectName}
              </div>
            )}
          </div>
          <LanguageToggle />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
        {loadQ.isLoading && <LoadingState />}

        {loadQ.isError && <InvalidState />}

        {loadQ.data?.status === 'invalid' && <InvalidState />}

        {loadQ.data?.status === 'already_submitted' && (
          <FeedbackConfirmation
            submittedAt={loadQ.data.submitted_at}
            fromName={loadQ.data.sender.from_name}
          />
        )}

        {loadQ.data?.status === 'ok' && justSubmittedAt && (
          <FeedbackConfirmation
            submittedAt={justSubmittedAt}
            fromName={loadQ.data.sender.from_name}
          />
        )}

        {loadQ.data?.status === 'ok' && !justSubmittedAt && (
          <div className="space-y-6">
            <Intro projectName={loadQ.data.project.name} />
            <FeedbackForm
              loaded={loadQ.data}
              onSubmit={(input) =>
                submitM.mutate(input, {
                  onSuccess: () => {
                    setJustSubmittedAt(new Date().toISOString());
                    toast.success(t('feedback.toasts.submitted'));
                  },
                  onError: () => {
                    toast.error(t('feedback.toasts.failed'));
                  },
                })
              }
              isPending={submitM.isPending}
              errorMessage={
                submitM.isError
                  ? explainFeedbackError(
                      submitM.error instanceof Error
                        ? submitM.error.message
                        : String(submitM.error),
                    )
                  : null
              }
            />
          </div>
        )}
      </main>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function InvalidState() {
  const { t } = useTranslation();
  return (
    <Card>
      <CardContent className="py-12">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="rounded-full bg-muted p-3">
            <LinkIcon className="size-6 text-muted-foreground" aria-hidden />
          </div>
          <div className="text-base font-medium">
            {t('feedback.invalid.title')}
          </div>
          <p className="max-w-sm text-sm text-muted-foreground">
            {t('feedback.invalid.body')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function Intro({ projectName }: { projectName: string }) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardContent className="space-y-2 py-5">
        <div className="text-base font-medium">
          {t('feedback.intro.title', { project: projectName })}
        </div>
        <p className="text-sm text-muted-foreground">
          {t('feedback.intro.body')}
        </p>
      </CardContent>
    </Card>
  );
}
