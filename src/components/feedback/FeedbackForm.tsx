import { useEffect } from 'react';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SendIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { BilingualLabel } from '@/components/shared/BilingualLabel';
import { FeedbackChipGroup } from './FeedbackChipGroup';
import {
  WHAT_WORKED_PRESETS,
  WHAT_COULD_IMPROVE_PRESETS,
} from './feedback-chip-presets';
import { FeedbackVariantTabs } from './FeedbackVariantTabs';
import type { FeedbackLoadOk } from '@/lib/types/feedback';
import type { FeedbackSubmitBody } from '@/hooks/useFeedbackSubmit';

// Form-only schema; the token is contributed by the page (URL param), not
// the form. XOR refine mirrors the DB CHECK + the RPC gate + the Edge
// Function prefilter (defence in depth).
const FormSchema = z
  .object({
    chosen_variant_id: z.string().uuid().nullable(),
    needs_rework: z.boolean(),
    what_worked: z.array(z.string().min(1).max(50)).max(6),
    what_could_improve: z.array(z.string().min(1).max(50)).max(6),
    free_text_comment: z.string().max(2000).nullable(),
  })
  // Exactly one of {chosen_variant_id set, needs_rework=true} must hold.
  // Mirrors the migration 0011 CHECK + the feedback-submit Edge Function
  // pre-flight. Expressed as "chosen-set XOR rework" via JS !==.
  .refine((v) => (v.chosen_variant_id !== null) !== v.needs_rework, {
    message: 'xor_required',
    path: ['chosen_variant_id'],
  });

type FormValues = z.infer<typeof FormSchema>;

interface Props {
  loaded: FeedbackLoadOk;
  onSubmit: (input: FeedbackSubmitBody) => void;
  isPending: boolean;
  errorMessage: { ja: string; en: string } | null;
}

export function FeedbackForm({ loaded, onSubmit, isPending, errorMessage }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema) as never,
    defaultValues: {
      chosen_variant_id: null,
      needs_rework: false,
      what_worked: [],
      what_could_improve: [],
      free_text_comment: null,
    },
  });

  const chosen = useWatch({ control: form.control, name: 'chosen_variant_id' });
  const needsRework = useWatch({ control: form.control, name: 'needs_rework' });
  const freeTextRawWatched = useWatch({
    control: form.control,
    name: 'free_text_comment',
  });
  const freeTextRaw = freeTextRawWatched ?? '';

  // Clear chosen_variant_id when the rework toggle goes on so the XOR holds
  // without the user having to un-pick.
  useEffect(() => {
    if (needsRework && chosen !== null) {
      form.setValue('chosen_variant_id', null, { shouldDirty: true });
    }
  }, [needsRework, chosen, form]);

  const showForm = chosen !== null || needsRework;

  function handleSubmit(values: FormValues) {
    onSubmit({
      chosen_variant_id: values.chosen_variant_id,
      needs_rework: values.needs_rework,
      what_worked: values.what_worked,
      what_could_improve: values.what_could_improve,
      free_text_comment:
        values.free_text_comment && values.free_text_comment.length > 0
          ? values.free_text_comment
          : null,
    });
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <Controller
        control={form.control}
        name="chosen_variant_id"
        render={({ field }) => (
          <FeedbackVariantTabs
            variants={loaded.variants}
            recommendedVariantId={loaded.recommended_variant_id}
            chosenVariantId={field.value}
            onChoose={(id) => field.onChange(id)}
            dimmed={needsRework}
          />
        )}
      />

      <Controller
        control={form.control}
        name="needs_rework"
        render={({ field }) => (
          <div className="flex items-start gap-3 rounded-md border border-border bg-muted/30 p-4">
            <Checkbox
              id="needs-rework"
              checked={field.value}
              onCheckedChange={(v) => field.onChange(v === true)}
              className="mt-1"
            />
            <label htmlFor="needs-rework" className="cursor-pointer text-sm">
              <div className="font-medium">どの案も再検討が必要</div>
              <div className="text-xs text-muted-foreground">
                None of these versions work — please rework
              </div>
            </label>
          </div>
        )}
      />

      {showForm && (
        <Card>
          <CardContent className="space-y-6 py-6">
            <div className="space-y-2">
              <div id="what-worked-label" className="text-sm font-medium">
                良かった点 <span className="text-muted-foreground">/ What worked</span>
              </div>
              <Controller
                control={form.control}
                name="what_worked"
                render={({ field }) => (
                  <FeedbackChipGroup
                    presets={WHAT_WORKED_PRESETS}
                    value={field.value}
                    onChange={field.onChange}
                    max={6}
                    maxLength={50}
                    disabled={isPending}
                    ariaLabelledBy="what-worked-label"
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <div id="what-improve-label" className="text-sm font-medium">
                改善できる点{' '}
                <span className="text-muted-foreground">/ What to improve</span>
              </div>
              <Controller
                control={form.control}
                name="what_could_improve"
                render={({ field }) => (
                  <FeedbackChipGroup
                    presets={WHAT_COULD_IMPROVE_PRESETS}
                    value={field.value}
                    onChange={field.onChange}
                    max={6}
                    maxLength={50}
                    disabled={isPending}
                    ariaLabelledBy="what-improve-label"
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="free-text-comment"
                className="text-sm font-medium"
              >
                その他コメント{' '}
                <span className="text-muted-foreground">/ Additional comments (optional)</span>
              </label>
              <Controller
                control={form.control}
                name="free_text_comment"
                render={({ field }) => (
                  <Textarea
                    id="free-text-comment"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value)}
                    maxLength={2000}
                    rows={5}
                    disabled={isPending}
                    placeholder="ご意見・ご要望を自由にご記入ください / Share any additional thoughts."
                  />
                )}
              />
              <p className="text-right text-xs text-muted-foreground">
                {freeTextRaw.length} / 2000
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          <BilingualLabel ja={errorMessage.ja} en={errorMessage.en} />
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isPending || !showForm}
      >
        <SendIcon className="mr-2 size-4" />
        <span>送信 / Submit feedback</span>
      </Button>
    </form>
  );
}
