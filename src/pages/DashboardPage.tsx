import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { BilingualLabel } from '@/components/shared/BilingualLabel';
import { PageShell } from '@/components/shared/PageShell';
import { DashboardGreeting } from '@/components/dashboard/DashboardGreeting';
import { GettingStartedChecklist } from '@/components/dashboard/GettingStartedChecklist';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { RecentProjects } from '@/components/dashboard/RecentProjects';
import { ComplianceSnapshot } from '@/components/dashboard/ComplianceSnapshot';
import { NeedsAttention } from '@/components/dashboard/NeedsAttention';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { DashboardTip } from '@/components/dashboard/DashboardTip';
import { useClients } from '@/hooks/useClients';
import { useProjectSummaries } from '@/hooks/useProjects';
import { useHasBrandVoiceSamples } from '@/hooks/useHasBrandVoiceSamples';
import { useComplianceFindingsGlobal } from '@/hooks/useComplianceFindingsGlobal';
import { useDraftAuditReports } from '@/hooks/useDraftAuditReports';
import { computeOnboardingSteps } from '@/lib/onboarding';
import {
  deriveStats,
  deriveComplianceSnapshot,
  deriveNeedsAttention,
} from '@/lib/dashboard-metrics';

const DISMISS_KEY = 'clearpress-hide-getting-started';

export default function DashboardPage() {
  // Single `now` computed once — threaded into every pure helper so nothing
  // calls new Date() in render (react-hooks/purity).
  const [now] = useState(() => new Date());
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === 'true',
  );

  const clients = useClients();
  const projects = useProjectSummaries();
  const samples = useHasBrandVoiceSamples();

  const clientList = clients.data ?? [];
  const projectList = projects.data ?? [];
  const hasProjects = projectList.length > 0;

  // Cross-cutting metrics only feed the rich grid, which is hidden until there
  // is at least one project — so gate their traffic behind that.
  const findings = useComplianceFindingsGlobal({ enabled: hasProjects });
  const drafts = useDraftAuditReports({ enabled: hasProjects });

  const isLoading = clients.isLoading || projects.isLoading || samples.isLoading;
  const isError = clients.isError || projects.isError || samples.isError;

  const firstClientId = clientList[0]?.id ?? null;

  const { steps, activeIndex, allDone } = computeOnboardingSteps({
    hasClient: clientList.length > 0,
    hasSamples: samples.data ?? false,
    hasProject: hasProjects,
    hasApproved: projectList.some((p) => (p.variants_approved ?? 0) > 0),
    hasDelivered: projectList.some(
      (p) => p.status === 'delivered' || p.status === 'feedback_received',
    ),
    firstClientId,
  });

  // Derivations depend on the stable query `.data` refs (not `?? []` locals,
  // which get a fresh identity each render and would thrash these memos).
  const stats = useMemo(
    () =>
      deriveStats(
        {
          clients: clients.data ?? [],
          projects: projects.data ?? [],
          findings: findings.data ?? [],
        },
        now,
      ),
    [clients.data, projects.data, findings.data, now],
  );
  const compliance = useMemo(
    () =>
      deriveComplianceSnapshot({
        projects: projects.data ?? [],
        findings: findings.data ?? [],
      }),
    [projects.data, findings.data],
  );
  const needsAttention = useMemo(
    () =>
      deriveNeedsAttention(
        {
          projects: projects.data ?? [],
          findings: findings.data ?? [],
          draftReports: drafts.data ?? [],
        },
        now,
      ),
    [projects.data, findings.data, drafts.data, now],
  );

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, 'true');
    setDismissed(true);
  }

  const showChecklist = !allDone && !dismissed;

  return (
    <PageShell>
      <DashboardGreeting now={now} />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
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
              void findings.refetch();
              void drafts.refetch();
            }}
          >
            <BilingualLabel ja="再試行" en="Retry" />
          </Button>
        </div>
      ) : (
        <>
          {showChecklist && (
            <div className="max-w-2xl">
              <GettingStartedChecklist
                steps={steps}
                activeIndex={activeIndex}
                onDismiss={handleDismiss}
              />
            </div>
          )}

          {hasProjects ? (
            <>
              <DashboardStats stats={stats} />
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <div className="space-y-6">
                  <RecentProjects projects={projectList} now={now} />
                  <ComplianceSnapshot
                    snapshot={compliance}
                    isLoading={findings.isLoading}
                  />
                </div>
                <aside className="space-y-6 self-start lg:sticky lg:top-6">
                  <NeedsAttention
                    items={needsAttention}
                    isLoading={findings.isLoading || drafts.isLoading}
                  />
                  <QuickActions firstClientId={firstClientId} />
                  <DashboardTip now={now} />
                </aside>
              </div>
            </>
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
        </>
      )}
    </PageShell>
  );
}
