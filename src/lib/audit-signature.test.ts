import { describe, it, expect, vi, beforeEach } from "vitest";

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    functions: { invoke },
  },
}));

import { verifyAuditSignature } from "./audit-signature";

describe("verifyAuditSignature", () => {
  beforeEach(() => {
    invoke.mockReset();
  });

  it("returns the inner data envelope on success", async () => {
    invoke.mockResolvedValueOnce({
      data: {
        data: {
          matches: true,
          computed_hash: "deadbeef",
          stored_hash: "deadbeef",
        },
        error: null,
      },
      error: null,
    });

    const result = await verifyAuditSignature(
      "11111111-1111-1111-1111-111111111111",
    );

    expect(invoke).toHaveBeenCalledWith("verify-audit-signature", {
      body: { signature_id: "11111111-1111-1111-1111-111111111111" },
    });
    expect(result).toEqual({
      matches: true,
      computed_hash: "deadbeef",
      stored_hash: "deadbeef",
    });
  });

  it("throws when the inner envelope carries an error", async () => {
    invoke.mockResolvedValueOnce({
      data: {
        data: null,
        error: { code: "not_found", message: "Signature not found" },
      },
      error: null,
    });

    await expect(verifyAuditSignature("missing-id")).rejects.toThrow(
      "Signature not found",
    );
  });

  it("throws when the outer transport reports an error", async () => {
    invoke.mockResolvedValueOnce({
      data: null,
      error: { message: "network down", name: "FunctionsFetchError" },
    });

    await expect(verifyAuditSignature("any-id")).rejects.toBeDefined();
  });

  it("throws when the response is missing data entirely", async () => {
    invoke.mockResolvedValueOnce({
      data: { data: null, error: null },
      error: null,
    });

    await expect(verifyAuditSignature("any-id")).rejects.toThrow(
      "Verify response missing data",
    );
  });
});
