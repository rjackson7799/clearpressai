import { describe, it, expect } from "vitest";
import { canonicalize } from "./canonical-payload";

describe("canonicalize", () => {
  it("sorts top-level keys alphabetically", () => {
    expect(canonicalize({ b: 1, a: 2, c: 3 })).toBe('{"a":2,"b":1,"c":3}');
  });

  it("sorts nested keys recursively", () => {
    expect(
      canonicalize({ outer: { z: 1, a: 2, m: { y: 1, x: 2 } } }),
    ).toBe('{"outer":{"a":2,"m":{"x":2,"y":1},"z":1}}');
  });

  it("preserves array order while canonicalizing elements", () => {
    expect(
      canonicalize([
        { b: 1, a: 2 },
        { d: 3, c: 4 },
      ]),
    ).toBe('[{"a":2,"b":1},{"c":4,"d":3}]');
  });

  it("renders primitives unchanged", () => {
    expect(canonicalize("hello")).toBe('"hello"');
    expect(canonicalize(42)).toBe("42");
    expect(canonicalize(true)).toBe("true");
    expect(canonicalize(false)).toBe("false");
    expect(canonicalize(null)).toBe("null");
  });

  it("produces identical output for equal objects with different key insertion order", () => {
    const a = canonicalize({
      project_id: "p1",
      report_id: "r1",
      signed_at: "2026-05-13T00:00:00Z",
    });
    const b = canonicalize({
      signed_at: "2026-05-13T00:00:00Z",
      report_id: "r1",
      project_id: "p1",
    });
    expect(a).toBe(b);
  });

  it("treats null leaves as null, not undefined", () => {
    expect(canonicalize({ resolved_by: null })).toBe('{"resolved_by":null}');
  });
});
