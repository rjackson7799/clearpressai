import type { ReactNode } from "react";
import { BilingualLabel } from "@/components/shared/BilingualLabel";

interface AuthShellProps {
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="min-h-screen grid place-items-center p-6 bg-gradient-to-b from-muted/40 to-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-center justify-center gap-2.5">
          <div
            aria-hidden="true"
            className="size-9 rounded-md bg-gradient-to-br from-blue-500 to-blue-700 text-white grid place-items-center text-base font-bold shadow-sm"
          >
            C
          </div>
          <div className="text-lg font-semibold tracking-tight">
            ClearPress AI
          </div>
        </div>
        <div className="rounded-lg border bg-card shadow-sm p-6 space-y-5">
          <div className="space-y-1.5">
            <h1 className="text-xl font-semibold">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {children}
        </div>
        {footer && (
          <div className="text-center text-sm">
            {footer}
          </div>
        )}
        <p className="text-center text-xs text-muted-foreground">
          <BilingualLabel
            ja="製薬PR向けコンプライアンス対応プラットフォーム"
            en="Compliance-aware press release platform"
          />
        </p>
      </div>
    </div>
  );
}
