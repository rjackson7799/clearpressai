import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import i18n from '@/locales/i18n';

const originalLang = i18n.language;
afterAll(async () => {
  await i18n.changeLanguage(originalLang);
});

vi.mock('@/lib/supabase', () => ({
  supabase: { auth: { getUser: vi.fn() }, from: vi.fn(), functions: { invoke: vi.fn() } },
}));

import {
  useInternalFeedbackList,
  useCreateInternalFeedback,
  useUpdateFeedbackStatus,
  useDeleteInternalFeedback,
  useFeedbackAttachmentUrls,
} from '@/hooks/useInternalFeedback';
import InternalFeedbackPage from '@/pages/InternalFeedbackPage';

vi.mock('@/hooks/useInternalFeedback', () => ({
  useInternalFeedbackList: vi.fn(),
  useCreateInternalFeedback: vi.fn(),
  useUpdateFeedbackStatus: vi.fn(),
  useDeleteInternalFeedback: vi.fn(),
  useFeedbackAttachmentUrls: vi.fn(),
}));

const mockList = vi.mocked(useInternalFeedbackList);
const idleMutation = { mutate: vi.fn(), isPending: false };

function listResult(state: object) {
  return {
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...state,
  } as unknown as ReturnType<typeof useInternalFeedbackList>;
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <InternalFeedbackPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
  vi.mocked(useCreateInternalFeedback).mockReturnValue(
    idleMutation as unknown as ReturnType<typeof useCreateInternalFeedback>,
  );
  vi.mocked(useUpdateFeedbackStatus).mockReturnValue(
    idleMutation as unknown as ReturnType<typeof useUpdateFeedbackStatus>,
  );
  vi.mocked(useDeleteInternalFeedback).mockReturnValue(
    idleMutation as unknown as ReturnType<typeof useDeleteInternalFeedback>,
  );
  vi.mocked(useFeedbackAttachmentUrls).mockReturnValue({
    data: {},
  } as unknown as ReturnType<typeof useFeedbackAttachmentUrls>);
});

describe('InternalFeedbackPage', () => {
  it('renders the empty state when there is no feedback', () => {
    mockList.mockReturnValue(listResult({ data: [] }));
    renderPage();
    expect(screen.getByText('No feedback yet')).toBeInTheDocument();
  });

  it('does not show the empty state while loading', () => {
    mockList.mockReturnValue(listResult({ isLoading: true }));
    renderPage();
    expect(screen.queryByText('No feedback yet')).not.toBeInTheDocument();
  });

  it('renders an error state with a retry action', () => {
    mockList.mockReturnValue(listResult({ isError: true }));
    renderPage();
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });

  it('renders a feedback item with its message and type', () => {
    mockList.mockReturnValue(
      listResult({
        data: [
          {
            id: 'fb1',
            type: 'bug',
            status: 'pending',
            message: 'Login button is broken',
            created_by: 'u1',
            created_at: '2026-07-08T00:00:00Z',
            updated_at: '2026-07-08T00:00:00Z',
            internal_feedback_attachments: [],
            created_by_user: { email: 'ryan@example.com' },
          },
        ],
      }),
    );
    renderPage();
    expect(screen.getByText('Login button is broken')).toBeInTheDocument();
    expect(screen.getByText('ryan@example.com', { exact: false })).toBeInTheDocument();
  });
});
