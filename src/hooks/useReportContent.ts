import { useMemo } from "react";
import { useContentItemForProject } from "@/hooks/useProjects";
import { useVariantsForContentItem } from "@/hooks/useVariants";
import { useComplianceFindings } from "@/hooks/useComplianceFindings";
import type {
  AuditReport,
  ComplianceSeverity,
  ContentVariant,
} from "@/types/domain";
import type { ComplianceFindingWithStale } from "@/hooks/useComplianceFindings";
import type {
  AuditReportSnapshot,
  SnapshotFinding,
  SnapshotVariant,
} from "@/types/audit-snapshot";

interface UseReportContentResult {
  content: AuditReportSnapshot | null;
  isLoading: boolean;
  source: "snapshot" | "live" | "none";
}

// I2: finalized/revised reports render from the immutable report_snapshot;
// drafts render from live data (filtered to approved variants). Live mode
// keeps internal_approved_by.name as null since live rows hold only the
// UUID; finalize-time snapshots have the resolved name baked in.
export function useReportContent(
  report: AuditReport | null | undefined,
): UseReportContentResult {
  const isFinalizedShape =
    report?.status === "finalized" || report?.status === "revised";

  const { data: contentItem, isLoading: itemLoading } =
    useContentItemForProject(isFinalizedShape ? undefined : report?.project_id);
  const { data: variants, isLoading: variantsLoading } =
    useVariantsForContentItem(isFinalizedShape ? undefined : contentItem?.id);
  const { data: findingsByVariant, isLoading: findingsLoading } =
    useComplianceFindings(
      isFinalizedShape ? undefined : contentItem?.id,
      variants,
    );

  return useMemo<UseReportContentResult>(() => {
    if (!report) return { content: null, isLoading: false, source: "none" };

    if (isFinalizedShape) {
      const snapshot = report.report_snapshot as AuditReportSnapshot | null;
      return {
        content: snapshot,
        isLoading: false,
        source: "snapshot",
      };
    }

    if (itemLoading || variantsLoading || findingsLoading) {
      return { content: null, isLoading: true, source: "live" };
    }

    return {
      content: buildSnapshotFromLive(variants ?? [], findingsByVariant ?? {}),
      isLoading: false,
      source: "live",
    };
  }, [
    report,
    isFinalizedShape,
    itemLoading,
    variantsLoading,
    findingsLoading,
    variants,
    findingsByVariant,
  ]);
}

function buildSnapshotFromLive(
  variants: ContentVariant[],
  findingsByVariant: Record<string, ComplianceFindingWithStale[]>,
): AuditReportSnapshot {
  const approved = variants
    .filter((v) => v.internal_approved)
    .slice()
    .sort((a, b) => a.variant_index - b.variant_index);

  return {
    variants: approved.map((v): SnapshotVariant => {
      const findings = (findingsByVariant[v.id] ?? [])
        .slice()
        .sort((a, b) => a.id.localeCompare(b.id))
        .map(
          (f): SnapshotFinding => ({
            id: f.id,
            variant_id: f.variant_id,
            severity: f.severity as ComplianceSeverity,
            source_text: f.source_text,
            paragraph_index: f.paragraph_index,
            explanation: f.explanation,
            regulation_reference: f.regulation_reference,
            suggested_correction: f.suggested_correction,
            resolution_status: f.resolution_status,
            resolved_by: f.resolved_by
              ? { id: f.resolved_by, name: null }
              : null,
            resolved_at: f.resolved_at,
            created_at: f.created_at,
          }),
        );

      return {
        id: v.id,
        variant_label: v.variant_label,
        variant_index: v.variant_index,
        body_text: v.body_text,
        body_html: v.body_html,
        char_count: v.char_count,
        reading_time_seconds: v.reading_time_seconds,
        internal_approved_by: v.internal_approved_by
          ? { id: v.internal_approved_by, name: null }
          : null,
        internal_approved_at: v.internal_approved_at,
        model_used: v.model_used,
        generation_params: v.generation_params,
        findings,
      };
    }),
  };
}
