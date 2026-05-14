import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { SendIcon, ClockIcon, AlertTriangleIcon } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { BilingualLabel } from '@/components/shared/BilingualLabel';
import { TagInput } from '@/components/brand-voice/TagInput';
import { useProject } from '@/hooks/useProjects';
import {
  useApprovedVariantsForProject,
  type ApprovedVariantRow,
} from '@/hooks/useApprovedVariantsForProject';
import { useCreateDelivery } from '@/hooks/useCreateDelivery';
import {
  ComposerInputSchema,
  type ComposerInput,
} from '@/lib/types/delivery';
import {
  buildComparisonSummary,
  buildFeedbackFooter,
} from '@/lib/delivery-template';
import { VariantPicker } from '@/components/delivery/VariantPicker';
import { SenderIdentityBanner } from '@/components/delivery/SenderIdentityBanner';
import { ScheduleField } from '@/components/delivery/ScheduleField';
import { DeliveryBodyEditor } from '@/components/delivery/DeliveryBodyEditor';
import { PreSendChecklist } from '@/components/delivery/PreSendChecklist';
import { usePreSendChecklist } from '@/hooks/usePreSendChecklist';
import { ScheduleWarningDialog } from '@/components/delivery/ScheduleWarningDialog';
import { getSchedulingWarnings } from '@/lib/schedule-warnings';
import type { Project } from '@/types/domain';

interface Props {
  projectId: string;
}

const SUB_TYPE_DISPLAY: Record<string, string> = {
  auto: 'プレスリリース',
  full_clinical: 'Full Clinical',
  partner_ack: 'Partner Acknowledgment',
  csr_event: 'CSR / Event',
  business_news: 'Business News',
};

function getVariationDirective(v: ApprovedVariantRow): string | null {
  const params = v.generation_params as { variation_directive?: string } | null;
  return params?.variation_directive ?? null;
}

function buildSeedBody(firstVariant: ApprovedVariantRow): {
  html: string;
  text: string;
} {
  const summary = buildComparisonSummary([
    {
      variant_index: firstVariant.variant_index,
      variant_label: firstVariant.variant_label,
      variation_directive: getVariationDirective(firstVariant),
      char_count: firstVariant.char_count,
    },
  ]);
  const greetingHtml =
    '<p>お客様 様,</p><p>いつもお世話になっております。下記、プレスリリース原稿の候補をお送りいたします。ご確認のほどよろしくお願いいたします。</p>';
  const greetingText =
    'お客様 様,\n\nいつもお世話になっております。下記、プレスリリース原稿の候補をお送りいたします。ご確認のほどよろしくお願いいたします。';
  return {
    html: `${greetingHtml}\n${summary.html}`,
    text: `${greetingText}\n\n${summary.text}`,
  };
}

// Top-level wrapper. The inner form mounts only after project + variants are
// loaded so useForm's defaultValues can be computed synchronously — this lets
// us avoid setState-in-effect lint warnings (Phase 3 and Phase 4 hit this rule
// twice; the canonical fix is to gate the consumer rather than reset later).
export function DeliveryComposer({ projectId }: Props) {
  const { data: project, isPending: projectPending } = useProject(projectId);
  const { data: variants = [], isPending: variantsPending } =
    useApprovedVariantsForProject(projectId);

  if (projectPending || variantsPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Project not found.</AlertDescription>
      </Alert>
    );
  }

  return (
    <DeliveryComposerForm
      projectId={projectId}
      project={project}
      variants={variants}
    />
  );
}

interface FormProps {
  projectId: string;
  project: Project;
  variants: ApprovedVariantRow[];
}

function DeliveryComposerForm({ projectId, project, variants }: FormProps) {
  const navigate = useNavigate();
  const mutation = useCreateDelivery(projectId);

  const seed = useMemo(() => {
    if (variants.length === 0) {
      return { subject: project.name, body_html: '', body_text: '' };
    }
    const first = variants[0];
    const subType = first.content_item.content_sub_type;
    const subTypeLabel = SUB_TYPE_DISPLAY[subType] ?? subType;
    const body = buildSeedBody(first);
    return {
      subject: `${project.name} — ${subTypeLabel}`,
      body_html: body.html,
      body_text: body.text,
    };
    // Seed values are stable for the form's lifetime — variant toggles don't
    // reseed the body (clobbering user edits). The "current selection
    // comparison" preview below the editor surfaces the live view.
  }, [project, variants]);

  const form = useForm<ComposerInput>({
    resolver: zodResolver(ComposerInputSchema),
    defaultValues: {
      project_id: projectId,
      content_item_id: '',
      variant_ids: [],
      recommended_variant_id: null,
      recipient_email: '',
      recipient_name: null,
      cc_emails: [],
      bcc_emails: [],
      subject: seed.subject,
      body_html: seed.body_html,
      body_text: seed.body_text,
      attachment_format: 'both',
      scheduling_warnings: [],
      scheduled_for: null,
    },
  });

  const variantIds = useWatch({ control: form.control, name: 'variant_ids' });
  const recommendedVariantId = useWatch({
    control: form.control,
    name: 'recommended_variant_id',
  });
  const scheduledFor = useWatch({
    control: form.control,
    name: 'scheduled_for',
  });
  const ccEmails = useWatch({ control: form.control, name: 'cc_emails' }) ?? [];
  const recipientEmail = useWatch({
    control: form.control,
    name: 'recipient_email',
  });
  const acknowledgedWarnings =
    useWatch({ control: form.control, name: 'scheduling_warnings' }) ?? [];

  const [manualAck, setManualAck] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState<ComposerInput | null>(
    null,
  );

  const selectedVariantRows = useMemo(
    () => variants.filter((v) => variantIds.includes(v.id)),
    [variants, variantIds],
  );

  const currentWarnings = useMemo(
    () => getSchedulingWarnings(scheduledFor),
    [scheduledFor],
  );

  const checklist = usePreSendChecklist({
    projectId,
    selectedVariants: selectedVariantRows,
    recipientEmail: recipientEmail ?? '',
    manualAcknowledged: manualAck,
  });

  const handleToggleVariant = (
    variant: ApprovedVariantRow,
    checked: boolean,
  ) => {
    const current = form.getValues('variant_ids');
    const next = checked
      ? [...current, variant.id]
      : current.filter((id) => id !== variant.id);
    form.setValue('variant_ids', next, { shouldValidate: true });
    if (next.length === 0) {
      form.setValue('content_item_id', '');
      form.setValue('recommended_variant_id', null);
    } else {
      form.setValue('content_item_id', variant.content_item.id);
      if (
        !checked &&
        form.getValues('recommended_variant_id') === variant.id
      ) {
        form.setValue('recommended_variant_id', null);
      }
    }
  };

  const handleBodyChange = useCallback(
    (next: { html: string; text: string }) => {
      form.setValue('body_html', next.html, { shouldValidate: true });
      form.setValue('body_text', next.text);
    },
    [form],
  );

  const livePreviewSummary = useMemo(() => {
    if (selectedVariantRows.length === 0) return null;
    return buildComparisonSummary(
      selectedVariantRows.map((v) => ({
        variant_index: v.variant_index,
        variant_label: v.variant_label,
        variation_directive: getVariationDirective(v),
        char_count: v.char_count,
      })),
    );
  }, [selectedVariantRows]);

  const footerPreview = useMemo(
    () => buildFeedbackFooter('https://app.example/f/<magic-link-token>'),
    [],
  );

  const submitMutation = useCallback(
    (values: ComposerInput) => {
      mutation.mutate(values, {
        onSuccess: (result) => {
          if (result.status === 'sent') {
            toast.success('Delivery sent');
          } else {
            toast.success(
              `Delivery scheduled for ${new Date(result.scheduled_for).toLocaleString()}`,
            );
          }
          navigate(`/projects/${projectId}/deliveries`);
        },
      });
    },
    [mutation, navigate, projectId],
  );

  const onSubmit = (values: ComposerInput) => {
    const warnings = getSchedulingWarnings(values.scheduled_for);
    const alreadyAcked = values.scheduling_warnings ?? [];
    const unacked = warnings.filter((w) => !alreadyAcked.includes(w));
    if (unacked.length > 0) {
      setPendingSubmit(values);
      return;
    }
    submitMutation(values);
  };

  const handleAcknowledgeWarnings = () => {
    if (!pendingSubmit) return;
    const values: ComposerInput = {
      ...pendingSubmit,
      scheduling_warnings: currentWarnings,
    };
    form.setValue('scheduling_warnings', currentWarnings);
    setPendingSubmit(null);
    submitMutation(values);
  };

  // Clearing the prior acknowledgements when the scheduled time changes keeps
  // the audit trail honest: an ack records the warnings the user saw against
  // the time they saw it for. A new time = a new ack.
  const handleScheduledForChange = (utcIso: string | null) => {
    form.setValue('scheduled_for', utcIso);
    if (
      (acknowledgedWarnings?.length ?? 0) > 0 &&
      (utcIso === null ||
        getSchedulingWarnings(utcIso).length !== acknowledgedWarnings.length)
    ) {
      form.setValue('scheduling_warnings', []);
    }
  };

  // Past-schedule check is enforced server-side by create_delivery's
  // 'scheduled_in_past' P0004 gate. We don't re-check Date.now() in render
  // (react-hooks/purity flags it as impure).
  const submitDisabled =
    mutation.isPending || variantIds.length === 0 || !checklist.allPassing;

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8"
      >
        {mutation.error && (
          <Alert variant="destructive">
            <AlertTitle>
              <BilingualLabel ja="送信に失敗しました" en="Send failed" />
            </AlertTitle>
            <AlertDescription>
              <code className="text-xs">{mutation.error.message}</code>
            </AlertDescription>
          </Alert>
        )}

        {/* § 1 — Variants */}
        <section className="space-y-3">
          <h2 className="text-base font-medium">
            <BilingualLabel ja="配信する案" en="Variants to deliver" />
            <span className="text-xs text-muted-foreground ml-2">
              {variantIds.length} / 3
            </span>
          </h2>
          <VariantPicker
            variants={variants}
            selectedVariantIds={variantIds}
            recommendedVariantId={recommendedVariantId ?? null}
            onToggleVariant={handleToggleVariant}
            onRecommendChange={(id) =>
              form.setValue('recommended_variant_id', id)
            }
          />
          {form.formState.errors.variant_ids && (
            <p className="text-sm text-destructive">
              {form.formState.errors.variant_ids.message}
            </p>
          )}
        </section>

        {/* § 2 — Recipient */}
        <section className="space-y-3">
          <h2 className="text-base font-medium">
            <BilingualLabel ja="宛先" en="Recipient" />
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="recipient_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <BilingualLabel ja="メールアドレス" en="Email" />
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="off"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="recipient_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <BilingualLabel ja="氏名" en="Name" />
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.value || null)
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <FormItem>
            <FormLabel>
              <BilingualLabel ja="CC" en="CC" />
            </FormLabel>
            <TagInput
              values={ccEmails}
              onChange={(next) => form.setValue('cc_emails', next)}
              placeholder="cc@example.com"
            />
          </FormItem>
        </section>

        {/* § 3 — Sender */}
        <section className="space-y-3">
          <h2 className="text-base font-medium">
            <BilingualLabel ja="送信者" en="Sender" />
          </h2>
          <SenderIdentityBanner />
        </section>

        {/* § 4 — Subject */}
        <section className="space-y-3">
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">
                  <BilingualLabel ja="件名" en="Subject" />
                </FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        {/* § 5 — Body */}
        <section className="space-y-3">
          <h2 className="text-base font-medium">
            <BilingualLabel ja="本文" en="Message body" />
          </h2>
          <DeliveryBodyEditor
            initialHtml={seed.body_html}
            onChange={handleBodyChange}
          />
          {form.formState.errors.body_html && (
            <p className="text-sm text-destructive">
              {form.formState.errors.body_html.message}
            </p>
          )}
          <div className="rounded-md border border-dashed p-3 bg-muted/30 space-y-2">
            <p className="text-xs text-muted-foreground">
              <BilingualLabel
                ja="送信時にサーバーが下記フッターを追加します (プレビュー)"
                en="Server appends this footer at send time (preview)"
              />
            </p>
            <div
              className="text-xs prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: footerPreview.html }}
            />
          </div>
          {livePreviewSummary && (
            <details className="rounded-md border p-3">
              <summary className="cursor-pointer text-xs text-muted-foreground">
                <BilingualLabel
                  ja="現在の選択に基づくバリアント比較"
                  en="Comparison summary for current selection"
                />
              </summary>
              <div
                className="mt-2 prose prose-sm max-w-none text-sm"
                dangerouslySetInnerHTML={{ __html: livePreviewSummary.html }}
              />
            </details>
          )}
        </section>

        {/* § 6 — Attachment format */}
        <section className="space-y-3">
          <FormField
            control={form.control}
            name="attachment_format"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">
                  <BilingualLabel ja="添付形式" en="Attachment format" />
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex gap-6"
                  >
                    <label className="flex items-center gap-2 cursor-pointer">
                      <RadioGroupItem value="pdf" />
                      PDF
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <RadioGroupItem value="word" />
                      Word
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <RadioGroupItem value="both" />
                      <BilingualLabel ja="両方" en="Both" />
                    </label>
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )}
          />
        </section>

        {/* § 7 — Send time */}
        <section className="space-y-3">
          <h2 className="text-base font-medium">
            <BilingualLabel ja="送信タイミング" en="Send timing" />
          </h2>
          <ScheduleField
            value={scheduledFor ?? null}
            onChange={handleScheduledForChange}
          />
          {currentWarnings.length > 0 && (
            <div className="rounded-md border border-amber-500/50 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs space-y-1">
              <div className="flex items-center gap-1 font-medium">
                <AlertTriangleIcon className="size-3 text-amber-600" />
                <BilingualLabel
                  ja="送信タイミングに関する注意事項"
                  en="Scheduling advisories"
                />
              </div>
              <ul className="list-disc pl-5 space-y-0.5">
                {currentWarnings.includes('outside_business_hours') && (
                  <li>
                    <BilingualLabel
                      ja="営業時間外 (JST 09:00–18:00 の外)"
                      en="Outside business hours (JST 09:00–18:00)"
                    />
                  </li>
                )}
                {currentWarnings.includes('japanese_holiday') && (
                  <li>
                    <BilingualLabel
                      ja="日本の祝日"
                      en="Japanese public holiday"
                    />
                  </li>
                )}
              </ul>
              <p className="text-muted-foreground">
                <BilingualLabel
                  ja="送信時に確認を求められます。続行すると監査トレイルに記録されます。"
                  en="You'll be asked to confirm at send time. Continuing is recorded in the audit trail."
                />
              </p>
            </div>
          )}
        </section>

        {/* § 8 — Pre-send checklist */}
        <section className="space-y-3">
          <PreSendChecklist
            state={checklist}
            hasSelectedVariants={selectedVariantRows.length > 0}
            manualAcknowledged={manualAck}
            onManualChange={setManualAck}
          />
        </section>

        <div className="pt-2 border-t flex items-center gap-3">
          <Button type="submit" disabled={submitDisabled}>
            {scheduledFor ? (
              <>
                <ClockIcon className="size-4" />
                <BilingualLabel ja="予約送信" en="Schedule send" />
              </>
            ) : (
              <>
                <SendIcon className="size-4" />
                <BilingualLabel ja="今すぐ送信" en="Send now" />
              </>
            )}
          </Button>
          {mutation.isPending && (
            <span className="text-xs text-muted-foreground">
              <BilingualLabel ja="送信中…" en="Sending…" />
            </span>
          )}
        </div>
      </form>

      <ScheduleWarningDialog
        open={pendingSubmit !== null}
        onOpenChange={(open) => {
          if (!open) setPendingSubmit(null);
        }}
        warnings={currentWarnings}
        scheduledFor={scheduledFor ?? null}
        onAcknowledge={handleAcknowledgeWarnings}
      />
    </Form>
  );
}
