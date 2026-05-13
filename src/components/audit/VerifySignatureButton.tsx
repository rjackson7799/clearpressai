import { CheckCircle2Icon, ShieldCheckIcon, XCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BilingualLabel } from "@/components/shared/BilingualLabel";
import { useVerifyAuditSignature } from "@/hooks/useVerifyAuditSignature";

interface VerifySignatureButtonProps {
  signatureId: string;
}

// Triggers verify-audit-signature on click and shows the result inline so
// the reviewer can confirm a signature still matches its canonical_payload
// without leaving the page.
export function VerifySignatureButton({
  signatureId,
}: VerifySignatureButtonProps) {
  const verify = useVerifyAuditSignature();

  const handleVerify = () => verify.mutate({ signatureId });

  if (verify.data) {
    if (verify.data.matches) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-green-700">
          <CheckCircle2Icon className="size-3.5" />
          <BilingualLabel ja="検証成功" en="Verified" />
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs text-destructive">
        <XCircleIcon className="size-3.5" />
        <BilingualLabel ja="不一致" en="Mismatch" />
      </span>
    );
  }

  if (verify.error) {
    return (
      <span className="inline-flex items-center gap-2 text-xs text-destructive">
        <XCircleIcon className="size-3.5" />
        {verify.error.message}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleVerify}
          className="h-auto px-2 py-0.5"
        >
          <BilingualLabel ja="再試行" en="Retry" />
        </Button>
      </span>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleVerify}
      disabled={verify.isPending}
    >
      <ShieldCheckIcon className="size-3.5" />
      {verify.isPending ? (
        <BilingualLabel ja="検証中…" en="Verifying…" />
      ) : (
        <BilingualLabel ja="署名を検証" en="Verify signature" />
      )}
    </Button>
  );
}
