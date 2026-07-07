import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Stepper } from '@/components/ui/stepper';
import { BilingualLabel } from '@/components/shared/BilingualLabel';
import { pickLang } from '@/lib/bilingual';
import { complianceLevel, type ComplianceTone } from '@/lib/compliance-level';
import {
  TARGET_AUDIENCES,
  DRUG_LIFECYCLE_STATUSES,
  DISTRIBUTION_CHANNELS,
  LENGTH_TIERS,
  type LabeledOption,
} from '@/lib/project-options';
import type { NewProjectFormValues } from './NewProjectForm.schema';

const toneContainer: Record<ComplianceTone, string> = {
  strict: 'border-destructive/30 bg-destructive/5 text-destructive',
  caution:
    'border-amber-500/40 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  standard: 'border-border bg-muted/40 text-foreground',
};

const toneDot: Record<ComplianceTone, string> = {
  strict: 'bg-destructive',
  caution: 'bg-amber-500',
  standard: 'bg-emerald-500',
};

function optionLabel<V extends string>(
  options: readonly LabeledOption<V>[],
  value: V | undefined,
  lang: string,
): string {
  const found = options.find((o) => o.value === value);
  return found ? pickLang(lang, found.ja, found.en) : '—';
}

interface Props {
  submitting?: boolean;
}

export function GenerationSummary({ submitting }: Props) {
  const { control, setValue } = useFormContext<NewProjectFormValues>();
  const { i18n } = useTranslation();
  const lang = i18n.language;

  const language = useWatch({ control, name: 'language' });
  const audience = useWatch({ control, name: 'target_audience' });
  const lifecycle = useWatch({ control, name: 'drug_lifecycle_status' });
  const channel = useWatch({ control, name: 'distribution_channel' });
  const lengthTarget = useWatch({ control, name: 'length_target_chars' });
  const lengthTier = useWatch({ control, name: 'length_tier' });
  const variantCount = useWatch({ control, name: 'variant_count' });

  const level = complianceLevel(lifecycle);
  const lengthLabel =
    lengthTarget != null
      ? `${lengthTarget} 文字`
      : optionLabel(LENGTH_TIERS, lengthTier, lang);

  const rows: { ja: string; en: string; value: string }[] = [
    { ja: '言語', en: 'Language', value: language === 'ja' ? '日本語' : 'English' },
    {
      ja: '想定読者',
      en: 'Audience',
      value: optionLabel(TARGET_AUDIENCES, audience, lang),
    },
    {
      ja: 'ライフサイクル',
      en: 'Lifecycle',
      value: optionLabel(DRUG_LIFECYCLE_STATUSES, lifecycle, lang),
    },
    { ja: '分量', en: 'Length', value: lengthLabel },
    {
      ja: 'チャネル',
      en: 'Channel',
      value: optionLabel(DISTRIBUTION_CHANNELS, channel, lang),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <BilingualLabel ja="生成サマリー" en="Generation summary" />
        </CardTitle>
        <CardDescription>
          <BilingualLabel ja="生成前に確認" en="Review before generating" />
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="space-y-2">
          {rows.map((row) => (
            <div
              key={row.en}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <dt className="text-muted-foreground">
                <BilingualLabel ja={row.ja} en={row.en} />
              </dt>
              <dd className="text-right font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>

        <div
          className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${toneContainer[level.tone]}`}
        >
          <span className={`size-2 shrink-0 rounded-full ${toneDot[level.tone]}`} />
          <span className="font-medium">
            <BilingualLabel ja={level.titleJa} en={level.titleEn} />
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium">
            <BilingualLabel ja="バリエーション数" en="Variants" />
          </span>
          <Stepper
            value={variantCount}
            min={1}
            max={3}
            onValueChange={(v) =>
              setValue('variant_count', v, { shouldDirty: true })
            }
            aria-label="variant count"
          />
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          <BilingualLabel
            ja={`${variantCount}案を生成`}
            en={`Generate ${variantCount} variants`}
          />
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" disabled>
            <BilingualLabel ja="プリセット保存" en="Save as preset" />
          </Button>
          <Button type="button" variant="outline" disabled>
            <BilingualLabel ja="プロンプト確認" en="Preview prompt" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          <BilingualLabel
            ja="推定コストはバリエーション数に比例します。"
            en="Estimated cost scales with variant count."
          />
        </p>
      </CardContent>
    </Card>
  );
}
