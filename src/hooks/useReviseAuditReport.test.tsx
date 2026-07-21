import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { latestAuditReportKey } from "./useLatestAuditReport";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("@/lib/supabase", () => ({
  supabase: { rpc: (...args: unknown[]) => rpc(...args) },
}));

import { useReviseAuditReport } from "./useReviseAuditReport";

function makeHarness() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

describe("useReviseAuditReport", () => {
  beforeEach(() => rpc.mockReset());

  it("calls revise_audit_report and writes the draft into the latest-report cache", async () => {
    const draft = {
      id: "r2",
      status: "draft",
      version_major: 1,
      version_minor: 1,
      previous_version_id: "r1",
    };
    rpc.mockReturnValueOnce({
      single: () => Promise.resolve({ data: draft, error: null }),
    });

    const { client, wrapper } = makeHarness();
    const { result } = renderHook(() => useReviseAuditReport("p1"), { wrapper });

    result.current.mutate({ auditReportId: "r1", comment: "reason" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(rpc).toHaveBeenCalledWith("revise_audit_report", {
      p_audit_report_id: "r1",
      p_comment: "reason",
    });
    // Deterministic in-place unlock: the draft is seeded synchronously so the
    // review page's isLocked recomputes without waiting on a refetch.
    expect(client.getQueryData(latestAuditReportKey("p1"))).toEqual(draft);
  });

  it("propagates P0004 gate errors", async () => {
    rpc.mockReturnValueOnce({
      single: () =>
        Promise.resolve({
          data: null,
          error: { code: "P0004", message: "draft_report_already_exists" },
        }),
    });

    const { wrapper } = makeHarness();
    const { result } = renderHook(() => useReviseAuditReport("p1"), { wrapper });

    result.current.mutate({ auditReportId: "r1", comment: "" });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as { message?: string } | null)?.message).toBe(
      "draft_report_already_exists",
    );
  });
});
