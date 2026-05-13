import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const { rpc, fromMock } = vi.hoisted(() => ({
  rpc: vi.fn(),
  fromMock: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpc(...args),
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

import { useApproveVariant } from "./useApproveVariant";

// Helper: a QueryClientProvider wrapper that disables retries so failed
// mutations surface their error quickly.
function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

describe("useApproveVariant", () => {
  beforeEach(() => {
    rpc.mockReset();
    fromMock.mockReset();
  });

  it("calls approve_variant RPC for the approve path", async () => {
    rpc.mockReturnValueOnce({
      single: () => Promise.resolve({ data: { id: "v1" }, error: null }),
    });

    const { result } = renderHook(() => useApproveVariant("ci1"), {
      wrapper: makeWrapper(),
    });

    result.current.mutate({ variantId: "v1", approved: true });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(rpc).toHaveBeenCalledWith("approve_variant", { p_variant_id: "v1" });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("uses direct table update for the unapprove path (no RPC, no audit event)", async () => {
    const updateChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: "v1" }, error: null }),
    };
    fromMock.mockReturnValueOnce(updateChain);

    const { result } = renderHook(() => useApproveVariant("ci1"), {
      wrapper: makeWrapper(),
    });

    result.current.mutate({ variantId: "v1", approved: false });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(rpc).not.toHaveBeenCalled();
    expect(fromMock).toHaveBeenCalledWith("content_variants");
    expect(updateChain.update).toHaveBeenCalledWith({
      internal_approved: false,
      internal_approved_by: null,
      internal_approved_at: null,
    });
  });

  it("propagates RPC errors via mutation error state", async () => {
    rpc.mockReturnValueOnce({
      single: () =>
        Promise.resolve({
          data: null,
          error: { code: "P0004", message: "variant_not_found" },
        }),
    });

    const { result } = renderHook(() => useApproveVariant("ci1"), {
      wrapper: makeWrapper(),
    });

    result.current.mutate({ variantId: "missing", approved: true });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as { message?: string } | null)?.message).toBe(
      "variant_not_found",
    );
  });
});
