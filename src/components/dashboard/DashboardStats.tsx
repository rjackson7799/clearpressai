import type { LucideIcon } from 'lucide-react';
import { Users, FolderKanban, Clock, ShieldAlert } from 'lucide-react';
import { StatCard, type StatAccent } from './StatCard';
import type { StatKey, StatViewModel } from '@/lib/dashboard-metrics';

const META: Record<StatKey, { icon: LucideIcon; accent: StatAccent }> = {
  clients: { icon: Users, accent: 'primary' },
  projects: { icon: FolderKanban, accent: 'emerald' },
  in_review: { icon: Clock, accent: 'amber' },
  findings: { icon: ShieldAlert, accent: 'red' },
};

interface Props {
  stats: StatViewModel[];
}

export function DashboardStats({ stats }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => {
        const { icon, accent } = META[s.key];
        return (
          <StatCard
            key={s.key}
            icon={icon}
            accent={accent}
            labelJa={s.labelJa}
            labelEn={s.labelEn}
            value={s.value}
            badge={s.badge}
            to={s.to}
          />
        );
      })}
    </div>
  );
}
