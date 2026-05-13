import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpc(...args),
  },
}));

import { useApplyFix } from "./useApplyFix";

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

describe("useApplyFix", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it("calls the apply_fix RPC with the full body-edit payload", async () => {
    rpc.mockResolvedValueOnce({
      data: { id: "f1", resolution_status: "fixed" },
      error: null,
    });

    const { result } = renderHook(() => useApplyFix("ci1"), {
      wrapper: makeWrapper(),
    });

    result.current.mutate({
      findingId: "f1",
      variantId: "v1",
      newBodyText: "edited body",
      newBodyHtml: null,
      newCharCount: 11,
      newReadingTimeSeconds: 2,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(rpc).toHaveBeenCalledWith("apply_fix", {
      p_finding_id: "f1",
      p_new_body_text: "edited body",
      p_new_body_html: null,
      p_new_char_count: 11,
      p_new_reading_time_seconds: 2,
    });
  });

  it("preserves a non-null body_html through to the RPC", async () => {
    rpc.mockResolvedValueOnce({
      data: { id: "f1", resolution_status: "fixed" },
      error: null,
    });

    const { result } = renderHook(() => useApplyFix("ci1"), {
      wrapper: makeWrapper(),
    });

    result.current.mutate({
      findingId: "f1",
      variantId: "v1",
      newBodyText: "edited",
      newBodyHtml: "<p>edited</p>",
      newCharCount: 6,
      newReadingTimeSeconds: 1,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(rpc).toHaveBeenCalledWith(
      "apply_fix",
      expect.objectContaining({ p_new_body_html: "<p>edited</p>" }),
    );
  });

  it("surfaces a finding_already_fixed P0004 as a mutation error", async () => {
    rpc.mockResolvedValueOnce({
      data: null,
      error: { code: "P0004", message: "finding_already_fixed" },
    });

    const { result } = renderHook(() => useApplyFix("ci1"), {
      wrapper: makeWrapper(),
    });

    result.current.mutate({
      findingId: "f1",
      variantId: "v1",
      newBodyText: "x",
      newBodyHtml: null,
      newCharCount: 1,
      newReadingTimeSeconds: 1,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as { message?: string } | null)?.message).toBe(
      "finding_already_fixed",
    );
  });
});
