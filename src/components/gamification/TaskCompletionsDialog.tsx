import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, XCircle, User, Calendar, FileText, Link as LinkIcon, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TaskCompletion {
  id: string;
  user_id: string;
  completed_at: string;
  status: string;
  notes: string | null;
  links: string | null;
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
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Conclusões da Tarefa</DialogTitle>
          <DialogDescription>
            Revise e aprove as conclusões submetidas pelos agentes
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-2">
              <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Carregando conclusões...</p>
            </div>
          </div>
        ) : completions.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-2 text-center">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Nenhuma conclusão encontrada</p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[calc(85vh-180px)] pr-4">
            <div className="space-y-4">
              {completions.map((completion) => (
                <Card key={completion.id} className="p-6 hover:shadow-md transition-shadow">
                  <div className="space-y-4">
                    {/* Header with agent info and status */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-base truncate">{completion.profiles.name}</h4>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{format(new Date(completion.completed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant={
                          completion.status === 'approved'
                            ? 'default'
                            : completion.status === 'rejected'
                            ? 'destructive'
                            : 'secondary'
                        }
                        className="shrink-0"
                      >
                        {completion.status === 'approved'
                          ? 'Aprovada'
                          : completion.status === 'rejected'
                          ? 'Rejeitada'
                          : 'Pendente'}
                      </Badge>
                    </div>

                    {/* Notes section */}
                    {completion.notes && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>Notas</span>
                        </div>
                        <p className="text-sm text-muted-foreground pl-6 whitespace-pre-wrap">
                          {completion.notes}
                        </p>
                      </div>
                    )}

                    {/* Links section */}
                    {completion.links && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <LinkIcon className="h-4 w-4 text-muted-foreground" />
                          <span>Links</span>
                        </div>
                        <div className="flex flex-col gap-2 pl-6">
                          {completion.links.split('\n').filter(link => link.trim()).map((link, idx) => (
                            <a
                              key={idx}
                              href={link.trim()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline break-all flex items-start gap-2"
                            >
                              <LinkIcon className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                              {link.trim()}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    {completion.status === 'pending' && (
                      <div className="flex gap-3 pt-2">
                        <Button
                          className="flex-1"
                          variant="default"
                          onClick={() => handleApprove(completion.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Aprovar
                        </Button>
                        <Button
                          className="flex-1"
                          variant="outline"
                          onClick={() => handleReject(completion.id)}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Rejeitar
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};
