import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders the smoke-test button", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: /smoke test/i })).toBeInTheDocument();
  });
});
