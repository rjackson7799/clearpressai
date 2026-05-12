import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import "@/locales/i18n";
import i18n from "i18next";
import SettingsPage from "./SettingsPage";

describe("SettingsPage i18n", () => {
  it("renders the settings title in ja", async () => {
    await i18n.changeLanguage("ja");
    render(<SettingsPage />);
    expect(screen.getByText("設定")).toBeInTheDocument();
  });

  it("renders the settings title in en", async () => {
    await i18n.changeLanguage("en");
    render(<SettingsPage />);
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });
});
