import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TaskCompletion {
  id: string;
  user_id: string;
  completed_at: string;
  status: string;
  notes: string | null;
  profiles: {
    name: string;
  };
}

interface TaskCompletionsDialogProps {
  taskId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export const TaskCompletionsDialog = ({ taskId, open, onOpenChange, onUpdate }: TaskCompletionsDialogProps) => {
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchCompletions = async () => {
    try {
      const { data: completionsData, error: completionsError } = await supabase
        .from('task_completions')
        .select('*')
        .eq('task_id', taskId)
        .order('completed_at', { ascending: false });

      if (completionsError) throw completionsError;

      // Fetch profile names separately
      if (completionsData && completionsData.length > 0) {
        const userIds = completionsData.map(c => c.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
        const enrichedData = completionsData.map(completion => ({
          ...completion,
          profiles: profilesMap.get(completion.user_id) || { name: 'Desconhecido' }
        }));
        setCompletions(enrichedData);
      } else {
        setCompletions([]);
      }
    } catch (error) {
      console.error('Error fetching completions:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as conclusões',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchCompletions();
    }
  }, [taskId, open]);

  const handleApprove = async (completionId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('task_completions')
        .update({
          status: 'approved',
          verified_by: user.id,
          verified_at: new Date().toISOString(),
        })
        .eq('id', completionId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Tarefa aprovada e pontos creditados',
      });
      fetchCompletions();
      onUpdate();
    } catch (error) {
      console.error('Error approving completion:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível aprovar a conclusão',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (completionId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('task_completions')
        .update({
          status: 'rejected',
          verified_by: user.id,
          verified_at: new Date().toISOString(),
        })
        .eq('id', completionId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Tarefa rejeitada',
      });
      fetchCompletions();
      onUpdate();
    } catch (error) {
      console.error('Error rejecting completion:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível rejeitar a conclusão',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Conclusões da Tarefa</DialogTitle>
          <DialogDescription>
            Revise e aprove as conclusões dos agentes
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div>Carregando...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Notas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completions.map((completion) => (
                <TableRow key={completion.id}>
                  <TableCell>{completion.profiles.name}</TableCell>
                  <TableCell>
                    {format(new Date(completion.completed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>{completion.notes || '-'}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        completion.status === 'approved'
                          ? 'default'
                          : completion.status === 'rejected'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {completion.status === 'approved'
                        ? 'Aprovada'
                        : completion.status === 'rejected'
                        ? 'Rejeitada'
                        : 'Pendente'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {completion.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove(completion.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(completion.id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Rejeitar
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
};
