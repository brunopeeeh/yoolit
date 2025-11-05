import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, RefreshCw, CheckCircle, TrendingUp } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  trend?: string;
}

const StatCard = ({ title, value, subtitle, icon, trend }: StatCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      {trend && (
        <p className="text-xs text-emerald-600 mt-1 font-medium">{trend}</p>
      )}
    </CardContent>
  </Card>
);

interface DashboardStatsProps {
  availableAgents: number;
  totalAgents: number;
  pendingSwaps: number;
  approvedSwaps: number;
  coverage: number;
}

export const DashboardStats = ({
  availableAgents,
  totalAgents,
  pendingSwaps,
  approvedSwaps,
  coverage,
}: DashboardStatsProps) => {
  const availablePercentage = totalAgents > 0 
    ? Math.round((availableAgents / totalAgents) * 100) 
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Agentes Disponíveis"
        value={`${availableAgents}/${totalAgents}`}
        subtitle={`${availablePercentage}% da equipe disponível agora`}
        icon={<Users className="h-4 w-4 text-muted-foreground" />}
      />
      <StatCard
        title="Trocas Pendentes"
        value={pendingSwaps.toString()}
        subtitle="+2 desde ontem"
        icon={<RefreshCw className="h-4 w-4 text-muted-foreground" />}
      />
      <StatCard
        title="Trocas Aprovadas"
        value={approvedSwaps.toString()}
        subtitle="Neste mês"
        icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
      />
      <StatCard
        title="Cobertura"
        value={`${coverage}%`}
        subtitle="+5% comparado ao mês anterior"
        icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        trend="+5%"
      />
    </div>
  );
};
