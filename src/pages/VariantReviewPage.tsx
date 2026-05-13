import { useEffect, useMemo, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { BilingualLabel } from '@/components/shared/BilingualLabel';
import { VariantColumn } from '@/components/review/VariantColumn';
import { useProject, useContentItemForProject } from '@/hooks/useProjects';
import { useClient } from '@/hooks/useClients';
import { useVariantsForContentItem } from '@/hooks/useVariants';
import { useGenerateVariants } from '@/hooks/useGenerateVariants';
import { useApproveVariant } from '@/hooks/useApproveVariant';
import { useUpdateVariant } from '@/hooks/useUpdateVariant';

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

  const autoFiredRef = useRef(false);

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
        },
      );
    }
  }, [contentItem?.id, variants, generateVariants]);

  const generating = generateVariants.isPending;

  const sortedVariants = useMemo(
    () =>
      (variants ?? []).slice().sort((a, b) => a.variant_index - b.variant_index),
    [variants],
  );

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
        <Button variant="outline" asChild>
          <Link to="/projects">
            <BilingualLabel ja="一覧に戻る" en="Back" />
          </Link>
        </Button>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sortedVariants.map((variant) => (
            <VariantColumn
              key={variant.id}
              variant={variant}
              approving={approveVariant.isPending}
              regenerating={generateVariants.isPending}
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
                    onSuccess: () =>
                      toast.success(
                        `案${variant.variant_index}を再生成しました`,
                      ),
                  },
                );
              }}
            />
          ))}
        </div>
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
    </div>
  );
}
