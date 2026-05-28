import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import i18n from "i18next";
import "@/locales/i18n";
import { BilingualLabel } from "./BilingualLabel";

describe("BilingualLabel", () => {
  it("renders both languages when language is ja (ja primary)", async () => {
    await i18n.changeLanguage("ja");
    render(<BilingualLabel ja="サンプル素材" en="Sample Materials" />);
    const primary = screen.getByText("サンプル素材");
    const secondary = screen.getByText("Sample Materials");
    expect(primary).toBeInTheDocument();
    expect(secondary).toBeInTheDocument();
    expect(secondary.className).toMatch(/opacity-60/);
  });

  it("renders both languages when language is en (en primary)", async () => {
    await i18n.changeLanguage("en");
    render(<BilingualLabel ja="サンプル素材" en="Sample Materials" />);
    const primary = screen.getByText("Sample Materials");
    const secondary = screen.getByText("サンプル素材");
    expect(primary).toBeInTheDocument();
    expect(secondary).toBeInTheDocument();
    expect(secondary.className).toMatch(/opacity-60/);
  });
});
