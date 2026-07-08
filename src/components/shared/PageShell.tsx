import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  children: ReactNode;
}

// Gray page canvas + white cards. See docs/DESIGN-REFERENCE.md §1.
// -m-6 cancels AppShell's <main className="p-6"> so the muted canvas bleeds
// edge-to-edge; p-6 restores the gutter inside the gray.
export function PageShell({ className, children }: Props) {
  return (
    <div className="-m-6 min-h-[calc(100dvh-4rem)] bg-muted/40 p-6">
      <div className={cn("space-y-6", className)}>{children}</div>
    </div>
  );
}
