import { describe, it, expect } from 'vitest';
import {
  deriveStats,
  deriveComplianceSnapshot,
  deriveNeedsAttention,
  type DashboardFinding,
  type DraftAuditItem,
} from '@/lib/dashboard-metrics';
import type { Client, ProjectSummary } from '@/types/domain';

const NOW = new Date(2026, 6, 8, 10, 0, 0); // Jul 8 2026

const mkClient = (o: Partial<Client>): Client => o as Client;
const mkProj = (o: Partial<ProjectSummary>): ProjectSummary =>
  o as ProjectSummary;

let seq = 0;
const mkFinding = (o: Partial<DashboardFinding>): DashboardFinding => ({
  id: o.id ?? `f${seq++}`,
  variant_id: o.variant_id ?? `v${seq++}`,
  severity: o.severity ?? 'warning',
  resolution_status: o.resolution_status ?? 'unresolved',
  project_id: o.project_id ?? 'p1',
});

const iso = (y: number, m: number, d: number) => new Date(y, m, d).toISOString();

describe('deriveStats', () => {
  it('counts clients + "new this month" badge only for this-month rows', () => {
    const clients = [
      mkClient({ created_at: iso(2026, 6, 2) }), // July → this month
      mkClient({ created_at: iso(2026, 4, 2) }), // May → not
    ];
    const stats = deriveStats({ clients, projects: [], findings: [] }, NOW);
    const card = stats.find((s) => s.key === 'clients')!;
    expect(card.value).toBe(2);
    expect(card.badge?.en).toBe('+1 this month');
    expect(card.to).toBe('/clients');
  });

  it('projects card counts total + delivered badge across terminal statuses', () => {
    const projects = [
      mkProj({ id: 'a', status: 'draft' }),
      mkProj({ id: 'b', status: 'delivered' }),
      mkProj({ id: 'c', status: 'feedback_received' }),
      mkProj({ id: 'd', status: 'completed' }),
    ];
    const card = deriveStats({ clients: [], projects, findings: [] }, NOW).find(
      (s) => s.key === 'projects',
    )!;
    expect(card.value).toBe(4);
    expect(card.badge?.en).toBe('3 delivered');
  });

  it('in-review card counts in_review + due-today badge (excludes delivered)', () => {
    const projects = [
      mkProj({ id: 'a', status: 'in_review', deadline: iso(2026, 6, 8) }), // today
      mkProj({ id: 'b', status: 'in_review', deadline: iso(2026, 6, 20) }),
      mkProj({ id: 'c', status: 'delivered', deadline: iso(2026, 6, 8) }), // today but done
    ];
    const card = deriveStats({ clients: [], projects, findings: [] }, NOW).find(
      (s) => s.key === 'in_review',
    )!;
    expect(card.value).toBe(2);
    expect(card.badge?.en).toBe('1 due today');
    expect(card.badge?.tone).toBe('warning');
  });

  it('findings card counts open (unresolved) + critical badge from blockers', () => {
    const findings = [
      mkFinding({ severity: 'blocker', resolution_status: 'unresolved' }),
      mkFinding({ severity: 'warning', resolution_status: 'unresolved' }),
      mkFinding({ severity: 'blocker', resolution_status: 'fixed' }), // resolved → excluded
    ];
    const card = deriveStats({ clients: [], projects: [], findings }, NOW).find(
      (s) => s.key === 'findings',
    )!;
    expect(card.value).toBe(2);
    expect(card.badge?.en).toBe('1 critical');
    expect(card.to).toBeUndefined(); // no findings list page
  });

  it('omits badges when their counts are zero', () => {
    const stats = deriveStats({ clients: [], projects: [], findings: [] }, NOW);
    expect(stats.every((s) => s.badge === undefined)).toBe(true);
  });
});

describe('deriveComplianceSnapshot', () => {
  it('sums variants and buckets by distinct variant severity', () => {
    const projects = [
      mkProj({ id: 'p1', variants_total: 3 }),
      mkProj({ id: 'p2', variants_total: 2 }),
    ];
    const findings = [
      mkFinding({ variant_id: 'v1', severity: 'blocker' }),
      mkFinding({ variant_id: 'v1', severity: 'warning' }), // same variant → still critical
      mkFinding({ variant_id: 'v2', severity: 'warning' }),
    ];
    const snap = deriveComplianceSnapshot({ projects, findings });
    expect(snap.variantsTotal).toBe(5);
    expect(snap.criticalVariants).toBe(1); // v1
    expect(snap.cautionVariants).toBe(1); // v2
    expect(snap.cleanVariants).toBe(3);
    expect(snap.cleanPct).toBe(60);
  });

  it('ignores resolved findings and note severity', () => {
    const projects = [mkProj({ variants_total: 4 })];
    const findings = [
      mkFinding({ variant_id: 'v1', severity: 'blocker', resolution_status: 'fixed' }),
      mkFinding({ variant_id: 'v2', severity: 'note', resolution_status: 'unresolved' }),
    ];
    const snap = deriveComplianceSnapshot({ projects, findings });
    expect(snap.criticalVariants).toBe(0);
    expect(snap.cautionVariants).toBe(0);
    expect(snap.cleanVariants).toBe(4);
    expect(snap.cleanPct).toBe(100);
  });

  it('returns null cleanPct when there are no variants', () => {
    const snap = deriveComplianceSnapshot({ projects: [], findings: [] });
    expect(snap.variantsTotal).toBe(0);
    expect(snap.cleanPct).toBeNull();
  });

  it('never lets clean go negative when findings outrun the variant count', () => {
    const projects = [mkProj({ variants_total: 1 })];
    const findings = [
      mkFinding({ variant_id: 'v1', severity: 'blocker' }),
      mkFinding({ variant_id: 'v2', severity: 'warning' }),
    ];
    const snap = deriveComplianceSnapshot({ projects, findings });
    expect(snap.cleanVariants).toBe(0);
    expect(snap.cleanPct).toBe(0);
  });
});

describe('deriveNeedsAttention', () => {
  const projects = [
    mkProj({ id: 'p1', name: 'Phase III topline', deadline: iso(2026, 6, 8), status: 'in_review' }),
    mkProj({ id: 'p2', name: 'Partner news', status: 'draft' }),
  ];

  it('groups open blocker findings by project with a count', () => {
    const findings = [
      mkFinding({ project_id: 'p1', severity: 'blocker' }),
      mkFinding({ project_id: 'p1', severity: 'blocker' }),
      mkFinding({ project_id: 'p1', severity: 'warning' }), // not counted
    ];
    const items = deriveNeedsAttention({ projects, findings, draftReports: [] }, NOW);
    const crit = items.find((i) => i.kind === 'critical_findings')!;
    expect(crit.en).toBe('2 critical findings open');
    expect(crit.subEn).toBe('Phase III topline');
    expect(crit.to).toBe('/projects/p1/review');
    expect(crit.tone).toBe('critical');
  });

  it('surfaces due-today projects and skips terminal ones', () => {
    const withDone = [
      ...projects,
      mkProj({ id: 'p3', name: 'Done', deadline: iso(2026, 6, 8), status: 'delivered' }),
    ];
    const items = deriveNeedsAttention(
      { projects: withDone, findings: [], draftReports: [] },
      NOW,
    );
    const due = items.filter((i) => i.kind === 'due_today');
    expect(due).toHaveLength(1);
    expect(due[0].to).toBe('/projects/p1/review');
  });

  it('links draft audit items to the audit page with the reportId query', () => {
    const draftReports: DraftAuditItem[] = [
      { id: 'r9', project_id: 'p2', report_id_display: 'AR-002', project_name: 'Partner news' },
    ];
    const items = deriveNeedsAttention({ projects, findings: [], draftReports }, NOW);
    const audit = items.find((i) => i.kind === 'draft_audit')!;
    expect(audit.to).toBe('/projects/p2/audit?reportId=r9');
    expect(audit.subEn).toBe('Partner news · AR-002');
    expect(audit.en).toBe('Draft audit awaiting signature');
  });

  it('orders critical → due → audit and caps at five items', () => {
    const findings = Array.from({ length: 4 }, (_, i) =>
      mkFinding({ project_id: `x${i}`, severity: 'blocker' }),
    );
    const bigProjects = [
      ...projects,
      ...Array.from({ length: 4 }, (_, i) =>
        mkProj({ id: `x${i}`, name: `X${i}` }),
      ),
    ];
    const draftReports: DraftAuditItem[] = [
      { id: 'r1', project_id: 'p2', report_id_display: 'AR-1', project_name: 'P2' },
      { id: 'r2', project_id: 'p2', report_id_display: 'AR-2', project_name: 'P2' },
    ];
    const items = deriveNeedsAttention(
      { projects: bigProjects, findings, draftReports },
      NOW,
    );
    expect(items).toHaveLength(5);
    expect(items[0].kind).toBe('critical_findings');
    // 4 criticals + 1 due-today fills the cap; audits are pushed out.
    expect(items.some((i) => i.kind === 'draft_audit')).toBe(false);
  });

  it('is empty when nothing needs attention', () => {
    const items = deriveNeedsAttention(
      { projects: [mkProj({ id: 'p9', status: 'draft' })], findings: [], draftReports: [] },
      NOW,
    );
    expect(items).toHaveLength(0);
  });
});
