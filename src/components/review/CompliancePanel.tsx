import { useState } from 'react';
import { AlertTriangleIcon, CopyIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BilingualLabel } from '@/components/shared/BilingualLabel';
import type {
  ComplianceSeverity,
  ContentVariant,
} from '@/types/domain';
import type { ComplianceFindingWithStale } from '@/hooks/useComplianceFindings';

const SEVERITY_ORDER: ComplianceSeverity[] = ['blocker', 'warning', 'note'];

const SEVERITY_LABEL: Record<ComplianceSeverity, { ja: string; en: string }> = {
  blocker: { ja: '阻止', en: 'Blocker' },
  warning: { ja: '警告', en: 'Warning' },
  note: { ja: '注意', en: 'Note' },
};

const SEVERITY_VARIANT: Record<
  ComplianceSeverity,
  'destructive' | 'default' | 'secondary'
> = {
  blocker: 'destructive',
  warning: 'default',
  note: 'secondary',
};

export interface CompliancePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialVariantId: string | null;
  variants: ContentVariant[];
  findingsByVariant: Record<string, ComplianceFindingWithStale[]>;
  onRecheck: (variantId: string) => void;
  onApplyFix: (variantId: string, finding: ComplianceFindingWithStale) => void;
  onAcknowledge: (findingId: string) => void;
  onReopen: (findingId: string) => void;
  recheckingVariantId?: string | null;
  resolvingFindingId?: string | null;
}

export function CompliancePanel({
  open,
  onOpenChange,
  initialVariantId,
  variants,
  findingsByVariant,
  onRecheck,
  onApplyFix,
  onAcknowledge,
  onReopen,
  recheckingVariantId,
  resolvingFindingId,
}: CompliancePanelProps) {
  const sortedVariants = variants
    .slice()
    .sort((a, b) => a.variant_index - b.variant_index);
  const defaultTab = initialVariantId ?? sortedVariants[0]?.id ?? '';
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (o && initialVariantId) {
          setActiveTab(initialVariantId);
        }
        onOpenChange(o);
      }}
    >
      <SheetContent className="w-full sm:max-w-xl flex flex-col gap-0">
        <SheetHeader className="border-b">
          <SheetTitle>
            <BilingualLabel ja="コンプライアンス" en="Compliance" />
          </SheetTitle>
          <SheetDescription>
            <BilingualLabel
              ja="決定的チェック + LLM レビューによる薬機法・適正広告基準・PMDA ガイドラインの確認結果"
              en="Deterministic + LLM review against 薬機法, ad-content standards, and PMDA guidelines"
            />
          </SheetDescription>
        </SheetHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="m-4 mb-0 shrink-0">
            {sortedVariants.map((v) => {
              const findings = findingsByVariant[v.id] ?? [];
              const blockerCount = findings.filter(
                (f) => f.severity === 'blocker' && f.resolution_status === 'unresolved',
              ).length;
              return (
                <TabsTrigger key={v.id} value={v.id} className="gap-2">
                  <span>案{v.variant_index}</span>
                  {blockerCount > 0 && (
                    <Badge variant="destructive" className="px-1">
                      {blockerCount}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {sortedVariants.map((v) => {
            const findings = findingsByVariant[v.id] ?? [];
            const anyStale = findings.some((f) => f.is_stale);
            const grouped: Record<ComplianceSeverity, ComplianceFindingWithStale[]> = {
              blocker: [],
              warning: [],
              note: [],
            };
            for (const f of findings) {
              grouped[f.severity as ComplianceSeverity].push(f);
            }

            return (
              <TabsContent
                key={v.id}
                value={v.id}
                className="flex-1 overflow-y-auto px-4 pb-6 space-y-4"
              >
                {anyStale && (
                  <Alert>
                    <AlertTriangleIcon className="size-4" />
                    <AlertTitle>
                      <BilingualLabel
                        ja="再チェックが必要"
                        en="Re-check needed"
                      />
                    </AlertTitle>
                    <AlertDescription className="space-y-2">
                      <BilingualLabel
                        ja="変更後の本文に対してコンプライアンスチェックが古い可能性があります。"
                        en="The current body has been edited since findings were last computed."
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={recheckingVariantId === v.id}
                        onClick={() => onRecheck(v.id)}
                      >
                        <BilingualLabel ja="再チェック" en="Re-check" />
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {findings.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    <BilingualLabel
                      ja="このバリアントに指摘事項はありません。"
                      en="No findings for this variant."
                    />
                  </p>
                )}

                {SEVERITY_ORDER.map((sev) => {
                  if (grouped[sev].length === 0) return null;
                  return (
                    <section key={sev} className="space-y-2">
                      <h3 className="text-xs uppercase tracking-wide text-muted-foreground">
                        <BilingualLabel
                          ja={SEVERITY_LABEL[sev].ja}
                          en={SEVERITY_LABEL[sev].en}
                        />{' '}
                        ({grouped[sev].length})
                      </h3>
                      <div className="space-y-3">
                        {grouped[sev].map((f) => (
                          <FindingCard
                            key={f.id}
                            variantId={v.id}
                            finding={f}
                            onApplyFix={onApplyFix}
                            onAcknowledge={onAcknowledge}
                            onReopen={onReopen}
                            resolving={resolvingFindingId === f.id}
                          />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </TabsContent>
            );
          })}
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

interface FindingCardProps {
  variantId: string;
  finding: ComplianceFindingWithStale;
  onApplyFix: (variantId: string, finding: ComplianceFindingWithStale) => void;
  onAcknowledge: (findingId: string) => void;
  onReopen: (findingId: string) => void;
  resolving?: boolean;
}

function FindingCard({
  variantId,
  finding,
  onApplyFix,
  onAcknowledge,
  onReopen,
  resolving,
}: FindingCardProps) {
  const sev = finding.severity as ComplianceSeverity;
  const status = finding.resolution_status;
  const isFinal = status === 'fixed' || status === 'acknowledged';
  return (
    <div className="rounded-md border bg-card p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant={SEVERITY_VARIANT[sev]}>
          <BilingualLabel
            ja={SEVERITY_LABEL[sev].ja}
            en={SEVERITY_LABEL[sev].en}
          />
        </Badge>
        {finding.paragraph_index !== null && (
          <span className="text-xs text-muted-foreground">
            ¶{finding.paragraph_index}
          </span>
        )}
        {status === 'fixed' && (
          <Badge variant="default">
            <BilingualLabel ja="修正済" en="Fixed" />
          </Badge>
        )}
        {status === 'acknowledged' && (
          <Badge variant="secondary">
            <BilingualLabel ja="確認済" en="Acknowledged" />
          </Badge>
        )}
      </div>

      <blockquote className="rounded bg-muted/50 px-2 py-1 font-mono text-xs">
        {finding.source_text}
      </blockquote>

      <p className="text-sm">{finding.explanation}</p>

      <p className="text-xs text-muted-foreground">
        {finding.regulation_reference}
      </p>

      {finding.suggested_correction && (
        <div className="rounded border border-dashed p-2 space-y-1 bg-emerald-50/40">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              <BilingualLabel ja="修正案" en="Suggested correction" />
            </span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                if (finding.suggested_correction) {
                  void navigator.clipboard.writeText(
                    finding.suggested_correction,
                  );
                  toast.success(
                    'コピーしました / Copied to clipboard',
                  );
                }
              }}
            >
              <CopyIcon className="size-3" />
            </Button>
          </div>
          <p className="text-sm whitespace-pre-wrap">
            {finding.suggested_correction}
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        {finding.suggested_correction && status !== 'fixed' && (
          <Button
            type="button"
            size="sm"
            variant="default"
            disabled={resolving}
            onClick={() => onApplyFix(variantId, finding)}
          >
            <BilingualLabel ja="修正を適用" en="Apply fix" />
          </Button>
        )}
        {status === 'unresolved' && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={resolving}
            onClick={() => onAcknowledge(finding.id)}
          >
            <BilingualLabel ja="確認済み" en="Acknowledge" />
          </Button>
        )}
        {isFinal && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={resolving}
            onClick={() => onReopen(finding.id)}
          >
            <BilingualLabel ja="未対応に戻す" en="Reopen" />
          </Button>
        )}
      </div>
    </div>
  );
}
