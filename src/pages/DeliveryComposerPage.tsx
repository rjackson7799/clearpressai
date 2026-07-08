import { Link, Navigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BilingualLabel } from '@/components/shared/BilingualLabel';
import { PageShell } from '@/components/shared/PageShell';
import { PageHeader } from '@/components/shared/PageHeader';
import { DeliveryComposer } from '@/components/delivery/DeliveryComposer';
import { useProject } from '@/hooks/useProjects';

export default function DeliveryComposerPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const { data: project, isPending, isError } = useProject(projectId);

  if (!projectId) return <Navigate to="/projects" replace />;

  if (isError) {
    // Explain and offer a way back instead of a silent bounce to /projects.
    return (
      <PageShell className="max-w-4xl space-y-4">
        <p className="text-sm text-muted-foreground">
          <BilingualLabel
            ja="プロジェクトを読み込めませんでした。"
            en="This project could not be loaded."
          />
        </p>
        <Button variant="outline" asChild>
          <Link to="/projects">
            <BilingualLabel ja="プロジェクト一覧に戻る" en="Back to projects" />
          </Link>
        </Button>
      </PageShell>
    );
  }

  return (
    <PageShell className="max-w-4xl">
      <PageHeader
        breadcrumb={project?.name ?? '—'}
        title={<BilingualLabel ja="配信作成" en="Compose delivery" />}
        subtitle={
          <BilingualLabel
            ja="承認済みの案を選び、クライアント宛のメールを作成します。"
            en="Pick approved variants and compose the email to the client."
          />
        }
        actions={
          <Button variant="outline" asChild>
            <Link to={`/projects/${projectId}/audit`}>
              <BilingualLabel ja="監査に戻る" en="Back to audit" />
            </Link>
          </Button>
        }
      />

      {isPending ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <DeliveryComposer projectId={projectId} />
      )}
    </PageShell>
  );
}
