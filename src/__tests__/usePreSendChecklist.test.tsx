import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import type { AuditReport } from '@/types/domain';
import type { ApprovedVariantRow } from '@/hooks/useApprovedVariantsForProject';

// Mock the upstream hook so we don't reach into supabase for these tests —
// usePreSendChecklist's logic is the pure-derivation half on top of it.
const { useLatestFinalizedAuditReportMock } = vi.hoisted(() => ({
  useLatestFinalizedAuditReportMock: vi.fn(),
}));

vi.mock('@/hooks/useLatestFinalizedAuditReport', () => ({
  useLatestFinalizedAuditReport: useLatestFinalizedAuditReportMock,
  latestFinalizedAuditReportKey: (id: string) =>
    ['audit_report_latest_finalized', id] as const,
}));

import { usePreSendChecklist } from '@/hooks/usePreSendChecklist';

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

function mockReport(): AuditReport {
  return {
    id: 'r1',
    status: 'finalized',
  } as AuditReport;
}

type QR = Partial<UseQueryResult<AuditReport | null>>;
function mockHook(value: QR) {
  useLatestFinalizedAuditReportMock.mockReturnValue(value as unknown);
}

function makeVariant(overrides: Partial<ApprovedVariantRow> = {}): ApprovedVariantRow {
  const approvedAt = '2026-05-10T10:00:00.000Z';
  return {
    id: 'v1',
    internal_approved: true,
    internal_approved_at: approvedAt,
    updated_at: approvedAt,
    content_item: { id: 'ci1', content_type: 'press_release', content_sub_type: 'auto' },
    ...overrides,
  } as ApprovedVariantRow;
}

describe('usePreSendChecklist', () => {
  beforeEach(() => {
    useLatestFinalizedAuditReportMock.mockReset();
  });

  it('reports allPassing=true when all four items pass', () => {
    mockHook({ data: mockReport(), isPending: false });
    const { result } = renderHook(
      () =>
        usePreSendChecklist({
          projectId: 'p1',
          selectedVariants: [makeVariant()],
          recipientEmail: 'client@example.com',
          manualAcknowledged: true,
        }),
      { wrapper: makeWrapper() },
    );
    expect(result.current.auditFinalized).toBe(true);
    expect(result.current.variantsClean).toBe(true);
    expect(result.current.recipientValid).toBe(true);
    expect(result.current.manualAck).toBe(true);
    expect(result.current.allPassing).toBe(true);
  });

  it('blocks allPassing when audit is not finalized', () => {
    mockHook({ data: null, isPending: false });
    const { result } = renderHook(
      () =>
        usePreSendChecklist({
          projectId: 'p1',
          selectedVariants: [makeVariant()],
          recipientEmail: 'client@example.com',
          manualAcknowledged: true,
        }),
      { wrapper: makeWrapper() },
    );
    expect(result.current.auditFinalized).toBe(false);
    expect(result.current.allPassing).toBe(false);
  });

  it('blocks while audit query is still pending (no false positives during load)', () => {
    mockHook({ data: undefined, isPending: true });
    const { result } = renderHook(
      () =>
        usePreSendChecklist({
          projectId: 'p1',
          selectedVariants: [makeVariant()],
          recipientEmail: 'client@example.com',
          manualAcknowledged: true,
        }),
      { wrapper: makeWrapper() },
    );
    expect(result.current.auditFinalized).toBe(false);
    expect(result.current.allPassing).toBe(false);
  });

  it('blocks when no variants are selected', () => {
    mockHook({ data: mockReport(), isPending: false });
    const { result } = renderHook(
      () =>
        usePreSendChecklist({
          projectId: 'p1',
          selectedVariants: [],
          recipientEmail: 'client@example.com',
          manualAcknowledged: true,
        }),
      { wrapper: makeWrapper() },
    );
    expect(result.current.variantsClean).toBe(false);
    expect(result.current.allPassing).toBe(false);
  });

  it('blocks when a selected variant is unapproved', () => {
    mockHook({ data: mockReport(), isPending: false });
    const { result } = renderHook(
      () =>
        usePreSendChecklist({
          projectId: 'p1',
          selectedVariants: [makeVariant({ internal_approved: false })],
          recipientEmail: 'client@example.com',
          manualAcknowledged: true,
        }),
      { wrapper: makeWrapper() },
    );
    expect(result.current.variantsClean).toBe(false);
    expect(result.current.allPassing).toBe(false);
  });

  it('blocks when a variant was edited after approval', () => {
    mockHook({ data: mockReport(), isPending: false });
    const { result } = renderHook(
      () =>
        usePreSendChecklist({
          projectId: 'p1',
          selectedVariants: [
            makeVariant({
              internal_approved_at: '2026-05-10T10:00:00.000Z',
              updated_at: '2026-05-12T10:00:00.000Z',
            }),
          ],
          recipientEmail: 'client@example.com',
          manualAcknowledged: true,
        }),
      { wrapper: makeWrapper() },
    );
    expect(result.current.variantsClean).toBe(false);
    expect(result.current.allPassing).toBe(false);
  });

  it('blocks when recipient email is malformed', () => {
    mockHook({ data: mockReport(), isPending: false });
    const { result } = renderHook(
      () =>
        usePreSendChecklist({
          projectId: 'p1',
          selectedVariants: [makeVariant()],
          recipientEmail: 'not-an-email',
          manualAcknowledged: true,
        }),
      { wrapper: makeWrapper() },
    );
    expect(result.current.recipientValid).toBe(false);
    expect(result.current.allPassing).toBe(false);
  });

  it('blocks until manual ack is checked', () => {
    mockHook({ data: mockReport(), isPending: false });
    const { result } = renderHook(
      () =>
        usePreSendChecklist({
          projectId: 'p1',
          selectedVariants: [makeVariant()],
          recipientEmail: 'client@example.com',
          manualAcknowledged: false,
        }),
      { wrapper: makeWrapper() },
    );
    expect(result.current.manualAck).toBe(false);
    expect(result.current.allPassing).toBe(false);
  });
});
