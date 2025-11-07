import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trophy, Award, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { startOfWeek, startOfMonth, startOfYear, endOfWeek, endOfMonth, endOfYear, subDays } from 'date-fns';

interface AgentStats {
  user_id: string;
  name: string;
  email: string;
  tasks_completed: number;
  total_points_earned: number;
  rewards_purchased: number;
  total_points_spent: number;
}

type PeriodFilter = 'week' | 'month' | 'year' | 'all' | 'last7' | 'last30';

export const TasksRanking = () => {
  const [stats, setStats] = useState<AgentStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodFilter>('month');
  const { toast } = useToast();

  const getDateRange = (filter: PeriodFilter) => {
    const now = new Date();
    switch (filter) {
      case 'week':
        return { start: startOfWeek(now, { weekStartsOn: 0 }), end: endOfWeek(now, { weekStartsOn: 0 }) };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'year':
        return { start: startOfYear(now), end: endOfYear(now) };
      case 'last7':
        return { start: subDays(now, 7), end: now };
      case 'last30':
        return { start: subDays(now, 30), end: now };
      case 'all':
      default:
        return null;
    }
  };

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const dateRange = getDateRange(period);
      
      // Fetch task completions
      let taskCompletionsQuery = supabase
        .from('task_completions')
        .select('user_id, completed_at, status');
      
      if (dateRange) {
        taskCompletionsQuery = taskCompletionsQuery
          .gte('completed_at', dateRange.start.toISOString())
          .lte('completed_at', dateRange.end.toISOString());
      }
      
      const { data: taskCompletions, error: taskError } = await taskCompletionsQuery;
      if (taskError) throw taskError;

      // Fetch reward purchases
      let rewardPurchasesQuery = supabase
        .from('reward_purchases')
        .select('user_id, purchased_at, points_spent');
      
      if (dateRange) {
        rewardPurchasesQuery = rewardPurchasesQuery
          .gte('purchased_at', dateRange.start.toISOString())
          .lte('purchased_at', dateRange.end.toISOString());
      }
      
      const { data: rewardPurchases, error: rewardError } = await rewardPurchasesQuery;
      if (rewardError) throw rewardError;

      // Fetch agent wallets for points info
      const { data: wallets, error: walletError } = await supabase
        .from('agent_wallets')
        .select('user_id, total_earned, total_spent');
      if (walletError) throw walletError;

      // Fetch profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, email');
      if (profileError) throw profileError;

      // Aggregate stats by user
      const userStatsMap = new Map<string, AgentStats>();

      profiles?.forEach(profile => {
        userStatsMap.set(profile.id, {
          user_id: profile.id,
          name: profile.name || 'Sem nome',
          email: profile.email || '',
          tasks_completed: 0,
          total_points_earned: 0,
          rewards_purchased: 0,
          total_points_spent: 0,
        });
      });

      // Count completed tasks (approved)
      taskCompletions?.forEach(completion => {
        if (completion.status === 'approved') {
          const userStats = userStatsMap.get(completion.user_id);
          if (userStats) {
            userStats.tasks_completed++;
          }
        }
      });

      // Count reward purchases and points spent
      rewardPurchases?.forEach(purchase => {
        const userStats = userStatsMap.get(purchase.user_id);
        if (userStats) {
          userStats.rewards_purchased++;
          userStats.total_points_spent += purchase.points_spent;
        }
      });

      // Add wallet totals for context
      wallets?.forEach(wallet => {
        const userStats = userStatsMap.get(wallet.user_id);
        if (userStats) {
          userStats.total_points_earned = wallet.total_earned;
        }
      });

      // Convert to array and sort by tasks completed
      const statsArray = Array.from(userStatsMap.values())
        .filter(stat => stat.tasks_completed > 0 || stat.rewards_purchased > 0)
        .sort((a, b) => b.tasks_completed - a.tasks_completed);

      setStats(statsArray);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as estatísticas',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [period]);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Trophy className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Trophy className="h-5 w-5 text-amber-600" />;
    return <span className="text-muted-foreground">#{index + 1}</span>;
  };

  if (isLoading) {
    return <div>Carregando estatísticas...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Ranking de Agentes
            </CardTitle>
            <CardDescription>
              Performance dos agentes em tarefas e resgates
            </CardDescription>
          </div>
          <Select value={period} onValueChange={(value) => setPeriod(value as PeriodFilter)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
              <SelectItem value="year">Este Ano</SelectItem>
              <SelectItem value="last7">Últimos 7 dias</SelectItem>
              <SelectItem value="last30">Últimos 30 dias</SelectItem>
              <SelectItem value="all">Todo o Período</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {stats.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhum dado disponível para o período selecionado
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Agente</TableHead>
                <TableHead className="text-center">Tarefas Concluídas</TableHead>
                <TableHead className="text-center">Pontos Ganhos</TableHead>
                <TableHead className="text-center">Prêmios Resgatados</TableHead>
                <TableHead className="text-center">Pontos Gastos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.map((stat, index) => (
                <TableRow key={stat.user_id}>
                  <TableCell className="font-medium">
                    {getRankIcon(index)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{stat.name}</p>
                      <p className="text-xs text-muted-foreground">{stat.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="gap-1">
                      <Award className="h-3 w-3" />
                      {stat.tasks_completed}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-green-600 font-semibold">
                      {stat.total_points_earned} pts
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">
                      {stat.rewards_purchased}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-red-600 font-semibold">
                      {stat.total_points_spent} pts
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
