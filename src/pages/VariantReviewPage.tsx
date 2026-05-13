import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { BilingualLabel } from '@/components/shared/BilingualLabel';
import { VariantColumn } from '@/components/review/VariantColumn';
import { CompliancePanel } from '@/components/review/CompliancePanel';
import { useProject, useContentItemForProject } from '@/hooks/useProjects';
import { useClient } from '@/hooks/useClients';
import { useVariantsForContentItem } from '@/hooks/useVariants';
import { useGenerateVariants } from '@/hooks/useGenerateVariants';
import { useApproveVariant } from '@/hooks/useApproveVariant';
import { useUpdateVariant } from '@/hooks/useUpdateVariant';
import { useComplianceCheck } from '@/hooks/useComplianceCheck';
import {
  useComplianceFindings,
  type ComplianceFindingWithStale,
} from '@/hooks/useComplianceFindings';
import { useApplyFix } from '@/hooks/useApplyFix';
import { useAcknowledgeFinding } from '@/hooks/useAcknowledgeFinding';
import { useReopenFinding } from '@/hooks/useReopenFinding';
import { useRecordManualReviewStarted } from '@/hooks/useRecordManualReviewStarted';

export default function VariantReviewPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const { data: project } = useProject(projectId);
  const { data: contentItem } = useContentItemForProject(projectId);
  const { data: client } = useClient(project?.client_id);
  const { data: variants, isLoading: variantsLoading } =
    useVariantsForContentItem(contentItem?.id);

  const generateVariants = useGenerateVariants(contentItem?.id);
  const approveVariant = useApproveVariant(contentItem?.id);
  const updateVariant = useUpdateVariant(contentItem?.id);
  const complianceCheck = useComplianceCheck(contentItem?.id);
  const applyFix = useApplyFix(contentItem?.id);
  const acknowledgeFinding = useAcknowledgeFinding(contentItem?.id);
  const reopenFinding = useReopenFinding(contentItem?.id);
  const { mutate: recordReview } = useRecordManualReviewStarted();

  const { data: findingsByVariant } = useComplianceFindings(
    contentItem?.id,
    variants,
  );

  const autoFiredRef = useRef(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelVariantId, setPanelVariantId] = useState<string | null>(null);
  const [recheckingVariantId, setRecheckingVariantId] = useState<string | null>(
    null,
  );
  const [resolvingFindingId, setResolvingFindingId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (
      !autoFiredRef.current &&
      contentItem?.id &&
      variants &&
      variants.length === 0 &&
      !generateVariants.isPending
    ) {
      autoFiredRef.current = true;
      generateVariants.mutate(
        {},
        {
          onError: (e) => toast.error(e.message),
          onSuccess: (data) => {
            const ids = data.variants.map((v) => v.id);
            if (ids.length > 0) {
              complianceCheck.mutate(
                { variant_ids: ids },
                { onError: (e) => toast.error(e.message) },
              );
            }
          },
        },
      );
    }
  }, [contentItem?.id, variants, generateVariants, complianceCheck]);

  const generating = generateVariants.isPending;

  const sortedVariants = useMemo(
    () =>
      (variants ?? []).slice().sort((a, b) => a.variant_index - b.variant_index),
    [variants],
  );

  const handleApplyFix = async (
    variantId: string,
    finding: ComplianceFindingWithStale,
  ) => {
    const variant = sortedVariants.find((v) => v.id === variantId);
    if (!variant) return;
    if (!finding.suggested_correction) return;

    const found = variant.body_text.includes(finding.source_text);
    if (!found) {
      // Behavior change vs. Phase 3: when the source_text isn't in the body
      // we no longer silently mark the finding 'fixed' — the apply_fix RPC
      // is one atomic gesture and skipping the body edit while flipping
      // status would be dishonest.
      toast.warning(
        '本文に該当箇所が見つかりません / Source text not found in body',
      );
      return;
    }

    setResolvingFindingId(finding.id);
    try {
      const next = variant.body_text.replace(
        finding.source_text,
        finding.suggested_correction,
      );
      const newCharCount = Array.from(next).length;
      const newReadingTimeSeconds = Math.ceil(newCharCount / 6);
      await applyFix.mutateAsync({
        findingId: finding.id,
        variantId,
        newBodyText: next,
        newBodyHtml: variant.body_html ?? null,
        newCharCount,
        newReadingTimeSeconds,
      });
      toast.success('修正を適用しました / Fix applied');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setResolvingFindingId(null);
    }
  };

  const handleRecheck = (variantId: string) => {
    setRecheckingVariantId(variantId);
    complianceCheck.mutate(
      { variant_ids: [variantId] },
      {
        onError: (e) => toast.error(e.message),
        onSettled: () => setRecheckingVariantId(null),
      },
    );
  };

  const handleAcknowledge = (findingId: string) => {
    setResolvingFindingId(findingId);
    acknowledgeFinding.mutate(
      { findingId },
      {
        onError: (e) => toast.error(e.message),
        onSettled: () => setResolvingFindingId(null),
      },
    );
  };

  const handleReopen = (findingId: string) => {
    setResolvingFindingId(findingId);
    reopenFinding.mutate(
      { findingId },
      {
        onError: (e) => toast.error(e.message),
        onSettled: () => setResolvingFindingId(null),
      },
    );
  };

  // Fire `manual_review_started` once per (project, variant, user) tuple.
  // The RPC is idempotent server-side so a client-side Set is a courtesy
  // to avoid noise, not a correctness guard.
  const firedReviewRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!projectId) return;
    for (const v of sortedVariants) {
      if (firedReviewRef.current.has(v.id)) continue;
      firedReviewRef.current.add(v.id);
      recordReview({ projectId, variantId: v.id });
    }
  }, [projectId, sortedVariants, recordReview]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {client?.name ? <span>{client.name}</span> : <span>—</span>}
            {project?.status && (
              <Badge variant="outline">{project.status}</Badge>
            )}
          </div>
          <h1 className="text-2xl">{project?.name ?? '—'}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to={`/projects/${projectId}/audit`}>
              <BilingualLabel ja="監査レポート" en="Audit report" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/projects">
              <BilingualLabel ja="一覧に戻る" en="Back" />
            </Link>
          </Button>
        </div>
      </div>

      {generating && (
        <div className="space-y-3">
          <Progress />
          <p className="text-sm text-muted-foreground">
            <BilingualLabel
              ja="3案を生成中..."
              en="Generating 3 variants..."
            />
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3 rounded-md border p-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ))}
          </div>
        </div>
      )}

      {!generating && variantsLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      )}

      {!generating && !variantsLoading && sortedVariants.length > 0 && (
        <>
          {complianceCheck.isPending && (
            <p className="text-sm text-muted-foreground">
              <BilingualLabel
                ja="コンプライアンスを確認中..."
                en="Running compliance check..."
              />
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sortedVariants.map((variant) => (
              <VariantColumn
                key={variant.id}
                variant={variant}
                findings={findingsByVariant?.[variant.id] ?? []}
                approving={approveVariant.isPending}
                regenerating={generateVariants.isPending}
                onOpenCompliance={() => {
                  setPanelVariantId(variant.id);
                  setPanelOpen(true);
                }}
                onSaveBody={async (body) => {
                  try {
                    await updateVariant.mutateAsync({
                      variantId: variant.id,
                      body_text: body,
                    });
                  } catch (e) {
                    toast.error((e as Error).message);
                    throw e;
                  }
                }}
                onApproveToggle={(next) => {
                  approveVariant.mutate(
                    { variantId: variant.id, approved: next },
                    {
                      onError: (e) => toast.error(e.message),
                    },
                  );
                }}
                onRegenerate={() => {
                  generateVariants.mutate(
                    { variant_index: variant.variant_index as 1 | 2 | 3 },
                    {
                      onError: (e) => toast.error(e.message),
                      onSuccess: (data) => {
                        const ids = data.variants.map((v) => v.id);
                        if (ids.length > 0) {
                          complianceCheck.mutate(
                            { variant_ids: ids },
                            { onError: (e) => toast.error(e.message) },
                          );
                        }
                        toast.success(
                          `案${variant.variant_index}を再生成しました`,
                        );
                      },
                    },
                  );
                }}
              />
            ))}
          </div>
        </>
      )}

      {!generating &&
        !variantsLoading &&
        sortedVariants.length === 0 &&
        contentItem?.id && (
          <div className="rounded-md border border-dashed p-8 text-center space-y-2">
            <p className="text-base font-medium">
              <BilingualLabel
                ja="まだバリアントがありません"
                en="No variants yet"
              />
            </p>
            <Button
              onClick={() =>
                generateVariants.mutate(
                  {},
                  { onError: (e) => toast.error(e.message) },
                )
              }
            >
              <BilingualLabel ja="3案を生成" en="Generate 3 variants" />
            </Button>
          </div>
        )}

      <CompliancePanel
        open={panelOpen}
        onOpenChange={setPanelOpen}
        initialVariantId={panelVariantId}
        variants={sortedVariants}
        findingsByVariant={findingsByVariant ?? {}}
        onRecheck={handleRecheck}
        onApplyFix={handleApplyFix}
        onAcknowledge={handleAcknowledge}
        onReopen={handleReopen}
        recheckingVariantId={recheckingVariantId}
        resolvingFindingId={resolvingFindingId}
      />
    </div>
  );
}
