import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
    functions: {
      // Long-pending invoke so /f/:token rests in the loading state during
      // this routing smoke. Page-level state tests live in T9.
      invoke: vi.fn(() => new Promise(() => {})),
    },
  },
}));

import App from "./App";

function renderWithProviders(initialEntries: string[]) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("App routing", () => {
  it("renders dashboard at / when authed", () => {
    renderWithProviders(["/"]);
    expect(screen.getByText("Dashboard / ダッシュボード")).toBeInTheDocument();
  });

  it("renders login at /login", () => {
    renderWithProviders(["/login"]);
    expect(
      screen.getByRole("heading", { name: /log in|ログイン/i }),
    ).toBeInTheDocument();
  });

  it("renders feedback page at /f/:token with the firm-branded header", () => {
    renderWithProviders(["/f/abc123"]);
    // The query hangs in loading; the header fallback text is the stable
    // assertion for the routing smoke. Page-level state tests live in T9.
    expect(
      screen.getByText(/フィードバック \/ Feedback/),
    ).toBeInTheDocument();
  });
});
