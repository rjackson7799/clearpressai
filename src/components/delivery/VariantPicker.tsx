import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { BilingualLabel } from '@/components/shared/BilingualLabel';
import type { ApprovedVariantRow } from '@/hooks/useApprovedVariantsForProject';

interface Props {
  variants: ApprovedVariantRow[];
  selectedVariantIds: string[];
  recommendedVariantId: string | null;
  onToggleVariant: (variant: ApprovedVariantRow, checked: boolean) => void;
  onRecommendChange: (variantId: string | null) => void;
}

const SUB_TYPE_LABELS: Record<string, { ja: string; en: string }> = {
  auto: { ja: '自動判定', en: 'Auto' },
  full_clinical: { ja: '完全臨床発表', en: 'Full Clinical' },
  partner_ack: { ja: 'パートナー謝辞', en: 'Partner Ack' },
  csr_event: { ja: 'CSR/イベント', en: 'CSR / Event' },
  business_news: { ja: 'ビジネスニュース', en: 'Business News' },
};

export function VariantPicker({
  variants,
  selectedVariantIds,
  recommendedVariantId,
  onToggleVariant,
  onRecommendChange,
}: Props) {
  const firstSelected = variants.find((v) =>
    selectedVariantIds.includes(v.id),
  );
  const lockedContentItemId = firstSelected?.content_item.id ?? null;
  const atMax = selectedVariantIds.length >= 3;

  // Group by content_item for visual structure. Variants in foreign content_items
  // render disabled once a selection is in place — the create_delivery RPC gates
  // on variant_not_in_content_item, but the UI shouldn't allow the user to try.
  const byContentItem = new Map<string, ApprovedVariantRow[]>();
  for (const v of variants) {
    const list = byContentItem.get(v.content_item.id) ?? [];
    list.push(v);
    byContentItem.set(v.content_item.id, list);
  }

  if (variants.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground text-center">
        <BilingualLabel
          ja="このプロジェクトにはまだ承認された案がありません。"
          en="No approved variants yet for this project."
        />
      </div>
    );
  }

  return (
    <RadioGroup
      value={recommendedVariantId ?? ''}
      onValueChange={(v) => onRecommendChange(v === '' ? null : v)}
      className="space-y-4"
    >
      {Array.from(byContentItem.entries()).map(([contentItemId, items]) => {
        const groupLockedOut =
          lockedContentItemId !== null && lockedContentItemId !== contentItemId;
        const subType = items[0]?.content_item.content_sub_type ?? 'auto';
        const subTypeLabel = SUB_TYPE_LABELS[subType] ?? {
          ja: subType,
          en: subType,
        };
        return (
          <div
            key={contentItemId}
            className={`rounded-md border p-3 space-y-2 ${groupLockedOut ? 'opacity-50' : ''}`}
          >
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Badge variant="secondary">
                <BilingualLabel ja={subTypeLabel.ja} en={subTypeLabel.en} />
              </Badge>
              {groupLockedOut && (
                <span>
                  <BilingualLabel
                    ja="別のコンテンツアイテムを選択中"
                    en="Different content item already selected"
                  />
                </span>
              )}
            </div>
            <div className="space-y-2">
              {items.map((v) => {
                const isChecked = selectedVariantIds.includes(v.id);
                const isDisabled =
                  groupLockedOut || (atMax && !isChecked);
                const directive =
                  (v.generation_params as { variation_directive?: string } | null)
                    ?.variation_directive ?? null;
                return (
                  <div
                    key={v.id}
                    className="flex items-start gap-3 rounded-md border p-3 bg-card"
                  >
                    <Checkbox
                      id={`variant-${v.id}`}
                      checked={isChecked}
                      disabled={isDisabled}
                      onCheckedChange={(state) =>
                        onToggleVariant(v, state === true)
                      }
                      className="mt-1"
                    />
                    <label
                      htmlFor={`variant-${v.id}`}
                      className="flex-1 space-y-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline">案{v.variant_index}</Badge>
                        <span className="font-medium">{v.variant_label}</span>
                        <span className="text-xs text-muted-foreground">
                          {v.char_count}字
                        </span>
                      </div>
                      {directive && (
                        <p className="text-xs text-muted-foreground">
                          {directive}
                        </p>
                      )}
                    </label>
                    {isChecked && (
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <RadioGroupItem value={v.id} />
                        <BilingualLabel ja="推奨" en="Recommend" />
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </RadioGroup>
  );
}
