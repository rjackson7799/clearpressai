import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { ClientForm } from "./ClientForm";
import ja from "@/locales/ja.json";
import en from "@/locales/en.json";

// Self-contained i18n init so tests don't depend on app bootstrap order.
i18n.use(initReactI18next).init({
  resources: { ja: { translation: ja }, en: { translation: en } },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

function renderForm(onSubmit = vi.fn()) {
  return {
    onSubmit,
    ...render(
      <I18nextProvider i18n={i18n}>
        <ClientForm onSubmit={onSubmit} />
      </I18nextProvider>,
    ),
  };
}

describe("ClientForm", () => {
  it("blocks submit and shows error when name is missing", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();
    const saveButton = screen.getByRole("button", { name: /save/i });
    await user.click(saveButton);
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects invalid email and shows error", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();
    await user.type(screen.getByLabelText(/^name/i), "Test");
    await user.type(screen.getByLabelText(/contact email/i), "not-an-email");
    await user.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits with valid values", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();
    await user.type(screen.getByLabelText(/^name/i), "田中製薬");
    await user.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ name: "田中製薬" });
  });
});
