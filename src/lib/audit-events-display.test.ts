import { describe, it, expect } from "vitest";
import {
  getActorDisplay,
  getEventDetailValue,
  getEventTypeLabel,
  isBackfilledEvent,
} from "./audit-events-display";

describe("getEventTypeLabel", () => {
  it("returns bilingual labels for known event types", () => {
    expect(getEventTypeLabel("variant_generated")).toEqual({
      ja: "変種生成",
      en: "Variant generated",
    });
    expect(getEventTypeLabel("sign_off").en).toBe("Sign off");
    expect(getEventTypeLabel("audit_revision_started").ja).toBe(
      "監査レポート改訂開始",
    );
  });

  it("falls back to the raw event type for unknown keys", () => {
    const label = getEventTypeLabel("unrecognized_event");
    expect(label.ja).toBe("unrecognized_event");
    expect(label.en).toBe("unrecognized_event");
  });
});

describe("getActorDisplay", () => {
  it("returns localized System for system rows", () => {
    const label = getActorDisplay({
      actor_type: "system",
      actor_name_snapshot: null,
    });
    expect(label.ja).toBe("システム");
    expect(label.en).toBe("System");
  });

  it("returns System when actor_type is user but name snapshot is missing", () => {
    const label = getActorDisplay({
      actor_type: "user",
      actor_name_snapshot: null,
    });
    expect(label.en).toBe("System");
  });

  it("returns the snapshot name unchanged for user rows", () => {
    const label = getActorDisplay({
      actor_type: "user",
      actor_name_snapshot: "Ryan",
    });
    expect(label.ja).toBe("Ryan");
    expect(label.en).toBe("Ryan");
  });
});

describe("isBackfilledEvent", () => {
  it("returns true when details.completeness is latest_state_only", () => {
    expect(
      isBackfilledEvent({ details: { completeness: "latest_state_only" } }),
    ).toBe(true);
  });

  it("returns false when details has no completeness marker", () => {
    expect(isBackfilledEvent({ details: { variant_id: "x" } })).toBe(false);
  });

  it("returns false for null or non-object details", () => {
    expect(isBackfilledEvent({ details: null })).toBe(false);
    expect(isBackfilledEvent({ details: "string-not-object" })).toBe(false);
  });
});

describe("getEventDetailValue", () => {
  it("reads a key out of the details bag", () => {
    expect(
      getEventDetailValue(
        { details: { variant_id: "abc", severity: "blocker" } },
        "variant_id",
      ),
    ).toBe("abc");
  });

  it("returns undefined when the key is missing", () => {
    expect(getEventDetailValue({ details: { x: 1 } }, "missing")).toBe(
      undefined,
    );
  });

  it("returns undefined for null details", () => {
    expect(getEventDetailValue({ details: null }, "anything")).toBe(undefined);
  });
});
