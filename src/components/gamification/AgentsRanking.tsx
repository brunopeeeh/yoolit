import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Trophy, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AgentRankingData {
  agent_name: string;
  completed_tasks: number;
  total_points: number;
}

export const AgentsRanking = () => {
  const [rankingData, setRankingData] = useState<AgentRankingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRankingData = async () => {
    try {
      // Fetch approved task completions with user profiles and task points
      const { data, error } = await supabase
        .from('task_completions')
        .select(`
          user_id,
          task_id,
          tasks!inner(points),
          profiles!inner(name)
        `)
        .eq('status', 'approved');

      if (error) throw error;

      // Group by user and calculate totals
      const grouped = (data || []).reduce((acc: Record<string, { name: string; tasks: number; points: number }>, item: any) => {
        const userId = item.user_id;
        const userName = item.profiles?.name || 'Sem nome';
        const taskPoints = item.tasks?.points || 0;

        if (!acc[userId]) {
          acc[userId] = { name: userName, tasks: 0, points: 0 };
        }
        acc[userId].tasks += 1;
        acc[userId].points += taskPoints;
        return acc;
      }, {});

      // Convert to array and sort by points
      const rankingArray = Object.values(grouped)
        .map((agent) => ({
          agent_name: agent.name,
          completed_tasks: agent.tasks,
          total_points: agent.points,
        }))
        .sort((a, b) => b.total_points - a.total_points)
        .slice(0, 10); // Top 10

      setRankingData(rankingArray);
    } catch (error) {
      console.error('Error fetching ranking data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRankingData();
  }, []);

  if (isLoading) {
    return <div>Carregando ranking...</div>;
  }

  if (rankingData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Ranking de Agentes
          </CardTitle>
          <CardDescription>
            Ainda não há dados suficientes para exibir o ranking
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Ranking de Agentes
        </CardTitle>
        <CardDescription>
          Top 10 agentes por conclusão de tarefas e pontos ganhos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Bar Chart */}
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={rankingData}
              margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="agent_name"
                angle={-45}
                textAnchor="end"
                height={100}
                className="text-xs"
              />
              <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--primary))" />
              <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--chart-2))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="completed_tasks"
                fill="hsl(var(--primary))"
                name="Tarefas Concluídas"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                yAxisId="right"
                dataKey="total_points"
                fill="hsl(var(--chart-2))"
                name="Pontos Totais"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>

          {/* Ranking List */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold mb-3">
              <TrendingUp className="h-4 w-4" />
              Ranking Detalhado
            </div>
            {rankingData.map((agent, index) => (
              <div
                key={agent.agent_name}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Badge
                    variant={index === 0 ? 'default' : 'secondary'}
                    className={
                      index === 0
                        ? 'bg-yellow-500 text-yellow-950 hover:bg-yellow-600'
                        : index === 1
                        ? 'bg-gray-400 text-gray-950'
                        : index === 2
                        ? 'bg-orange-600 text-orange-950'
                        : ''
                    }
                  >
                    {index + 1}º
                  </Badge>
                  <span className="font-medium">{agent.agent_name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-right">
                    <div className="text-muted-foreground">Tarefas</div>
                    <div className="font-bold">{agent.completed_tasks}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-muted-foreground">Pontos</div>
                    <div className="font-bold text-primary">{agent.total_points}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
