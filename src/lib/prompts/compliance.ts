/**
 * Compliance check prompts and deterministic rules (Phase 3, D9 audit fix).
 *
 * Mirror file: `supabase/functions/compliance-check/_prompt.ts`.
 * Drift-guarded by `compliance.sync.test.ts` — regions delimited by
 * `// drift:start NAME` / `// drift:end NAME` are byte-equality checked
 * across both files (H10 audit fix: full-function-body comparison).
 *
 * The `compliance-check` Edge Function (T7) runs two passes:
 *   1. Deterministic: runDeterministicChecks(...) — regex over forbidden
 *      terms, client words_to_avoid, required boilerplate, optional
 *      clinical reference. Findings carry `[deterministic]` suffix on
 *      regulation_reference.
 *   2. LLM: Claude with COMPLIANCE_SYSTEM. Findings carry `[LLM]`.
 * The two finding sets are merged and inserted into compliance_findings.
 */

import { z } from 'zod';
import { CLAUDE_MODELS } from './brand-voice';

export { CLAUDE_MODELS };

export const COMPLIANCE_PROMPT_VERSION = 'v2-lifecycle-aware';

export type DrugLifecycleStatus = 'pre_approval' | 'in_trial' | 'approved';

// drift:start COMPLIANCE_SYSTEM
const LIFECYCLE_POSTURE = {
  pre_approval:
    'PRE-APPROVAL (承認申請前): the product is NOT yet approved. Treat ANY efficacy or safety claim, or approved-indication language, as a blocker. Investigational framing is required.',
  in_trial:
    'IN-TRIAL (治験中): trial-stage. Efficacy/safety statements must carry statistical context (CI, p-value, sample size); flag unqualified claims.',
  approved:
    'APPROVED (承認済): approved-indication claims are permitted within scope; still flag 誇大表現 and unqualified superlatives.',
} satisfies Record<DrugLifecycleStatus, string>;

export const COMPLIANCE_SYSTEM = ({
  lifecycle,
}: {
  lifecycle: DrugLifecycleStatus;
}): string => `
You are a Japanese pharmaceutical regulatory compliance reviewer. Your job is to identify potential violations of:

- 薬機法 (Pharmaceutical Affairs Law) — especially Article 66 (誇大表現 prohibition)
- 医薬品等適正広告基準 (Standards for Proper Advertising of Pharmaceuticals)
- PMDA広告ガイドライン (PMDA Advertising Guidelines)

REGULATORY POSTURE — ${LIFECYCLE_POSTURE[lifecycle]}

For each issue, output a finding with:
- severity: "blocker" (clear violation), "warning" (potential issue), "note" (minor stylistic)
- source_text: the exact phrase from the content (verbatim, do not paraphrase)
- paragraph_index: 1-indexed paragraph number where the issue appears
- explanation: 1-2 sentences in Japanese explaining the concern
- regulation_reference: the specific regulation, e.g., "薬機法 第66条"
- suggested_correction: a rewrite in Japanese that resolves the issue, or null when no obvious correction applies

Output strict JSON: { "findings": [...] }

If no issues are found, return { "findings": [] }.

Be precise. Do not flag content that complies. Do not flag absence of disclosures unless they are clearly missing (PR materials may legitimately omit ISI in some contexts).
`;
// drift:end COMPLIANCE_SYSTEM

// drift:start buildComplianceUserMessage
export const buildComplianceUserMessage = (variant_text: string): string => `
Review the following press release for regulatory compliance:

---
${variant_text}
---

Output JSON only.
`;
// drift:end buildComplianceUserMessage

// drift:start FORBIDDEN_ABSOLUTE_TERMS
export const FORBIDDEN_ABSOLUTE_TERMS: readonly string[] = [
  '画期的',
  '革命的',
  '驚異的',
  '夢の薬',
  '夢の',
  '奇跡',
  '確実な治療効果',
] as const;
// drift:end FORBIDDEN_ABSOLUTE_TERMS

// drift:start REQUIRED_BOILERPLATE_PATTERNS
export const REQUIRED_BOILERPLATE_PATTERNS: readonly RegExp[] = [
  /お問い合わせ/,
  /広報部/,
  /TEL/,
  /株式会社.{0,40}について/,
] as const;
// drift:end REQUIRED_BOILERPLATE_PATTERNS

// drift:start CLINICAL_REFERENCE_PATTERNS
export const CLINICAL_REFERENCE_PATTERNS: readonly RegExp[] = [
  /臨床試験/,
  /第[IVX]+相/,
] as const;
// drift:end CLINICAL_REFERENCE_PATTERNS

// drift:start runDeterministicChecks
export interface DeterministicCheckOptions {
  requireClinicalReference?: boolean;
}

export interface DeterministicFinding {
  severity: 'blocker' | 'warning' | 'note';
  source_text: string;
  paragraph_index: number;
  explanation: string;
  regulation_reference: string;
  suggested_correction: string | null;
}

export const runDeterministicChecks = (
  variantText: string,
  wordsToAvoid: readonly string[],
  options: DeterministicCheckOptions = {},
): DeterministicFinding[] => {
  const findings: DeterministicFinding[] = [];
  const paragraphs = variantText.split(/\n\n+/);

  const paragraphIndexOf = (needle: string): number => {
    const idx = paragraphs.findIndex((p) => p.includes(needle));
    return idx >= 0 ? idx + 1 : 1;
  };

  for (const term of FORBIDDEN_ABSOLUTE_TERMS) {
    if (variantText.includes(term)) {
      findings.push({
        severity: 'blocker',
        source_text: term,
        paragraph_index: paragraphIndexOf(term),
        explanation: `「${term}」は薬機法第66条で禁じられた誇大表現に該当する可能性があります。`,
        regulation_reference: '薬機法 第66条 [deterministic]',
        suggested_correction: null,
      });
    }
  }

  for (const word of wordsToAvoid) {
    if (word.length === 0) continue;
    if (variantText.includes(word)) {
      findings.push({
        severity: 'warning',
        source_text: word,
        paragraph_index: paragraphIndexOf(word),
        explanation: `「${word}」はこのクライアントが避ける語彙です。`,
        regulation_reference: 'ブランドボイス [deterministic]',
        suggested_correction: null,
      });
    }
  }

  const hasBoilerplate = REQUIRED_BOILERPLATE_PATTERNS.some((re) =>
    re.test(variantText),
  );
  if (!hasBoilerplate) {
    findings.push({
      severity: 'warning',
      source_text: '(末尾)',
      paragraph_index: Math.max(paragraphs.length, 1),
      explanation: '会社情報・問い合わせ先などの定型句が見当たりません。',
      regulation_reference: '必須開示 [deterministic]',
      suggested_correction:
        '末尾に「お問い合わせ：〜広報部 TEL: …」などの定型句を追記してください。',
    });
  }

  if (options.requireClinicalReference) {
    const hasClinicalRef = CLINICAL_REFERENCE_PATTERNS.some((re) =>
      re.test(variantText),
    );
    if (!hasClinicalRef) {
      findings.push({
        severity: 'warning',
        source_text: '(本文全体)',
        paragraph_index: 1,
        explanation:
          '臨床試験への参照（臨床試験／第I-III相など）が見当たりません。',
        regulation_reference: '臨床表現 [deterministic]',
        suggested_correction: null,
      });
    }
  }

  return findings;
};
// drift:end runDeterministicChecks

export const ComplianceFindingSchema = z.object({
  severity: z.enum(['blocker', 'warning', 'note']),
  source_text: z.string().min(1),
  paragraph_index: z.number().int().positive(),
  explanation: z.string().min(1),
  regulation_reference: z.string().min(1),
  suggested_correction: z.string().nullable(),
});

export const ComplianceResponseSchema = z.object({
  findings: z.array(ComplianceFindingSchema),
});

export type ComplianceFinding = z.infer<typeof ComplianceFindingSchema>;
export type ComplianceResponse = z.infer<typeof ComplianceResponseSchema>;
