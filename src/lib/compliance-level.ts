/**
 * Client-side, display-only mapping from drug lifecycle status → the compliance
 * posture surfaced on the New Project form (banner + summary pill). This mirrors
 * the REGULATORY POSTURE the generate-variants / compliance-check prompts enforce
 * server-side, but it is purely informational here — the server is the trust
 * boundary.
 */
import type { DrugLifecycleStatus } from '@/types/domain';

export type ComplianceTone = 'strict' | 'caution' | 'standard';

export interface ComplianceLevel {
  tone: ComplianceTone;
  titleJa: string;
  titleEn: string;
  bodyJa: string;
  bodyEn: string;
}

export const COMPLIANCE_LEVELS = {
  pre_approval: {
    tone: 'strict',
    titleJa: '厳格 — 承認申請前',
    titleEn: 'Strict — pre-approval',
    bodyJa:
      '有効性・安全性の主張は不可。治験段階としての表現のみ。薬機法ゲートは有効です。',
    bodyEn:
      'No efficacy or safety claims. Investigational framing only; the 薬機法 gate is on.',
  },
  in_trial: {
    tone: 'caution',
    titleJa: '注意 — 治験中',
    titleEn: 'Caution — in-trial',
    bodyJa:
      '治験段階としての表現。結果は統計的根拠（信頼区間・p値・症例数）と併記する場合のみ記載可能。',
    bodyEn:
      'Trial-stage framing. Report results only with statistical context (CI, p-value, sample size).',
  },
  approved: {
    tone: 'standard',
    titleJa: '標準 — 承認済',
    titleEn: 'Standard — approved',
    bodyJa: '承認された効能・効果の範囲で主張可能。必須の開示事項を含めてください。',
    bodyEn:
      'Approved-indication claims permitted within scope; include required disclosures.',
  },
} satisfies Record<DrugLifecycleStatus, ComplianceLevel>;

export function complianceLevel(status: DrugLifecycleStatus): ComplianceLevel {
  return COMPLIANCE_LEVELS[status];
}
