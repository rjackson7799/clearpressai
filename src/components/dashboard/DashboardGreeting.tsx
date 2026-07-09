import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { BilingualLabel } from '@/components/shared/BilingualLabel';
import { pickLang } from '@/lib/bilingual';
import { greetingFor } from '@/lib/greeting';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface Props {
  now: Date;
}

export function DashboardGreeting({ now }: Props) {
  const { i18n } = useTranslation();
  const { data: user } = useCurrentUser();

  const greeting = greetingFor(now.getHours());
  const name = user?.full_name?.trim() || null;

  const title = name
    ? pickLang(i18n.language, `${greeting.ja}、${name}さん`, `${greeting.en}, ${name}`)
    : pickLang(i18n.language, greeting.ja, greeting.en);

  const dateLabel = new Intl.DateTimeFormat(
    i18n.language.startsWith('ja') ? 'ja-JP' : 'en-US',
    { weekday: 'long', month: 'long', day: 'numeric' },
  ).format(now);

  const subtitle = pickLang(
    i18n.language,
    `本日のクライアントの動きです — ${dateLabel}`,
    `Here's what's moving across your clients today — ${dateLabel}`,
  );

  return (
    <PageHeader
      title={title}
      subtitle={subtitle}
      actions={
        <Button asChild>
          <Link to="/projects/new">
            <Plus aria-hidden />
            <BilingualLabel ja="新規プロジェクト" en="New project" />
          </Link>
        </Button>
      }
    />
  );
}
