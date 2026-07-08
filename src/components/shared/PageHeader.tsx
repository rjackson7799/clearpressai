import type { ReactNode } from "react";

interface Props {
  breadcrumb?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

// Unified page header — breadcrumb + title + subtitle + actions slot.
// See docs/DESIGN-REFERENCE.md §9 (page title = text-2xl font-semibold).
export function PageHeader({ breadcrumb, title, subtitle, actions }: Props) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        {breadcrumb && (
          <p className="text-sm text-muted-foreground">{breadcrumb}</p>
        )}
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
