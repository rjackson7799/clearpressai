import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import "@/locales/i18n";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ session: { user: { id: "test" } }, loading: false }),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signInWithOtp: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
  },
}));

import App from "./App";

describe("App routing", () => {
  it("renders dashboard at / when authed", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  it("renders login at /login", () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: /log in|ログイン/i })).toBeInTheDocument();
  });

  it("renders feedback page at /f/:token with token visible", () => {
    render(
      <MemoryRouter initialEntries={["/f/abc123"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText(/abc123/)).toBeInTheDocument();
  });
});
