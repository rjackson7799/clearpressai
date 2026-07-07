import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import {
  CheckIcon,
  ChevronDownIcon,
  PlusIcon,
  ShieldAlertIcon,
  XIcon,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { BilingualLabel } from '@/components/shared/BilingualLabel';
import { Badge } from '@/components/ui/badge';
import { TagInput } from '@/components/brand-voice/TagInput';
import { FormSectionCard } from '@/components/project/FormSectionCard';
import { AudienceChips } from '@/components/project/AudienceChips';
import { useClients } from '@/hooks/useClients';
import { supabase } from '@/lib/supabase';
import { pickLang } from '@/lib/bilingual';
import { complianceLevel } from '@/lib/compliance-level';
import {
  DRUG_LIFECYCLE_STATUSES,
  DISTRIBUTION_CHANNELS,
  LENGTH_TIERS,
  LENGTH_TIER_PRESET_CHARS,
} from '@/lib/project-options';
import type { NewProjectFormValues } from '@/components/project/NewProjectForm.schema';

const CONTENT_TYPES = [
  { value: 'press_release', ja: 'プレスリリース', en: 'Press Release' },
  { value: 'blog_post', ja: 'ブログ', en: 'Blog Post' },
  { value: 'social_media', ja: 'SNS投稿', en: 'Social Media' },
  { value: 'internal_memo', ja: '社内メモ', en: 'Internal Memo' },
  { value: 'faq', ja: 'FAQ', en: 'FAQ' },
  {
    value: 'executive_statement',
    ja: 'エグゼクティブステートメント',
    en: 'Executive Statement',
  },
] as const;

const SUB_TYPES = [
  { value: 'auto', ja: '自動判定', en: 'Auto-detect' },
  { value: 'full_clinical', ja: '完全臨床発表', en: 'Full Clinical' },
  { value: 'partner_ack', ja: 'パートナー謝辞', en: 'Partner Acknowledgment' },
  { value: 'csr_event', ja: 'CSR/イベント', en: 'CSR / Event' },
  { value: 'business_news', ja: 'ビジネスニュース', en: 'Business News' },
] as const;

const URGENCIES = [
  { value: 'standard', ja: '通常', en: 'Standard' },
  { value: 'priority', ja: '優先', en: 'Priority' },
  { value: 'urgent', ja: '緊急', en: 'Urgent' },
  { value: 'crisis', ja: '危機対応', en: 'Crisis' },
] as const;

function useVoiceProfileForClient(clientId: string | undefined) {
  return useQuery({
    queryKey: ['voice_profile_for_form', clientId],
    enabled: Boolean(clientId),
    queryFn: async (): Promise<Record<string, string> | null> => {
      const { data, error } = await supabase
        .from('brand_voice_profiles')
        .select('length_norms')
        .eq('client_id', clientId!)
        .maybeSingle();
      if (error) throw error;
      return (data?.length_norms ?? null) as Record<string, string> | null;
    },
  });
}

export function NewProjectForm() {
  const { t, i18n } = useTranslation();
  const { data: clients = [] } = useClients();
  const form = useFormContext<NewProjectFormValues>();
  const { control, register, setValue } = form;

  const quotesArray = useFieldArray({ control, name: 'brief_quotes' });

  const watchedClientId = useWatch({ control, name: 'client_id' });
  const watchedContentType = useWatch({ control, name: 'content_type' });
  const watchedLifecycle = useWatch({ control, name: 'drug_lifecycle_status' });
  const watchedBriefText = useWatch({ control, name: 'brief_free_text' }) ?? '';

  const { data: lengthNorms } = useVoiceProfileForClient(
    watchedClientId || undefined,
  );

  useEffect(() => {
    if (watchedContentType !== 'press_release') {
      setValue('content_sub_type', 'auto');
    }
  }, [watchedContentType, setValue]);

  const fallbackKey = (() => {
    if (!lengthNorms || lengthNorms[watchedContentType]) return null;
    if (lengthNorms['press_release']) return 'press_release';
    const keys = Object.keys(lengthNorms);
    return keys.length > 0 ? keys[0] : null;
  })();

  const briefCharCount = watchedBriefText.length;
  const briefStrong = briefCharCount >= 200;

  const level = complianceLevel(watchedLifecycle);

  return (
    <div className="space-y-6">
      {/* § 1 — Project details */}
      <FormSectionCard
        step={1}
        title={<BilingualLabel ja="プロジェクト詳細" en="Project details" />}
        subtitle={
          <BilingualLabel
            ja="対象クライアントと締切"
            en="Who this is for and when it's due"
          />
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={control}
            name="client_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <BilingualLabel ja="クライアント" en="Client" />
                </FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage>
                  {form.formState.errors.client_id?.message
                    ? t(form.formState.errors.client_id.message)
                    : null}
                </FormMessage>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <BilingualLabel ja="プロジェクト名" en="Project name" />
                </FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage>
                  {form.formState.errors.name?.message
                    ? t(form.formState.errors.name.message)
                    : null}
                </FormMessage>
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={control}
            name="content_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <BilingualLabel ja="コンテンツ種別" en="Content type" />
                </FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTENT_TYPES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          <BilingualLabel ja={c.ja} en={c.en} />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />

          {watchedContentType === 'press_release' && (
            <FormField
              control={control}
              name="content_sub_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <BilingualLabel ja="サブタイプ" en="Sub-type" />
                  </FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SUB_TYPES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            <BilingualLabel ja={s.ja} en={s.en} />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
          )}
        </div>

        {fallbackKey && (
          <Alert>
            <AlertTitle>
              <BilingualLabel
                ja="ボイスプロファイルにこのコンテンツ種別の標準分量がありません"
                en="No length norm in voice profile for this content type"
              />
            </AlertTitle>
            <AlertDescription>
              <BilingualLabel
                ja={`代替として「${fallbackKey}」の分量を使用します。`}
                en={`Falling back to the "${fallbackKey}" length norm.`}
              />
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={control}
            name="urgency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <BilingualLabel ja="緊急度" en="Urgency" />
                </FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {URGENCIES.map((u) => (
                        <SelectItem key={u.value} value={u.value}>
                          <BilingualLabel ja={u.ja} en={u.en} />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="deadline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <BilingualLabel ja="締切" en="Deadline" />
                </FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
          name="language"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <BilingualLabel ja="言語" en="Language" />
              </FormLabel>
              <FormControl>
                <SegmentedControl
                  value={field.value}
                  onValueChange={field.onChange}
                  options={[
                    { value: 'ja', label: '日本語' },
                    { value: 'en', label: 'English' },
                  ]}
                  aria-label="Language"
                />
              </FormControl>
            </FormItem>
          )}
        />
      </FormSectionCard>

      {/* § 2 — Audience & format */}
      <FormSectionCard
        step={2}
        title={<BilingualLabel ja="読者と形式" en="Audience & format" />}
        subtitle={
          <BilingualLabel
            ja="主要コントロール — 以下に既定値を反映します"
            en="Primary controls — these cascade sensible defaults into the rest"
          />
        }
      >
        <FormField
          control={control}
          name="target_audience"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <BilingualLabel ja="想定読者" en="Target audience" />
                <Badge variant="secondary" className="font-normal">
                  <BilingualLabel ja="主要コントロール" en="Master control" />
                </Badge>
              </FormLabel>
              <FormControl>
                <AudienceChips value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={control}
            name="drug_lifecycle_status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <BilingualLabel
                    ja="薬事ライフサイクル"
                    en="Drug lifecycle status"
                  />
                </FormLabel>
                <FormControl>
                  <SegmentedControl
                    value={field.value}
                    onValueChange={field.onChange}
                    options={DRUG_LIFECYCLE_STATUSES.map((s) => ({
                      value: s.value,
                      label: pickLang(i18n.language, s.ja, s.en),
                    }))}
                    aria-label="Drug lifecycle status"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="length_tier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <BilingualLabel ja="分量" en="Length" />
                </FormLabel>
                <FormControl>
                  <SegmentedControl
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v);
                      setValue('length_target_chars', LENGTH_TIER_PRESET_CHARS[v], {
                        shouldDirty: true,
                      });
                    }}
                    options={LENGTH_TIERS.map((tier) => ({
                      value: tier.value,
                      label: pickLang(i18n.language, tier.ja, tier.en),
                    }))}
                    aria-label="Length"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={control}
            name="length_target_chars"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <BilingualLabel ja="目標文字数" en="Target length (characters)" />
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={100}
                    max={10000}
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      field.onChange(v === '' ? null : Number(v));
                    }}
                  />
                </FormControl>
                <FormMessage>
                  {form.formState.errors.length_target_chars?.message ?? null}
                </FormMessage>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="enforce_hard_cap"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <BilingualLabel ja="上限を厳守" en="Enforce hard cap" />
                </FormLabel>
                <FormControl>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(c) => field.onChange(c === true)}
                    />
                    <BilingualLabel
                      ja="目標文字数を絶対上限として扱う"
                      en="Treat target length as an absolute ceiling"
                    />
                  </label>
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <Alert variant={level.tone === 'strict' ? 'destructive' : 'default'}>
          <ShieldAlertIcon className="size-4" />
          <AlertTitle>
            <BilingualLabel ja={level.titleJa} en={level.titleEn} />
          </AlertTitle>
          <AlertDescription>
            <BilingualLabel ja={level.bodyJa} en={level.bodyEn} />
          </AlertDescription>
        </Alert>
      </FormSectionCard>

      {/* § 3 — Brief & content */}
      <FormSectionCard
        step={3}
        title={<BilingualLabel ja="ブリーフと素材" en="Brief & content" />}
        subtitle={
          <BilingualLabel
            ja="ドラフトの素材となる情報"
            en="The raw material the draft is built from"
          />
        }
      >
        <FormField
          control={control}
          name="brief_free_text"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <BilingualLabel ja="ブリーフ本文" en="Brief" />
                {briefStrong && (
                  <span
                    className="inline-flex items-center text-emerald-600"
                    aria-label="brief is rich"
                  >
                    <CheckIcon className="size-4" />
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {briefCharCount}
                </span>
              </FormLabel>
              <FormControl>
                <Textarea rows={8} {...field} />
              </FormControl>
              <FormMessage>
                {form.formState.errors.brief_free_text?.message
                  ? t(form.formState.errors.brief_free_text.message)
                  : null}
              </FormMessage>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="brief_key_messages"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <BilingualLabel ja="キーメッセージ" en="Key messages" />
              </FormLabel>
              <FormControl>
                <TagInput
                  values={field.value}
                  onChange={field.onChange}
                  placeholder={t('brief.keyMessagesPlaceholder', {
                    defaultValue: '',
                  })}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>
            <BilingualLabel ja="引用" en="Quotes" />
          </FormLabel>
          <div className="space-y-3">
            {quotesArray.fields.map((q, i) => (
              <div
                key={q.id}
                className="space-y-2 rounded-md border bg-muted/30 p-3"
              >
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <Input
                    placeholder={t('brief.quoteName', { defaultValue: '氏名' })}
                    {...register(`brief_quotes.${i}.name`)}
                  />
                  <Input
                    placeholder={t('brief.quoteTitle', { defaultValue: '役職' })}
                    {...register(`brief_quotes.${i}.title`)}
                  />
                </div>
                <Textarea
                  rows={2}
                  placeholder={t('brief.quoteText', { defaultValue: '発言' })}
                  {...register(`brief_quotes.${i}.quote`)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => quotesArray.remove(i)}
                >
                  <XIcon className="size-3" />
                  <BilingualLabel ja="削除" en="Remove" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                quotesArray.append({ name: '', title: '', quote: '' })
              }
            >
              <PlusIcon className="size-3" />
              <BilingualLabel ja="引用を追加" en="Add quote" />
            </Button>
          </div>
        </FormItem>

        <FormField
          control={control}
          name="brief_data_points"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <BilingualLabel ja="データ" en="Data points" />
              </FormLabel>
              <FormControl>
                <TagInput
                  values={field.value}
                  onChange={field.onChange}
                  placeholder={t('brief.dataPointsPlaceholder', {
                    defaultValue: '',
                  })}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="brief_constraints"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <BilingualLabel ja="制約・注意事項" en="Constraints" />
              </FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </FormSectionCard>

      {/* Advanced settings */}
      <details className="group rounded-xl bg-card ring-1 ring-foreground/10">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4">
          <div className="space-y-0.5">
            <div className="font-heading text-base font-medium">
              <BilingualLabel ja="詳細設定" en="Advanced settings" />
            </div>
            <div className="text-sm text-muted-foreground">
              <BilingualLabel
                ja="トーン・コンプライアンス・チャネルの微調整。既定値を適用済み。"
                en="Fine-tune tone, compliance and channel. Sensible defaults applied."
              />
            </div>
          </div>
          <ChevronDownIcon className="size-4 shrink-0 transition-transform group-open:rotate-180" />
        </summary>
        <div className="space-y-4 px-4 pb-4">
          <FormField
            control={control}
            name="distribution_channel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <BilingualLabel ja="配信チャネル" en="Distribution channel" />
                </FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="md:w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DISTRIBUTION_CHANNELS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          <BilingualLabel ja={c.ja} en={c.en} />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </details>
    </div>
  );
}
