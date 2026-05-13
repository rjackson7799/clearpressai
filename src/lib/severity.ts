import type { ComplianceSeverity } from "@/types/domain";

// Severity ordering + labels lifted from CompliancePanel so the audit
// report UI (T8) can render findings without pulling in Sheet/Tabs/Badge
// chrome. Pure data; no React.

export const SEVERITY_ORDER: ComplianceSeverity[] = [
  "blocker",
  "warning",
  "note",
];

export const SEVERITY_LABEL: Record<
  ComplianceSeverity,
  { ja: string; en: string }
> = {
  blocker: { ja: "阻止", en: "Blocker" },
  warning: { ja: "警告", en: "Warning" },
  note: { ja: "注意", en: "Note" },
};

export const SEVERITY_VARIANT: Record<
  ComplianceSeverity,
  "destructive" | "default" | "secondary"
> = {
  blocker: "destructive",
  warning: "default",
  note: "secondary",
};
