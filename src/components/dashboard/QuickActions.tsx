import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Plus, UserPlus, Mic, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BilingualLabel } from '@/components/shared/BilingualLabel';

interface Action {
  icon: LucideIcon;
  ja: string;
  en: string;
  to: string;
}

interface Props {
  firstClientId: string | null;
}

export function QuickActions({ firstClientId }: Props) {
  const actions: Action[] = [
    { icon: Plus, ja: '新規プロジェクトを作成', en: 'Start a new project', to: '/projects/new' },
    { icon: UserPlus, ja: 'クライアントを追加', en: 'Add a client', to: '/clients/new' },
    {
      icon: Mic,
      ja: 'ブランドボイス資料を追加',
      en: 'Upload brand voice',
      to: firstClientId ? `/clients/${firstClientId}` : '/clients',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <BilingualLabel ja="クイックアクション" en="Quick actions" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.en}
              to={a.to}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 ring-1 ring-foreground/10 transition-colors hover:bg-muted/50"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="flex-1 text-sm font-medium">
                <BilingualLabel ja={a.ja} en={a.en} />
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
