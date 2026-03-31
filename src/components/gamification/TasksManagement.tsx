import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Calendar, Award, CheckCircle, XCircle, Pencil, MessageSquare } from 'lucide-react';
import { CreateTaskDialog } from './CreateTaskDialog';
import { EditTaskDialog } from './EditTaskDialog';
import { TaskCompletionsDialog } from './TaskCompletionsDialog';
import { TasksRanking } from './TasksRanking';
import { ChatUsageAuditDialog } from '@/components/admin/ChatUsageAuditDialog';
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
  is_active: boolean;
  created_at: string;
  task_type: 'simple' | 'checklist' | 'chat_usage';
  checklist_items: Array<{ id: string; description: string; points: number }> | null;
  chat_target_count: number | null;
}

export const TasksManagement = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [auditTask, setAuditTask] = useState<Task | null>(null);
  const { toast } = useToast();

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('deadline', { ascending: true });

      if (error) throw error;
      setTasks((data || []) as unknown as Task[]);
    } catch (error) {
      console.error('Error fetching tasks:', error);
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
    fetchTasks();
  }, []);

  const toggleTaskStatus = async (taskId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ is_active: !currentStatus })
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `Tarefa ${!currentStatus ? 'ativada' : 'desativada'} com sucesso`,
      });
      fetchTasks();
    } catch (error) {
      console.error('Error toggling task status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a tarefa',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <TasksRanking />
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gerenciar Tarefas</CardTitle>
              <CardDescription>
                Crie tarefas para os agentes completarem e ganharem pontos
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)} className="bg-[#83cef6] hover:bg-[#8dd1f6] text-[#0a639a]">
              <Plus className="mr-2 h-4 w-4" />
              Nova Tarefa
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarefa</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Pontos</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{task.title}</p>
                      {task.description && (
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      )}
                      {task.task_type === 'simple' && task.completion_rules && (
                        <p className="text-xs text-muted-foreground mt-1">
                          📋 Regras: {task.completion_rules.substring(0, 80)}
                          {task.completion_rules.length > 80 ? '...' : ''}
                        </p>
                      )}
                      {task.task_type === 'checklist' && task.checklist_items && (
                        <p className="text-xs text-muted-foreground mt-1">
                          ✓ {task.checklist_items.length} itens na checklist
                        </p>
                      )}
                      {task.task_type === 'chat_usage' && task.chat_target_count && (
                        <p className="text-xs text-muted-foreground mt-1">
                          💬 Meta: {task.chat_target_count} mensagens
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {task.task_type === 'simple' ? 'Simples' : task.task_type === 'checklist' ? 'Checklist' : 'Uso do Chat'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      <Award className="mr-1 h-3 w-3" />
                      {task.points} pts
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(task.deadline), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={task.is_active ? 'default' : 'secondary'}>
                      {task.is_active ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingTask(task)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTask(task.id)}
                      >
                        Ver Conclusões
                      </Button>
                      {task.task_type === 'chat_usage' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAuditTask(task)}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Auditoria
                        </Button>
                      )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleTaskStatus(task.id, task.is_active)}
                      >
                        {task.is_active ? (
                          <XCircle className="h-4 w-4" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CreateTaskDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={fetchTasks}
      />

      <EditTaskDialog
        task={editingTask}
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
        onSuccess={fetchTasks}
      />

      {selectedTask && (
        <TaskCompletionsDialog
          taskId={selectedTask}
          open={!!selectedTask}
          onOpenChange={(open) => !open && setSelectedTask(null)}
          onUpdate={fetchTasks}
        />
      )}
    </div>
  );
};
