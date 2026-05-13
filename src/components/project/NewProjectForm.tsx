import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckIcon, PlusIcon, XIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BilingualLabel } from '@/components/shared/BilingualLabel';
import { TagInput } from '@/components/brand-voice/TagInput';
import { useClients } from '@/hooks/useClients';
import { supabase } from '@/lib/supabase';
import {
  newProjectFormSchema,
  type NewProjectFormValues,
} from '@/components/project/NewProjectForm.schema';

interface Props {
  onSubmit: (values: NewProjectFormValues) => Promise<void> | void;
  submitting?: boolean;
}

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

export function NewProjectForm({ onSubmit, submitting }: Props) {
  const { t } = useTranslation();
  const { data: clients = [] } = useClients();

  const form = useForm<NewProjectFormValues>({
    resolver: zodResolver(newProjectFormSchema),
    defaultValues: {
      client_id: '',
      name: '',
      content_type: 'press_release',
      content_sub_type: 'auto',
      urgency: 'standard',
      deadline: '',
      variation_axis: 'tone',
      language: 'ja',
      brief_free_text: '',
      brief_key_messages: [],
      brief_quotes: [],
      brief_data_points: [],
      brief_constraints: '',
    },
  });

  const quotesArray = useFieldArray({
    control: form.control,
    name: 'brief_quotes',
  });

  const watchedClientId = useWatch({ control: form.control, name: 'client_id' });
  const watchedContentType = useWatch({
    control: form.control,
    name: 'content_type',
  });
  const watchedBriefText =
    useWatch({ control: form.control, name: 'brief_free_text' }) ?? '';

  const { data: lengthNorms } = useVoiceProfileForClient(
    watchedClientId || undefined,
  );

  useEffect(() => {
    if (watchedContentType !== 'press_release') {
      form.setValue('content_sub_type', 'auto');
    }
  }, [watchedContentType, form]);

  const fallbackKey = (() => {
    if (!lengthNorms || lengthNorms[watchedContentType]) return null;
    if (lengthNorms['press_release']) return 'press_release';
    const keys = Object.keys(lengthNorms);
    return keys.length > 0 ? keys[0] : null;
  })();

  const briefCharCount = watchedBriefText.length;
  const briefStrong = briefCharCount >= 200;

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 max-w-2xl"
      >
        <FormField
          control={form.control}
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
          control={form.control}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
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
              control={form.control}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
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
            control={form.control}
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
          control={form.control}
          name="variation_axis"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <BilingualLabel ja="バリエーション軸" en="Variation axis" />
              </FormLabel>
              <FormControl>
                <RadioGroup
                  className="flex gap-4"
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <label className="flex items-center gap-2">
                    <RadioGroupItem value="tone" />
                    <BilingualLabel ja="トーン" en="Tone" />
                  </label>
                  <label className="flex items-center gap-2">
                    <RadioGroupItem value="structure" />
                    <BilingualLabel ja="構成" en="Structure" />
                  </label>
                  <label className="flex items-center gap-2">
                    <RadioGroupItem value="length" />
                    <BilingualLabel ja="長さ" en="Length" />
                  </label>
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <BilingualLabel ja="言語" en="Language" />
              </FormLabel>
              <FormControl>
                <RadioGroup
                  className="flex gap-4"
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <label className="flex items-center gap-2">
                    <RadioGroupItem value="ja" />
                    <span>日本語</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <RadioGroupItem value="en" />
                    <span>English</span>
                  </label>
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
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
          control={form.control}
          name="brief_key_messages"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <BilingualLabel
                  ja="キーメッセージ"
                  en="Key messages"
                />
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
                className="rounded-md border p-3 space-y-2 bg-muted/30"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input
                    placeholder={t('brief.quoteName', { defaultValue: '氏名' })}
                    {...form.register(`brief_quotes.${i}.name`)}
                  />
                  <Input
                    placeholder={t('brief.quoteTitle', {
                      defaultValue: '役職',
                    })}
                    {...form.register(`brief_quotes.${i}.title`)}
                  />
                </div>
                <Textarea
                  rows={2}
                  placeholder={t('brief.quoteText', {
                    defaultValue: '発言',
                  })}
                  {...form.register(`brief_quotes.${i}.quote`)}
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
          control={form.control}
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
          control={form.control}
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

        <div className="pt-2">
          <Button type="submit" disabled={submitting}>
            <BilingualLabel ja="3案を生成" en="Generate 3 variants" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
