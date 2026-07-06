/**
 * Bilingual labels for `projects.status`. Shared so the dashboard's recent
 * list and the variant-review header render the same words instead of a raw
 * enum ("in_review") leaking to the user.
 */
export const PROJECT_STATUS_LABELS: Record<string, { ja: string; en: string }> =
  {
    draft: { ja: "下書き", en: "Draft" },
    in_review: { ja: "レビュー中", en: "In Review" },
    delivered: { ja: "送付済", en: "Delivered" },
    feedback_received: { ja: "フィードバック受領", en: "Feedback" },
    completed: { ja: "完了", en: "Completed" },
  };

export function projectStatusLabel(
  status: string | null | undefined,
): { ja: string; en: string } {
  if (!status) return { ja: "—", en: "—" };
  // Unknown status falls back to the raw value in both languages rather than
  // throwing — a new enum value should degrade gracefully, not crash.
  return PROJECT_STATUS_LABELS[status] ?? { ja: status, en: status };
}
