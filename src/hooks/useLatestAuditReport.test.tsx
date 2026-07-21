import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }));

vi.mock("@/lib/supabase", () => ({
  supabase: { from: (...args: unknown[]) => fromMock(...args) },
}));

import { useLatestAuditReport } from "./useLatestAuditReport";

function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe("useLatestAuditReport", () => {
  beforeEach(() => fromMock.mockReset());

  it("orders by version (major desc, then minor desc) to match the DB's canonical ordering", async () => {
    const order = vi.fn();
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order,
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: "r2" }, error: null }),
    };
    order.mockReturnValue(chain);
    fromMock.mockReturnValue(chain);

    const { result } = renderHook(() => useLatestAuditReport("p1"), {
      wrapper: wrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fromMock).toHaveBeenCalledWith("audit_reports");
    expect(order).toHaveBeenNthCalledWith(1, "version_major", {
      ascending: false,
    });
    expect(order).toHaveBeenNthCalledWith(2, "version_minor", {
      ascending: false,
    });
  });
});
