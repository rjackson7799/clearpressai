import type { Json } from "@/types/database";
import type { ComplianceSeverity } from "@/types/domain";

// Mirror of the jsonb shape produced by _build_audit_snapshot() and stored
// in audit_reports.report_snapshot. The Edge Function and the page both
// rely on this; treat changes here as schema-coupled.

export interface SnapshotUserRef {
  id: string;
  name: string | null;
}

export interface SnapshotFinding {
  id: string;
  variant_id: string;
  severity: ComplianceSeverity;
  source_text: string;
  paragraph_index: number | null;
  explanation: string;
  regulation_reference: string;
  suggested_correction: string | null;
  resolution_status: string;
  resolved_by: SnapshotUserRef | null;
  resolved_at: string | null;
  created_at: string;
}

export interface SnapshotVariant {
  id: string;
  variant_label: string;
  variant_index: number;
  body_text: string;
  body_html: string | null;
  char_count: number;
  reading_time_seconds: number;
  internal_approved_by: SnapshotUserRef | null;
  internal_approved_at: string | null;
  model_used: string;
  generation_params: Json;
  findings: SnapshotFinding[];
}

export interface AuditReportSnapshot {
  variants: SnapshotVariant[];
}
