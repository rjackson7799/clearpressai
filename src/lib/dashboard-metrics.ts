/**
 * Pure, React-free derivations for the dashboard. Mirrors the shape of
 * src/lib/onboarding.ts — every metric is computed from already-fetched rows
 * so it's unit-testable without a query client. `now` is always passed in
 * (never `new Date()` inside these helpers or in render — `react-hooks/purity`).
 *
 * Naming maps the concept's words onto the real enums: "in progress" → the
 * `in_review` status; "critical" → `blocker` severity; "caution" → `warning`.
 */
import type { Client, ProjectSummary } from '@/types/domain';

/** Flattened finding row from useComplianceFindingsGlobal (project_id lifted
 * out of the content_variants → content_items embed). */
export interface DashboardFinding {
  id: string;
  variant_id: string;
  severity: string; // 'blocker' | 'warning' | 'note'
  resolution_status: string; // 'unresolved' | 'fixed' | 'acknowledged'
  project_id: string | null;
}

/** Cross-project draft audit report from useDraftAuditReports. */
export interface DraftAuditItem {
  id: string;
  project_id: string;
  report_id_display: string;
  project_name: string | null;
}

const TERMINAL_STATUSES = ['delivered', 'feedback_received', 'completed'];

function startOfLocalDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return startOfLocalDay(a) === startOfLocalDay(b);
}

function isThisMonth(d: Date, now: Date): boolean {
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

// ── Stat cards ─────────────────────────────────────────────────────────────

export type StatTone = 'default' | 'positive' | 'warning' | 'critical';
export type StatKey = 'clients' | 'projects' | 'in_review' | 'findings';

export interface StatBadge {
  ja: string;
  en: string;
  tone: StatTone;
}

export interface StatViewModel {
  key: StatKey;
  labelJa: string;
  labelEn: string;
  value: number;
  badge?: StatBadge;
  to?: string;
}

export function deriveStats(
  input: {
    clients: Client[];
    projects: ProjectSummary[];
    findings: DashboardFinding[];
  },
  now: Date,
): StatViewModel[] {
  const { clients, projects, findings } = input;

  const newThisMonth = clients.filter(
    (c) => c.created_at && isThisMonth(new Date(c.created_at), now),
  ).length;

  const delivered = projects.filter(
    (p) => p.status != null && TERMINAL_STATUSES.includes(p.status),
  ).length;

  const inReview = projects.filter((p) => p.status === 'in_review').length;

  const dueToday = projects.filter(
    (p) =>
      p.deadline != null &&
      isSameLocalDay(new Date(p.deadline), now) &&
      (p.status == null || !TERMINAL_STATUSES.includes(p.status)),
  ).length;

  const openFindings = findings.filter(
    (f) => f.resolution_status === 'unresolved',
  );
  const openCount = openFindings.length;
  const criticalCount = openFindings.filter(
    (f) => f.severity === 'blocker',
  ).length;

  return [
    {
      key: 'clients',
      labelJa: 'クライアント',
      labelEn: 'Active clients',
      value: clients.length,
      to: '/clients',
      badge:
        newThisMonth > 0
          ? { ja: `+${newThisMonth} 今月`, en: `+${newThisMonth} this month`, tone: 'positive' }
          : undefined,
    },
    {
      key: 'projects',
      labelJa: 'プロジェクト',
      labelEn: 'Total projects',
      value: projects.length,
      to: '/projects',
      badge:
        delivered > 0
          ? { ja: `${delivered} 送付済`, en: `${delivered} delivered`, tone: 'positive' }
          : undefined,
    },
    {
      key: 'in_review',
      labelJa: 'レビュー中',
      labelEn: 'In review',
      value: inReview,
      to: '/projects',
      badge:
        dueToday > 0
          ? { ja: `${dueToday} 本日締切`, en: `${dueToday} due today`, tone: 'warning' }
          : undefined,
    },
    {
      key: 'findings',
      labelJa: '未対応の指摘',
      labelEn: 'Open findings',
      value: openCount,
      badge:
        criticalCount > 0
          ? { ja: `${criticalCount} 重大`, en: `${criticalCount} critical`, tone: 'critical' }
          : undefined,
    },
  ];
}

// ── Compliance snapshot (live current-state) ─────────────────────────────────

export interface ComplianceSnapshot {
  variantsTotal: number;
  cleanVariants: number;
  cautionVariants: number;
  criticalVariants: number;
  /** % of variants with no open findings; null when there are no variants. */
  cleanPct: number | null;
}

export function deriveComplianceSnapshot(input: {
  projects: ProjectSummary[];
  findings: DashboardFinding[];
}): ComplianceSnapshot {
  const variantsTotal = input.projects.reduce(
    (sum, p) => sum + (p.variants_total ?? 0),
    0,
  );

  const open = input.findings.filter((f) => f.resolution_status === 'unresolved');
  const criticalSet = new Set(
    open.filter((f) => f.severity === 'blocker').map((f) => f.variant_id),
  );
  const cautionSet = new Set(
    open
      .filter((f) => f.severity === 'warning')
      .map((f) => f.variant_id)
      // A variant with a blocker is counted critical, not caution.
      .filter((v) => !criticalSet.has(v)),
  );

  const criticalVariants = criticalSet.size;
  const cautionVariants = cautionSet.size;
  // Clamp: findings can reference variants not reflected in a stale
  // variants_total, so never let clean go negative.
  const cleanVariants = Math.max(
    0,
    variantsTotal - criticalVariants - cautionVariants,
  );

  return {
    variantsTotal,
    cleanVariants,
    cautionVariants,
    criticalVariants,
    cleanPct:
      variantsTotal > 0
        ? Math.round((cleanVariants / variantsTotal) * 100)
        : null,
  };
}

// ── Needs your attention ─────────────────────────────────────────────────────

export type AttentionTone = 'critical' | 'warning' | 'info';
export type AttentionKind = 'critical_findings' | 'due_today' | 'draft_audit';

export interface AttentionItem {
  id: string;
  kind: AttentionKind;
  ja: string;
  en: string;
  subJa: string;
  subEn: string;
  to: string;
  tone: AttentionTone;
}

const MAX_ATTENTION_ITEMS = 5;

export function deriveNeedsAttention(
  input: {
    projects: ProjectSummary[];
    findings: DashboardFinding[];
    draftReports: DraftAuditItem[];
  },
  now: Date,
): AttentionItem[] {
  const { projects, findings, draftReports } = input;

  const projectById = new Map<string, ProjectSummary>();
  for (const p of projects) if (p.id) projectById.set(p.id, p);

  const projectName = (id: string | null): string => {
    const name = id ? projectById.get(id)?.name : null;
    return name ?? '—';
  };

  const items: AttentionItem[] = [];

  // 1) Open blocker findings, grouped by project (most severe first).
  const blockersByProject = new Map<string, number>();
  for (const f of findings) {
    if (f.resolution_status !== 'unresolved' || f.severity !== 'blocker') continue;
    if (!f.project_id) continue;
    blockersByProject.set(
      f.project_id,
      (blockersByProject.get(f.project_id) ?? 0) + 1,
    );
  }
  for (const [projectId, count] of blockersByProject) {
    items.push({
      id: `critical:${projectId}`,
      kind: 'critical_findings',
      ja: `重大な指摘が${count}件`,
      en: `${count} critical finding${count === 1 ? '' : 's'} open`,
      subJa: projectName(projectId),
      subEn: projectName(projectId),
      to: `/projects/${projectId}/review`,
      tone: 'critical',
    });
  }

  // 2) Projects with a deadline today that aren't already delivered/done.
  for (const p of projects) {
    if (!p.id || !p.deadline) continue;
    if (p.status != null && TERMINAL_STATUSES.includes(p.status)) continue;
    if (!isSameLocalDay(new Date(p.deadline), now)) continue;
    items.push({
      id: `due:${p.id}`,
      kind: 'due_today',
      ja: '本日締切',
      en: 'Due today',
      subJa: p.name ?? '—',
      subEn: p.name ?? '—',
      to: `/projects/${p.id}/review`,
      tone: 'warning',
    });
  }

  // 3) Assembled-but-unsigned audit reports.
  for (const r of draftReports) {
    items.push({
      id: `audit:${r.id}`,
      kind: 'draft_audit',
      ja: '監査ドラフトの署名待ち',
      en: 'Draft audit awaiting signature',
      subJa: `${r.project_name ?? '—'} · ${r.report_id_display}`,
      subEn: `${r.project_name ?? '—'} · ${r.report_id_display}`,
      to: `/projects/${r.project_id}/audit?reportId=${r.id}`,
      tone: 'info',
    });
  }

  return items.slice(0, MAX_ATTENTION_ITEMS);
}
