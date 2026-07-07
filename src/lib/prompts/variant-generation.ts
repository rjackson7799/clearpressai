/**
 * Variant generation prompts (Phase 3).
 *
 * Mirror file: `supabase/functions/generate-variants/_prompt.ts`.
 * Drift-guarded by `variant-generation.sync.test.ts` — the regions delimited
 * by `// drift:start NAME` / `// drift:end NAME` are byte-equality checked
 * across both files (H10 audit fix: full-function-body comparison, not just
 * static template fragments).
 *
 * Why duplicated: Deno resolves `npm:zod` from JSR; sharing one file across
 * the Vite/Deno boundary is brittle for a solo-dev repo.
 *
 * CLAUDE_MODELS lives in `./brand-voice` (single source of truth) and is
 * re-exported here for Vite consumers. The Deno mirror declares its own
 * identical CLAUDE_MODELS — the brand-voice sync test asserts those two
 * match, transitively covering this file.
 */

import { z } from 'zod';
import { CLAUDE_MODELS } from './brand-voice';

export { CLAUDE_MODELS };

export const VARIANT_GENERATION_PROMPT_VERSION = 'v2-audience-lifecycle';

export type ContentSubType =
  | 'auto'
  | 'full_clinical'
  | 'partner_ack'
  | 'csr_event'
  | 'business_news';

export type VariationAxis = 'tone' | 'structure' | 'length';

export type TargetAudience =
  | 'hcp'
  | 'patient_public'
  | 'investor_ir'
  | 'trade_media'
  | 'news_media';

export type DrugLifecycleStatus = 'pre_approval' | 'in_trial' | 'approved';

export type DistributionChannel =
  | 'pr_times'
  | 'corporate_site'
  | 'trade_press'
  | 'wire_service'
  | 'other';

// drift:start VARIATION_DIRECTIVES
export const VARIATION_DIRECTIVES = {
  tone: {
    1: {
      label: 'フォーマル',
      directive:
        'Use the most formal register. Lead with company name and full credentials. Use 受動態 (passive voice) where natural for professional distance.',
    },
    2: {
      label: 'バランス',
      directive:
        'Use a balanced register. Lead with the key finding or news. Use active voice. This is the standard pharmaceutical PR tone.',
    },
    3: {
      label: 'アクセシブル',
      directive:
        'Use a more accessible register while remaining professional. Lead with patient impact. Explain technical terms briefly. Suitable for general media.',
    },
  },
  structure: {
    1: {
      label: 'データ先行',
      directive:
        'Lead the announcement with the headline data point or statistic.',
    },
    2: {
      label: '引用先行',
      directive:
        'Lead with an executive quote that frames the announcement.',
    },
    3: {
      label: '発表先行',
      directive:
        'Lead with the announcement itself, then provide supporting detail.',
    },
  },
  length: {
    1: {
      label: '簡潔',
      directive:
        'Write a concise version — roughly 60% of the standard length.',
    },
    2: {
      label: '標準',
      directive: 'Write at the standard length for this content type.',
    },
    3: {
      label: '詳細',
      directive:
        'Write a detailed version — roughly 140% of the standard length, with additional context.',
    },
  },
} as const;
// drift:end VARIATION_DIRECTIVES

// drift:start VARIANT_GENERATION_SYSTEM
export interface VariantSystemArgs {
  voiceProfile: {
    tone_keywords: string[];
    stylistic_patterns: string;
    preferred_vocabulary: string[];
    words_to_avoid: string[];
    signature_phrases: string[];
    length_norms: Record<string, string>;
  };
  guidelines: string[];
  contentType: string;
  subType:
    | 'auto'
    | 'full_clinical'
    | 'partner_ack'
    | 'csr_event'
    | 'business_news';
  language: 'ja' | 'en';
  audience: TargetAudience;
  lifecycle: DrugLifecycleStatus;
  channel: DistributionChannel;
  lengthTargetChars: number | null;
  enforceHardCap: boolean;
}

const AUDIENCE_INSTRUCTIONS = {
  hcp: 'Healthcare professionals (医療従事者): use precise clinical terminology, cite endpoints and study design, assume domain fluency.',
  patient_public:
    'Patients and general public (患者・一般): use plain language, explain technical terms, lead with patient relevance, avoid jargon.',
  investor_ir:
    'Investors / IR (投資家・IR): frame around business impact, pipeline and corporate strategy; keep clinical detail concise.',
  trade_media:
    'Trade / industry media (業界メディア): journalistic register with industry context; assume sector familiarity.',
  news_media:
    'General news media (報道機関): journalistic register, newsworthy lead, minimal jargon, broad accessibility.',
} satisfies Record<TargetAudience, string>;

const LIFECYCLE_POSTURE = {
  pre_approval:
    'PRE-APPROVAL (承認申請前): the product is NOT yet approved. Use investigational framing ONLY. Do NOT state or imply any efficacy or safety claim, and use no approved-indication language. Treat the 薬機法 gate as strict.',
  in_trial:
    'IN-TRIAL (治験中): trial-stage framing. Report results only alongside statistical context (CI, p-value, sample size); draw no conclusions beyond the data.',
  approved:
    'APPROVED (承認済): approved-indication claims are permitted within the approved scope, with required disclosures.',
} satisfies Record<DrugLifecycleStatus, string>;

const CHANNEL_NOTES = {
  pr_times:
    'PR TIMES — follow standard press-release formatting (headline, dateline, boilerplate footer).',
  corporate_site:
    'Corporate website — company-owned publishing, brand-consistent tone.',
  trade_press: 'Trade press — industry-outlet framing.',
  wire_service: 'Wire service — concise, syndication-ready.',
  other: 'General distribution.',
} satisfies Record<DistributionChannel, string>;

export const VARIANT_GENERATION_SYSTEM = ({
  voiceProfile,
  guidelines,
  contentType,
  subType,
  language,
  audience,
  lifecycle,
  channel,
  lengthTargetChars,
  enforceHardCap,
}: VariantSystemArgs): string => {
  const subTypeBlock =
    subType === 'auto'
      ? "First, internally classify which sub-type best fits this brief (full_clinical / partner_ack / csr_event / business_news). Apply the matching length range. Emit your classification on a single line at the very start of your output in exactly this form: <sub_type_classified>VALUE</sub_type_classified> where VALUE is one of: full_clinical, partner_ack, csr_event, business_news. Then a blank line. Then the press release body."
      : `Apply the length range for sub-type '${subType}'. Do not emit a <sub_type_classified> marker.`;

  const guidelinesBlock =
    guidelines.length > 0
      ? guidelines.map((g) => `- ${g}`).join('\n')
      : '- (none)';

  const lengthHint = voiceProfile.length_norms[contentType] ?? 'standard';

  const lengthTargetBlock =
    lengthTargetChars != null
      ? enforceHardCap
        ? `\nEXPLICIT LENGTH TARGET (HARD CAP): Aim for approximately ${lengthTargetChars}字, and DO NOT exceed ${lengthTargetChars}字 under any circumstance. Count characters before emitting; if over, condense until at or under the cap.\n`
        : `\nEXPLICIT LENGTH TARGET: Aim for approximately ${lengthTargetChars}字. Treat the sub-type cap above as the outer bound.\n`
      : '';

  return `You are a Japanese pharmaceutical PR writer at a top Tokyo PR firm. You write for one specific client whose voice profile is below. Match this voice precisely.

CLIENT VOICE PROFILE:
- Tone: ${voiceProfile.tone_keywords.join(', ')}
- Stylistic patterns: ${voiceProfile.stylistic_patterns}
- Preferred vocabulary: ${voiceProfile.preferred_vocabulary.join(', ')}
- Words to avoid: ${voiceProfile.words_to_avoid.join(', ')}
- Signature phrases (use sparingly when natural): ${voiceProfile.signature_phrases.join(', ')}
- Expected length for ${contentType}: ${lengthHint}

ADDITIONAL GUIDELINES (accumulated from feedback and internal review):
${guidelinesBlock}

TARGET AUDIENCE: ${AUDIENCE_INSTRUCTIONS[audience]}

REGULATORY POSTURE — ${LIFECYCLE_POSTURE[lifecycle]}

DISTRIBUTION CHANNEL: ${CHANNEL_NOTES[channel]}

CONTENT SUB-TYPE LENGTH CAP (HARD — overrides the profile's length string AND any length pull from the variation directive):
- full_clinical (完全臨床発表): 1,200–2,000字. Includes endpoint data, study design, full safety profile.
- partner_ack (パートナー謝辞): 700–1,200字. Brief, focused on the partnership and named executives.
- csr_event (CSR/イベント): 800–1,500字. Activity-focused, may include event details.
- business_news (ビジネスニュース): 700–1,300字. Corporate / organizational announcements.

LENGTH PRECEDENCE: The sub-type cap above is authoritative. If the variation directive implies a longer or shorter style (e.g. "accessible" / "patient-impact lead" / "detailed"), express that style WITHIN the cap by tightening word choice and trimming background — not by exceeding the upper bound. Before emitting, mentally count characters; if over the cap, condense (remove background paragraphs, tighten phrasing) until inside it.
${lengthTargetBlock}
SUB-TYPE: ${subType}
${subTypeBlock}

FACT-INVENTION GUARDRAIL (strict):
Do not invent facts not present in the brief — including company HQ city, executive names, founding year, country counts, etc. If the brief doesn't specify, omit rather than guess.

REGULATORY CONSTRAINTS:
- Comply with 薬機法 (Pharmaceutical Affairs Law). Do not use 誇大表現 (exaggerated expressions).
- Forbidden absolute terms: 画期的, 革命的, 驚異的, 夢の, 奇跡, 確実な治療効果.
- All efficacy claims must include statistical context (CI, p-value, sample size) where available.
- Required disclosures: include company boilerplate (お問い合わせ / 広報部 / TEL / 株式会社…について as appropriate). Where clinical content is present, reference the trial (臨床試験 / 第I-III相) explicitly.

LANGUAGE: ${language === 'ja' ? 'Japanese (日本語)' : 'English'}

Output the press release/content as plain text. No preamble, no explanation, no markdown headers — just the content as it would appear (preceded by the <sub_type_classified> marker line when SUB-TYPE is 'auto').`;
};
// drift:end VARIANT_GENERATION_SYSTEM

// drift:start buildVariantUserMessage
export interface VariantUserMessageArgs {
  contentItem: {
    brief_free_text: string;
    brief_key_messages: string[];
    brief_quotes: { name: string; title: string; quote: string }[];
    brief_data_points: string[];
    brief_constraints: string | null;
  };
  directive: { label: string; directive: string };
}

export const buildVariantUserMessage = ({
  contentItem,
  directive,
}: VariantUserMessageArgs): string => {
  const sections: string[] = [];

  sections.push(`[Brief]\n${contentItem.brief_free_text}`);

  if (contentItem.brief_key_messages.length > 0) {
    sections.push(
      `[Key messages]\n${contentItem.brief_key_messages.map((m) => `- ${m}`).join('\n')}`,
    );
  }

  if (contentItem.brief_quotes.length > 0) {
    sections.push(
      `[Quotes]\n${contentItem.brief_quotes
        .map((q) => `- ${q.name} (${q.title}): 「${q.quote}」`)
        .join('\n')}`,
    );
  }

  if (contentItem.brief_data_points.length > 0) {
    sections.push(
      `[Data points]\n${contentItem.brief_data_points.map((d) => `- ${d}`).join('\n')}`,
    );
  }

  if (contentItem.brief_constraints) {
    sections.push(`[Constraints]\n${contentItem.brief_constraints}`);
  }

  sections.push(
    `[Variation directive: ${directive.label}]\n${directive.directive}`,
  );

  return `${sections.join('\n\n')}\n\nWrite the content per the directive above.`;
};
// drift:end buildVariantUserMessage

// drift:start parseSubTypeMarker
export const parseSubTypeMarker = (
  text: string,
): { body: string; sub_type_classified: string | null } => {
  const match = text.match(
    /<sub_type_classified>\s*([a-z_]+)\s*<\/sub_type_classified>/,
  );
  if (!match) {
    return { body: text.trim(), sub_type_classified: null };
  }
  const sub_type = match[1].trim();
  const body = text.replace(match[0], '').replace(/^\s+/, '').trim();
  return { body, sub_type_classified: sub_type };
};
// drift:end parseSubTypeMarker

// drift:start evaluateHardCap
export interface HardCapArgs {
  charCount: number;
  lengthTargetChars: number | null;
  enforceHardCap: boolean;
}

/**
 * Whether a generated draft violates the hard cap. Inactive (disabled or no
 * target) never violates. Kept pure so the enforce → retry → error decision in
 * generate-variants is unit-testable without a live API.
 */
export const exceedsHardCap = ({
  charCount,
  lengthTargetChars,
  enforceHardCap,
}: HardCapArgs): boolean => {
  if (!enforceHardCap || lengthTargetChars == null) return false;
  return charCount > lengthTargetChars;
};
// drift:end evaluateHardCap

export const VariantResponseSchema = z.object({
  body_text: z.string().min(1),
  sub_type_classified: z.string().nullable(),
});

export type VariantResponse = z.infer<typeof VariantResponseSchema>;
