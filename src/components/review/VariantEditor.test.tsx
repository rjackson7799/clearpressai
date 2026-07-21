import { describe, it, expect, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import "@/locales/i18n"; // initialize the global i18n so BilingualLabel renders
import { VariantEditor } from "./VariantEditor";

// Guards the load-bearing B1 fix: @tiptap/react v3 does not re-apply `editable`
// on a prop change, so the "Revise & edit" flow could clear the lock banner
// while the body stayed non-editable. The setEditable effect must flip
// contentEditable when readOnly changes.
describe("VariantEditor", () => {
  it("reflects readOnly in contentEditable and flips when the prop changes", async () => {
    const onSave = vi.fn();
    const { container, rerender } = render(
      <VariantEditor initialBodyText="本文テキスト" onSave={onSave} readOnly />,
    );

    await waitFor(() =>
      expect(container.querySelector("[contenteditable]")).not.toBeNull(),
    );
    expect(
      container
        .querySelector("[contenteditable]")
        ?.getAttribute("contenteditable"),
    ).toBe("false");

    rerender(
      <VariantEditor
        initialBodyText="本文テキスト"
        onSave={onSave}
        readOnly={false}
      />,
    );

    await waitFor(() =>
      expect(
        container
          .querySelector("[contenteditable]")
          ?.getAttribute("contenteditable"),
      ).toBe("true"),
    );
  });
});
