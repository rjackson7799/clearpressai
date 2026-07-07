import type { ReactNode } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface Props {
  step: number;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
}

// Numbered section card — the New Project page's section header pattern.
// See docs/DESIGN-REFERENCE.md §2.
export function FormSectionCard({ step, title, subtitle, children }: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
            {step}
          </span>
          <div className="space-y-0.5">
            <CardTitle>{title}</CardTitle>
            {subtitle && <CardDescription>{subtitle}</CardDescription>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}
