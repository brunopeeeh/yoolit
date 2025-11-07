import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, Calendar, CheckCircle, ListChecks } from 'lucide-react';
import { CompleteTaskDialog } from './CompleteTaskDialog';
import { AgentsRanking } from './AgentsRanking';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Task {
  id: string;
  title: string;
  description: string | null;
  completion_rules: string | null;
  points: number;
  deadline: string;
  task_type: 'simple' | 'checklist';
  checklist_items: Array<{ id: string; description: string; points: number }> | null;
}

interface TaskCompletion {
  task_id: string;
  status: string;
}

export const AgentTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const [tasksResult, completionsResult] = await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .eq('is_active', true)
          .gte('deadline', new Date().toISOString())
          .order('deadline', { ascending: true }),
        supabase
          .from('task_completions')
          .select('task_id, status')
          .eq('user_id', user.id),
      ]);

      if (tasksResult.error) throw tasksResult.error;
      if (completionsResult.error) throw completionsResult.error;

      setTasks((tasksResult.data || []) as unknown as Task[]);
      setCompletions(completionsResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as tarefas',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getTaskStatus = (taskId: string) => {
    const completion = completions.find((c) => c.task_id === taskId);
    return completion?.status || null;
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <AgentsRanking />
      
      <Card>
        <CardHeader>
          <CardTitle>Tarefas Disponíveis</CardTitle>
          <CardDescription>
            Complete tarefas para ganhar pontos e trocar por recompensas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => {
              const status = getTaskStatus(task.id);
              return (
                <Card key={task.id} className="relative">
                  {status && (
                    <div className="absolute top-2 right-2">
                      <Badge
                        variant={
                          status === 'approved'
                            ? 'default'
                            : status === 'rejected'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {status === 'approved'
                          ? 'Aprovada'
                          : status === 'rejected'
                          ? 'Rejeitada'
                          : 'Pendente'}
                      </Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                    {task.description && (
                      <CardDescription>{task.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {task.task_type === 'simple' && task.completion_rules && (
                      <div className="p-3 bg-muted rounded-lg space-y-2">
                        <div className="flex items-center gap-2 font-semibold text-sm">
                          <ListChecks className="h-4 w-4" />
                          Regras para Conclusão
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                          {task.completion_rules}
                        </p>
                      </div>
                    )}
                    {task.task_type === 'checklist' && task.checklist_items && (
                      <div className="p-3 bg-muted rounded-lg space-y-2">
                        <div className="flex items-center gap-2 font-semibold text-sm">
                          <ListChecks className="h-4 w-4" />
                          Checklist ({task.checklist_items.length} itens)
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Complete os itens para ganhar pontos
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-yellow-500" />
                        <span className="font-bold text-lg">{task.points} pts</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(task.deadline), "dd/MM HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                    {!status && (
                      <Button
                        className="w-full bg-[#83cef6] hover:bg-[#8dd1f6] text-[#0a639a]"
                        onClick={() => setSelectedTask(task)}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Concluir Tarefa
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedTask && (
        <CompleteTaskDialog
          task={selectedTask}
          open={!!selectedTask}
          onOpenChange={(open) => !open && setSelectedTask(null)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
};
