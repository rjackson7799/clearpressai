import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { BilingualLabel } from '@/components/shared/BilingualLabel';
import { GettingStartedChecklist } from '@/components/dashboard/GettingStartedChecklist';
import { RecentProjects } from '@/components/dashboard/RecentProjects';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { useClients } from '@/hooks/useClients';
import { useProjectSummaries } from '@/hooks/useProjects';
import { useHasBrandVoiceSamples } from '@/hooks/useHasBrandVoiceSamples';
import { computeOnboardingSteps } from '@/lib/onboarding';

const DISMISS_KEY = 'clearpress-hide-getting-started';

export default function DashboardPage() {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === 'true',
  );

  const clients = useClients();
  const projects = useProjectSummaries();
  const samples = useHasBrandVoiceSamples();

  const isLoading =
    clients.isLoading || projects.isLoading || samples.isLoading;
  const isError = clients.isError || projects.isError || samples.isError;

  const clientList = clients.data ?? [];
  const projectList = projects.data ?? [];

  const { steps, activeIndex, allDone } = computeOnboardingSteps({
    hasClient: clientList.length > 0,
    hasSamples: samples.data ?? false,
    hasProject: projectList.length > 0,
    hasApproved: projectList.some((p) => (p.variants_approved ?? 0) > 0),
    hasDelivered: projectList.some(
      (p) => p.status === 'delivered' || p.status === 'feedback_received',
    ),
    firstClientId: clientList[0]?.id ?? null,
  });

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, 'true');
    setDismissed(true);
  }

  const showChecklist = !allDone && !dismissed;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl">
        <BilingualLabel ja="ダッシュボード" en="Dashboard" />
      </h1>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full max-w-2xl" />
          <Skeleton className="h-24 w-full max-w-2xl" />
        </div>
      ) : isError ? (
        <div className="max-w-2xl rounded-md border border-destructive/40 bg-destructive/5 p-6 text-center space-y-3">
          <p className="text-sm text-destructive">
            <BilingualLabel
              ja="ダッシュボードの読み込みに失敗しました"
              en="Failed to load the dashboard"
            />
          </p>
          <Button
            variant="outline"
            onClick={() => {
              void clients.refetch();
              void projects.refetch();
              void samples.refetch();
            }}
          >
            <BilingualLabel ja="再試行" en="Retry" />
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {showChecklist && (
            <div className="max-w-2xl">
              <GettingStartedChecklist
                steps={steps}
                activeIndex={activeIndex}
                onDismiss={handleDismiss}
              />
            </div>
          )}

          {projectList.length > 0 ? (
            <div className="max-w-2xl space-y-6">
              <DashboardStats
                clientCount={clientList.length}
                projectCount={projectList.length}
              />
              <RecentProjects projects={projectList} />
            </div>
          ) : (
            !showChecklist && (
              <div className="max-w-2xl rounded-md border border-dashed p-8 text-center space-y-3">
                <p className="text-base font-medium">
                  <BilingualLabel
                    ja="まだプロジェクトがありません"
                    en="No projects yet"
                  />
                </p>
                <p className="text-sm text-muted-foreground">
                  <BilingualLabel
                    ja="最初のプロジェクトを作成して始めましょう。"
                    en="Create your first project to get started."
                  />
                </p>
                <Button asChild>
                  <Link to="/projects/new">
                    <BilingualLabel ja="新規プロジェクト" en="New project" />
                  </Link>
                </Button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
