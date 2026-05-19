import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@/locales/i18n';

// Mock the supabase client BEFORE importing modules that use it. The mocks
// for the two hook modules below ensure no actual network call happens; we
// only need supabase mocked at the module-resolution level.
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    from: vi.fn(),
    functions: { invoke: vi.fn() },
  },
}));

import { useFeedbackLoad } from '@/hooks/useFeedbackLoad';
import { useFeedbackSubmit } from '@/hooks/useFeedbackSubmit';
import FeedbackPage from '@/pages/FeedbackPage';
import type { FeedbackLoadResponse } from '@/lib/types/feedback';

vi.mock('@/hooks/useFeedbackLoad', () => ({
  useFeedbackLoad: vi.fn(),
  feedbackLoadKey: (token: string) => ['feedback_load', token],
}));

vi.mock('@/hooks/useFeedbackSubmit', () => ({
  useFeedbackSubmit: vi.fn(),
}));

const mockUseFeedbackLoad = vi.mocked(useFeedbackLoad);
const mockUseFeedbackSubmit = vi.mocked(useFeedbackSubmit);

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/f/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa']}>
        <Routes>
          <Route path="/f/:token" element={<FeedbackPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function loadResult(state: Partial<ReturnType<typeof useFeedbackLoad>>) {
  return {
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    ...state,
  } as ReturnType<typeof useFeedbackLoad>;
}

function submitResult(
  state: Partial<ReturnType<typeof useFeedbackSubmit>>,
) {
  return {
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    isSuccess: false,
    error: null,
    ...state,
  } as unknown as ReturnType<typeof useFeedbackSubmit>;
}

const OK_FIXTURE: FeedbackLoadResponse = {
  status: 'ok',
  delivery: {
    subject: 'Q1 リリース',
    recipient_name: 'クライアントCo',
    sent_at: '2026-05-13T10:00:00.000Z',
    audit_report_version: '1.0',
  },
  project: { name: 'Q1 プレスリリース' },
  content_item: { content_sub_type: 'partner_ack' },
  variants: [
    {
      id: '33333333-3333-4333-8333-333333333333',
      variant_label: '簡潔',
      variant_index: 1,
      body_html: '<p>variant body</p>',
      body_text: 'variant body',
      variation_directive: null,
      char_count: 100,
    },
  ],
  recommended_variant_id: null,
  sender: { from_name: 'PR会社X' },
  expires_at: '2026-06-13T10:00:00.000Z',
};

beforeEach(() => {
  mockUseFeedbackLoad.mockReset();
  mockUseFeedbackSubmit.mockReset();
  mockUseFeedbackSubmit.mockReturnValue(submitResult({}));
});

describe('FeedbackPage render states', () => {
  it('renders loading skeletons while the query is pending', () => {
    mockUseFeedbackLoad.mockReturnValue(loadResult({ isLoading: true }));
    const { container } = renderPage();
    // Skeleton component renders a div with bg-accent class — check for it.
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders the invalid state when query data status is invalid', () => {
    mockUseFeedbackLoad.mockReturnValue(
      loadResult({ data: { status: 'invalid' } }),
    );
    renderPage();
    expect(screen.getByText('このリンクは無効です')).toBeInTheDocument();
    expect(screen.getByText('Link no longer valid')).toBeInTheDocument();
  });

  it('renders the invalid state on query error', () => {
    mockUseFeedbackLoad.mockReturnValue(
      loadResult({ isError: true, error: new Error('Network down') }),
    );
    renderPage();
    expect(screen.getByText('このリンクは無効です')).toBeInTheDocument();
  });

  it('renders the already-submitted confirmation with the submitted_at', () => {
    mockUseFeedbackLoad.mockReturnValue(
      loadResult({
        data: {
          status: 'already_submitted',
          submitted_at: '2026-05-14T10:30:00.000Z',
        },
      }),
    );
    renderPage();
    expect(
      screen.getByText('フィードバックを受け付けました'),
    ).toBeInTheDocument();
  });

  it('renders the active form + firm-branded header when status is ok', () => {
    mockUseFeedbackLoad.mockReturnValue(loadResult({ data: OK_FIXTURE }));
    renderPage();
    // Firm name in the header (PRD §5.5).
    expect(screen.getByText('PR会社X')).toBeInTheDocument();
    // Project name in the sub-header.
    expect(screen.getAllByText(/Q1 プレスリリース/).length).toBeGreaterThan(0);
    // Variant tab label visible.
    expect(screen.getByText('簡潔')).toBeInTheDocument();
  });

  it('does not show the firm name in the header when the query is still loading', () => {
    mockUseFeedbackLoad.mockReturnValue(loadResult({ isLoading: true }));
    renderPage();
    // Fallback header text.
    expect(
      screen.getByText(/フィードバック \/ Feedback/),
    ).toBeInTheDocument();
  });
});
