import { Link } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { BilingualLabel } from '@/components/shared/BilingualLabel';

interface Props {
  clientCount: number;
  projectCount: number;
}

export function DashboardStats({ clientCount, projectCount }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Link to="/clients">
        <Card className="transition-shadow hover:ring-foreground/20">
          <CardHeader>
            <CardDescription>
              <BilingualLabel ja="クライアント" en="Clients" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-semibold">{clientCount}</span>
          </CardContent>
        </Card>
      </Link>
      <Link to="/projects">
        <Card className="transition-shadow hover:ring-foreground/20">
          <CardHeader>
            <CardDescription>
              <BilingualLabel ja="プロジェクト" en="Projects" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-semibold">{projectCount}</span>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
