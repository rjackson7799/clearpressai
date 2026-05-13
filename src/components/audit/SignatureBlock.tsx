import { BilingualLabel } from "@/components/shared/BilingualLabel";
import { VerifySignatureButton } from "@/components/audit/VerifySignatureButton";
import type { AuditSignature } from "@/types/domain";

interface SignatureBlockProps {
  signatures: AuditSignature[];
}

export function SignatureBlock({ signatures }: SignatureBlockProps) {
  if (signatures.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        <BilingualLabel ja="署名なし" en="Not signed" />
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {signatures.map((sig) => (
        <li
          key={sig.id}
          className="rounded-md border bg-card px-4 py-3 space-y-2"
        >
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="space-y-0.5">
              <p className="font-medium">{sig.signer_name_snapshot}</p>
              <p className="text-xs text-muted-foreground">
                {sig.signer_role_snapshot}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(sig.signed_at).toLocaleString()}
              </p>
            </div>
            <VerifySignatureButton signatureId={sig.id} />
          </div>
          <p className="text-xs font-mono text-muted-foreground break-all">
            {sig.signature_hash}
          </p>
        </li>
      ))}
    </ul>
  );
}
