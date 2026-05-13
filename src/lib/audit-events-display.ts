import type { Database } from "@/types/database";

type AuditTrailEventRow =
  Database["public"]["Tables"]["audit_trail_events"]["Row"];

export interface BilingualText {
  ja: string;
  en: string;
}

const EVENT_TYPE_LABEL: Record<string, BilingualText> = {
  variant_generated: { ja: "変種生成", en: "Variant generated" },
  variant_approved: { ja: "変種承認", en: "Variant approved" },
  compliance_checked: {
    ja: "コンプライアンスチェック",
    en: "Compliance checked",
  },
  compliance_rechecked: {
    ja: "コンプライアンス再チェック",
    en: "Compliance re-checked",
  },
  manual_review_started: { ja: "手動レビュー開始", en: "Manual review started" },
  fix_applied: { ja: "修正適用", en: "Fix applied" },
  acknowledge_finding: {
    ja: "指摘事項を確認済みに",
    en: "Finding acknowledged",
  },
  audit_report_created: { ja: "監査レポート作成", en: "Audit report created" },
  audit_revision_started: {
    ja: "監査レポート改訂開始",
    en: "Audit revision started",
  },
  sign_off: { ja: "署名・確定", en: "Sign off" },
  delivery_sent: { ja: "配信送信", en: "Delivery sent" },
  feedback_received: { ja: "フィードバック受信", en: "Feedback received" },
  voice_updated: { ja: "ボイス更新", en: "Voice profile updated" },
};

export function getEventTypeLabel(eventType: string): BilingualText {
  return EVENT_TYPE_LABEL[eventType] ?? { ja: eventType, en: eventType };
}

export function getActorDisplay(
  row: Pick<AuditTrailEventRow, "actor_type" | "actor_name_snapshot">,
): BilingualText {
  if (row.actor_type === "system" || !row.actor_name_snapshot) {
    return { ja: "システム", en: "System" };
  }
  return { ja: row.actor_name_snapshot, en: row.actor_name_snapshot };
}

export function isBackfilledEvent(
  row: Pick<AuditTrailEventRow, "details">,
): boolean {
  if (row.details === null || typeof row.details !== "object") return false;
  const details = row.details as Record<string, unknown>;
  return details.completeness === "latest_state_only";
}

export function getEventDetailValue(
  row: Pick<AuditTrailEventRow, "details">,
  key: string,
): unknown {
  if (row.details === null || typeof row.details !== "object") return undefined;
  return (row.details as Record<string, unknown>)[key];
}
