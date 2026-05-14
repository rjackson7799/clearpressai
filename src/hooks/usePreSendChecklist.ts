import { useLatestFinalizedAuditReport } from '@/hooks/useLatestFinalizedAuditReport';
import type { ApprovedVariantRow } from '@/hooks/useApprovedVariantsForProject';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export interface ChecklistState {
  auditFinalized: boolean;
  variantsClean: boolean;
  recipientValid: boolean;
  manualAck: boolean;
  allPassing: boolean;
}

interface ChecklistInputs {
  projectId: string;
  selectedVariants: ApprovedVariantRow[];
  recipientEmail: string;
  manualAcknowledged: boolean;
}

function isVariantsClean(variants: ApprovedVariantRow[]): boolean {
  if (variants.length === 0) return false;
  return variants.every((v) => {
    if (!v.internal_approved) return false;
    if (!v.internal_approved_at) return false;
    return (
      new Date(v.updated_at).getTime() <=
      new Date(v.internal_approved_at).getTime()
    );
  });
}

// Drives the four-item pre-send checklist (PRD §5.4). Mirrors the server-side
// gates in create_delivery so the user sees green/red before clicking Send,
// not after a 409 from the Edge Function. The same regex and approval rules
// run on both sides; if they ever drift the server is authoritative.
export function usePreSendChecklist({
  projectId,
  selectedVariants,
  recipientEmail,
  manualAcknowledged,
}: ChecklistInputs): ChecklistState {
  const { data: latestFinalized, isPending } = useLatestFinalizedAuditReport(projectId);
  const auditFinalized = !isPending && latestFinalized !== null;
  const variantsClean = isVariantsClean(selectedVariants);
  const recipientValid = EMAIL_RE.test(recipientEmail);
  return {
    auditFinalized,
    variantsClean,
    recipientValid,
    manualAck: manualAcknowledged,
    allPassing:
      auditFinalized && variantsClean && recipientValid && manualAcknowledged,
  };
}
