import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
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

          {projectList.length > 0 && (
            <div className="max-w-2xl space-y-6">
              <DashboardStats
                clientCount={clientList.length}
                projectCount={projectList.length}
              />
              <RecentProjects projects={projectList} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
