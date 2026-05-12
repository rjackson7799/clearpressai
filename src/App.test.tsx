import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import App from "./App";

describe("App routing", () => {
  it("renders dashboard at /", () => {
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
    expect(screen.getByText(/log in/i)).toBeInTheDocument();
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
