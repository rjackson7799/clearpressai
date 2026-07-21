import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import i18n from "@/locales/i18n";
import type { AuditReport } from "@/types/domain";

const { reviseMutate } = vi.hoisted(() => ({ reviseMutate: vi.fn() }));
vi.mock("@/hooks/useReviseAuditReport", () => ({
  useReviseAuditReport: () => ({ mutate: reviseMutate, isPending: false }),
}));

import { RevisionBanner } from "./RevisionBanner";

const originalLang = i18n.language;
afterAll(async () => {
  await i18n.changeLanguage(originalLang);
});
beforeEach(async () => {
  await i18n.changeLanguage("ja");
  reviseMutate.mockReset();
});

function report(partial: Partial<AuditReport>): AuditReport {
  return {
    id: "r1",
    status: "finalized",
    version: "V1.0",
    version_major: 1,
    version_minor: 0,
    previous_version_id: null,
    report_id_display: "AR-1",
    ...partial,
  } as unknown as AuditReport;
}

function renderBanner(latest: AuditReport | null) {
  return render(
    <MemoryRouter>
      <RevisionBanner projectId="p1" latestReport={latest} />
    </MemoryRouter>,
  );
}

describe("RevisionBanner", () => {
  it("shows the lock banner and opens the revise dialog with a prefilled reason", () => {
    renderBanner(report({ status: "finalized" }));
    expect(screen.getByText("編集ロック中")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /改訂して編集/ }));

    // dialog opened (its title renders on open)
    expect(screen.getByText("改訂を要求")).toBeInTheDocument();
    // client-feedback reason is prefilled so the revision carries audit context
    expect(
      screen.getByDisplayValue("クライアントフィードバック対応（本文の手動修正）"),
    ).toBeInTheDocument();
  });

  it("shows draft-revision guidance pointing only to sign (no delivery dead-end)", () => {
    renderBanner(
      report({ status: "draft", previous_version_id: "r0", version_minor: 1 }),
    );
    expect(screen.getByText("下書き改訂中")).toBeInTheDocument();

    const signLink = screen.getByRole("link", {
      name: /コンプライアンスを再確認して署名/,
    });
    expect(signLink).toHaveAttribute("href", "/projects/p1/audit");
    // No delivery link here: create_delivery rejects a draft head report.
    expect(
      screen.queryByRole("link", { name: /配信/ }),
    ).not.toBeInTheDocument();
  });

  it("renders nothing for a first-ever draft (no previous version) or when unlocked", () => {
    const { container } = renderBanner(
      report({ status: "draft", previous_version_id: null }),
    );
    expect(container).toBeEmptyDOMElement();
  });
});
