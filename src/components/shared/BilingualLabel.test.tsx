import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import i18n from "i18next";
import "@/locales/i18n";
import { BilingualLabel } from "./BilingualLabel";

describe("BilingualLabel", () => {
  it("renders only Japanese when language is ja", async () => {
    await i18n.changeLanguage("ja");
    render(<BilingualLabel ja="サンプル素材" en="Sample Materials" />);
    expect(screen.getByText("サンプル素材")).toBeInTheDocument();
    expect(screen.queryByText("Sample Materials")).not.toBeInTheDocument();
  });

  it("renders only English when language is en", async () => {
    await i18n.changeLanguage("en");
    render(<BilingualLabel ja="サンプル素材" en="Sample Materials" />);
    expect(screen.getByText("Sample Materials")).toBeInTheDocument();
    expect(screen.queryByText("サンプル素材")).not.toBeInTheDocument();
  });
});
