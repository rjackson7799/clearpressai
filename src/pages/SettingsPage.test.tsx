import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import "@/locales/i18n";
import i18n from "i18next";

vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: () => ({ data: null, isLoading: false }),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
  },
}));

import SettingsPage from "./SettingsPage";

describe("SettingsPage", () => {
  it("renders bilingual title with both ja and en visible", async () => {
    await i18n.changeLanguage("ja");
    render(<SettingsPage />);
    expect(screen.getByText("設定")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("still shows both after switching to en", async () => {
    await i18n.changeLanguage("en");
    render(<SettingsPage />);
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("設定")).toBeInTheDocument();
  });
});
