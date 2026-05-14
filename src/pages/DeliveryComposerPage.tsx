import { Link, Navigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BilingualLabel } from '@/components/shared/BilingualLabel';
import { DeliveryComposer } from '@/components/delivery/DeliveryComposer';
import { useProject } from '@/hooks/useProjects';

export default function DeliveryComposerPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const { data: project, isPending, isError } = useProject(projectId);

  if (!projectId) return <Navigate to="/projects" replace />;
  if (isError) return <Navigate to="/projects" replace />;

  return (
    <div className="space-y-6 max-w-4xl">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl">
            <BilingualLabel
              ja={`配信作成: ${project?.name ?? '—'}`}
              en={`Compose delivery: ${project?.name ?? '—'}`}
            />
          </h1>
          <p className="text-xs text-muted-foreground">
            <BilingualLabel
              ja="承認済みの案を選び、クライアント宛のメールを作成します。"
              en="Pick approved variants and compose the email to the client."
            />
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to={`/projects/${projectId}/audit`}>
            <BilingualLabel ja="監査に戻る" en="Back to audit" />
          </Link>
        </Button>
      </header>

      {isPending ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <DeliveryComposer projectId={projectId} />
      )}
    </div>
  );
}
