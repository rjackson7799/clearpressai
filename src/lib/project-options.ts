/**
 * Single source of truth for the New Project generation-lever option lists
 * (audience / lifecycle / channel / length tier). Reused by the form schema,
 * the form UI, and the client-side summary.
 *
 * The generate-variants / compliance-check prompt modules deliberately declare
 * their OWN copies of these unions (drift-mirrored to their Deno `_prompt.ts`),
 * because those files cannot import from `src/`. Their instruction maps use
 * `satisfies Record<Union, string>` so a new enum value fails typecheck there.
 */
import type {
  TargetAudience,
  DrugLifecycleStatus,
  DistributionChannel,
  LengthTier,
} from '@/types/domain';

export interface LabeledOption<V extends string> {
  value: V;
  ja: string;
  en: string;
}

export const TARGET_AUDIENCES: readonly LabeledOption<TargetAudience>[] = [
  { value: 'hcp', ja: '医療従事者', en: 'HCP' },
  { value: 'patient_public', ja: '患者・一般', en: 'Patient / Public' },
  { value: 'investor_ir', ja: '投資家・IR', en: 'Investor / IR' },
  { value: 'trade_media', ja: '業界メディア', en: 'Trade media' },
  { value: 'news_media', ja: '報道機関', en: 'News media' },
];

export const DRUG_LIFECYCLE_STATUSES: readonly LabeledOption<DrugLifecycleStatus>[] =
  [
    { value: 'pre_approval', ja: '承認申請前', en: 'Pre-approval' },
    { value: 'in_trial', ja: '治験中', en: 'In-trial' },
    { value: 'approved', ja: '承認済', en: 'Approved' },
  ];

export const DISTRIBUTION_CHANNELS: readonly LabeledOption<DistributionChannel>[] =
  [
    { value: 'pr_times', ja: 'PR TIMES', en: 'PR TIMES' },
    { value: 'corporate_site', ja: '自社サイト', en: 'Corporate site' },
    { value: 'trade_press', ja: '業界紙', en: 'Trade press' },
    { value: 'wire_service', ja: '通信社', en: 'Wire service' },
    { value: 'other', ja: 'その他', en: 'Other' },
  ];

export const LENGTH_TIERS: readonly LabeledOption<LengthTier>[] = [
  { value: 'short', ja: '短め', en: 'Short' },
  { value: 'standard', ja: '標準', en: 'Standard' },
  { value: 'long', ja: '長め', en: 'Long' },
];

/** Segmented tier → preset 文字 target the form writes into length_target_chars. */
export const LENGTH_TIER_PRESET_CHARS = {
  short: 400,
  standard: 800,
  long: 1600,
} satisfies Record<LengthTier, number>;

const values = <V extends string>(opts: readonly LabeledOption<V>[]): [V, ...V[]] =>
  opts.map((o) => o.value) as [V, ...V[]];

export const TARGET_AUDIENCE_VALUES = values(TARGET_AUDIENCES);
export const DRUG_LIFECYCLE_VALUES = values(DRUG_LIFECYCLE_STATUSES);
export const DISTRIBUTION_CHANNEL_VALUES = values(DISTRIBUTION_CHANNELS);
export const LENGTH_TIER_VALUES = values(LENGTH_TIERS);
