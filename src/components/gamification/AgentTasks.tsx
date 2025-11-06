import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, Calendar, CheckCircle } from 'lucide-react';
import { CompleteTaskDialog } from './CompleteTaskDialog';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Task {
  id: string;
  title: string;
  description: string | null;
  points: number;
  deadline: string;
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

      setTasks(tasksResult.data || []);
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
                        className="w-full"
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
