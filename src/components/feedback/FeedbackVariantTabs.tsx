import { CheckIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { FeedbackLoadOk } from '@/lib/types/feedback';

type Variant = FeedbackLoadOk['variants'][number];

interface Props {
  variants: readonly Variant[];
  recommendedVariantId: string | null;
  chosenVariantId: string | null;
  onChoose: (variantId: string) => void;
  /** When true, variant tabs are visually de-emphasized (Needs Rework toggle is on). */
  dimmed: boolean;
}

function readingTimeSeconds(charCount: number): number {
  return Math.ceil(charCount / 6);
}

export function FeedbackVariantTabs({
  variants,
  recommendedVariantId,
  chosenVariantId,
  onChoose,
  dimmed,
}: Props) {
  const sorted = [...variants].sort((a, b) => a.variant_index - b.variant_index);
  const defaultTab = String(sorted[0]?.variant_index ?? 1);

  return (
    <div
      className={`transition-opacity ${
        dimmed ? 'pointer-events-none opacity-40' : ''
      }`}
      aria-disabled={dimmed}
    >
      <Tabs defaultValue={defaultTab}>
        <TabsList className="w-full">
          {sorted.map((v) => (
            <TabsTrigger
              key={v.id}
              value={String(v.variant_index)}
              className="flex-1"
            >
              <span>案{v.variant_index}</span>
              {v.id === recommendedVariantId && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  推奨
                </Badge>
              )}
              {v.id === chosenVariantId && (
                <CheckIcon className="ml-1.5 size-3.5 text-primary" />
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {sorted.map((v) => (
          <TabsContent key={v.id} value={String(v.variant_index)} className="mt-4">
            <div className="space-y-3">
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <div className="text-base font-medium">{v.variant_label}</div>
                  {v.variation_directive && (
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {v.variation_directive}
                    </div>
                  )}
                </div>
                <div className="shrink-0 text-xs text-muted-foreground">
                  {v.char_count}字 · 約{Math.ceil(readingTimeSeconds(v.char_count) / 60)}分
                </div>
              </div>

              <div
                className="prose prose-sm dark:prose-invert max-w-none rounded-md border border-border bg-card p-4 text-sm leading-relaxed"
                // body_html is produced by the firm's variant-generation
                // pipeline (controlled origin); rendering directly for v1
                // MVP. A sanitize-html pass is a Phase 7 polish.
                dangerouslySetInnerHTML={{ __html: v.body_html ?? '' }}
              />

              <div className="pt-1">
                <Button
                  type="button"
                  onClick={() => onChoose(v.id)}
                  variant={v.id === chosenVariantId ? 'default' : 'outline'}
                  className="w-full"
                >
                  {v.id === chosenVariantId ? (
                    <>
                      <CheckIcon className="mr-2 size-4" />
                      <span>この版を選択しました / Selected</span>
                    </>
                  ) : (
                    <span>このバージョンを選択 / Choose this version</span>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
