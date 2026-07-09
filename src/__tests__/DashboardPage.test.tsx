import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@/locales/i18n';

vi.mock('@/hooks/useClients', () => ({ useClients: vi.fn() }));
vi.mock('@/hooks/useProjects', () => ({ useProjectSummaries: vi.fn() }));
vi.mock('@/hooks/useHasBrandVoiceSamples', () => ({
  useHasBrandVoiceSamples: vi.fn(),
}));
vi.mock('@/hooks/useComplianceFindingsGlobal', () => ({
  useComplianceFindingsGlobal: vi.fn(),
}));
vi.mock('@/hooks/useDraftAuditReports', () => ({
  useDraftAuditReports: vi.fn(),
}));
vi.mock('@/hooks/useCurrentUser', () => ({ useCurrentUser: vi.fn() }));

import DashboardPage from '@/pages/DashboardPage';
import { useClients } from '@/hooks/useClients';
import { useProjectSummaries } from '@/hooks/useProjects';
import { useHasBrandVoiceSamples } from '@/hooks/useHasBrandVoiceSamples';
import { useComplianceFindingsGlobal } from '@/hooks/useComplianceFindingsGlobal';
import { useDraftAuditReports } from '@/hooks/useDraftAuditReports';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const DISMISS_KEY = 'clearpress-hide-getting-started';

interface QState {
  data?: unknown;
  isLoading?: boolean;
  isError?: boolean;
}
function q(state: QState) {
  return {
    data: state.data,
    isLoading: state.isLoading ?? false,
    isError: state.isError ?? false,
    refetch: vi.fn(),
  };
}

// Each hook returns a differently-typed UseQueryResult; cast the shared shape
// to each at the call site rather than pretending they're all one type.
function configure(o: {
  clients?: QState;
  projects?: QState;
  samples?: QState;
  findings?: QState;
  drafts?: QState;
  user?: QState;
}) {
  vi.mocked(useClients).mockReturnValue(
    q(o.clients ?? { data: [] }) as unknown as ReturnType<typeof useClients>,
  );
  vi.mocked(useProjectSummaries).mockReturnValue(
    q(o.projects ?? { data: [] }) as unknown as ReturnType<
      typeof useProjectSummaries
    >,
  );
  vi.mocked(useHasBrandVoiceSamples).mockReturnValue(
    q(o.samples ?? { data: false }) as unknown as ReturnType<
      typeof useHasBrandVoiceSamples
    >,
  );
  vi.mocked(useComplianceFindingsGlobal).mockReturnValue(
    q(o.findings ?? { data: [] }) as unknown as ReturnType<
      typeof useComplianceFindingsGlobal
    >,
  );
  vi.mocked(useDraftAuditReports).mockReturnValue(
    q(o.drafts ?? { data: [] }) as unknown as ReturnType<
      typeof useDraftAuditReports
    >,
  );
  vi.mocked(useCurrentUser).mockReturnValue(
    q(o.user ?? { data: null }) as unknown as ReturnType<typeof useCurrentUser>,
  );
}

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const PROJECT = {
  id: 'p1',
  name: 'Phase III topline',
  client_id: 'c1',
  client_name: 'Sakura Pharma',
  status: 'in_review',
  deadline: null,
  created_at: new Date().toISOString(),
  last_generated_at: new Date().toISOString(),
  variants_total: 3,
  variants_approved: 1,
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('DashboardPage', () => {
  it('shows skeletons (no rich grid) while core data loads', () => {
    configure({
      clients: { isLoading: true },
      projects: { isLoading: true },
      samples: { isLoading: true },
    });
    renderPage();
    expect(
      screen.queryByText(/最近のプロジェクト|Recent projects/),
    ).not.toBeInTheDocument();
    // The greeting header renders regardless of the query state.
    expect(
      screen.getByText(/クライアントの動き|moving across your clients/),
    ).toBeInTheDocument();
  });

  it('shows the onboarding checklist and no grid when there are no projects', () => {
    localStorage.removeItem(DISMISS_KEY);
    configure({ clients: { data: [] }, projects: { data: [] } });
    renderPage();
    expect(
      screen.getByText(/クライアントを作成|Create a client/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/最近のプロジェクト|Recent projects/),
    ).not.toBeInTheDocument();
  });

  it('renders the rich grid when there are projects', () => {
    localStorage.setItem(DISMISS_KEY, 'true'); // hide checklist for a clean grid
    configure({
      clients: { data: [{ id: 'c1', created_at: new Date().toISOString() }] },
      projects: { data: [PROJECT] },
      samples: { data: true },
      findings: {
        data: [
          {
            id: 'f1',
            variant_id: 'v1',
            severity: 'blocker',
            resolution_status: 'unresolved',
            project_id: 'p1',
          },
        ],
      },
      drafts: { data: [] },
    });
    renderPage();
    expect(
      screen.getByText(/最近のプロジェクト|Recent projects/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/対応が必要な項目|Needs your attention/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/クイックアクション|Quick actions/),
    ).toBeInTheDocument();
    expect(screen.getByText(/コンプライアンス|Compliance/)).toBeInTheDocument();
    // The project surfaces in the recent list (and its blocker finding also
    // surfaces it under Needs your attention) — at least one instance renders.
    expect(screen.getAllByText('Phase III topline').length).toBeGreaterThan(0);
    // The blocker finding drives a critical attention item.
    expect(
      screen.getByText(/重大な指摘が1件|1 critical finding open/),
    ).toBeInTheDocument();
  });

  it('keeps the compliance card in its loading state while findings load', () => {
    localStorage.setItem(DISMISS_KEY, 'true');
    configure({
      clients: { data: [{ id: 'c1', created_at: new Date().toISOString() }] },
      projects: { data: [PROJECT] },
      samples: { data: true },
      findings: { isLoading: true }, // findings still resolving
      drafts: { data: [] },
    });
    renderPage();
    // Grid is up...
    expect(
      screen.getByText(/最近のプロジェクト|Recent projects/),
    ).toBeInTheDocument();
    // ...but the compliance card shows skeletons, not its empty-state copy.
    expect(screen.getByText(/コンプライアンス|Compliance/)).toBeInTheDocument();
    expect(
      screen.queryByText(/コンプライアンスチェック|compliance-checked/),
    ).not.toBeInTheDocument();
  });
});
