import { describe, it, expect } from "vitest";
import {
  SEVERITY_LABEL,
  SEVERITY_ORDER,
  SEVERITY_VARIANT,
} from "./severity";

describe("severity constants", () => {
  it("orders blocker before warning before note", () => {
    expect(SEVERITY_ORDER).toEqual(["blocker", "warning", "note"]);
  });

  it("provides bilingual labels for each severity", () => {
    expect(SEVERITY_LABEL.blocker.ja).toBe("阻止");
    expect(SEVERITY_LABEL.blocker.en).toBe("Blocker");
    expect(SEVERITY_LABEL.warning.ja).toBe("警告");
    expect(SEVERITY_LABEL.note.en).toBe("Note");
  });

  it("maps each severity to a shadcn badge variant", () => {
    expect(SEVERITY_VARIANT.blocker).toBe("destructive");
    expect(SEVERITY_VARIANT.warning).toBe("default");
    expect(SEVERITY_VARIANT.note).toBe("secondary");
  });

  it("has SEVERITY_LABEL keys matching SEVERITY_ORDER", () => {
    for (const severity of SEVERITY_ORDER) {
      expect(SEVERITY_LABEL[severity]).toBeDefined();
      expect(SEVERITY_VARIANT[severity]).toBeDefined();
    }
  });
});
