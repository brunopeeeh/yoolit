import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, Loader2 } from 'lucide-react';

interface ChatUsageAuditDialogProps {
  taskId: string;
  taskTitle: string;
  chatTargetCount: number;
  taskPoints: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AgentUsage {
  user_id: string;
  user_name: string;
  message_count: number;
  messages: Array<{ content: string; created_at: string }>;
  hasApprovedCompletion: boolean;
  hasPendingCompletion: boolean;
}

export const ChatUsageAuditDialog = ({ taskId, taskTitle, chatTargetCount, taskPoints, open, onOpenChange }: ChatUsageAuditDialogProps) => {
  const [agentUsages, setAgentUsages] = useState<AgentUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [approvingUser, setApprovingUser] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAuditData = async () => {
    setIsLoading(true);
    try {
      // Get all chat logs, task completions, and profiles in parallel
      const [logsRes, profilesRes, completionsRes] = await Promise.all([
        supabase
          .from('chat_usage_logs')
          .select('user_id, message_content, created_at')
          .order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, name, email'),
        supabase
          .from('task_completions')
          .select('user_id, status')
          .eq('task_id', taskId),
      ]);

      if (logsRes.error) throw logsRes.error;

      // Group by user
      const userMap = new Map<string, AgentUsage>();
      (logsRes.data || []).forEach((log: any) => {
        const profile = profilesRes.data?.find((p: any) => p.id === log.user_id);
        if (!userMap.has(log.user_id)) {
          const completions = (completionsRes.data || []).filter((c: any) => c.user_id === log.user_id);
          userMap.set(log.user_id, {
            user_id: log.user_id,
            user_name: profile?.name || profile?.email || 'Desconhecido',
            message_count: 0,
            messages: [],
            hasApprovedCompletion: completions.some((c: any) => c.status === 'approved'),
            hasPendingCompletion: completions.some((c: any) => c.status === 'pending'),
          });
        }
        const entry = userMap.get(log.user_id)!;
        entry.message_count++;
        entry.messages.push({ content: log.message_content, created_at: log.created_at });
      });

      setAgentUsages(Array.from(userMap.values()).sort((a, b) => b.message_count - a.message_count));
    } catch (error) {
      console.error('Error fetching audit data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    fetchAuditData();
  }, [open, taskId]);

  const handleApprove = async (userId: string) => {
    setApprovingUser(userId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // Check if completion already exists
      const { data: existing } = await supabase
        .from('task_completions')
        .select('id, status')
        .eq('task_id', taskId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        // Update existing to approved
        const { error } = await supabase
          .from('task_completions')
          .update({
            status: 'approved',
            verified_by: user.id,
            verified_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        // Create new approved completion
        const { error } = await supabase
          .from('task_completions')
          .insert({
            task_id: taskId,
            user_id: userId,
            status: 'approved',
            verified_by: user.id,
            verified_at: new Date().toISOString(),
            notes: `Meta de ${chatTargetCount} mensagens atingida via chat`,
          });
        if (error) throw error;
      }

      toast({
        title: 'Aprovado!',
        description: `Pontos (${taskPoints}) creditados ao agente.`,
      });

      fetchAuditData();
    } catch (error) {
      console.error('Error approving:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível aprovar o resgate.',
        variant: 'destructive',
      });
    } finally {
      setApprovingUser(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Auditoria de Uso do Chat</DialogTitle>
          <DialogDescription>
            {taskTitle} — Meta: {chatTargetCount} mensagens • {taskPoints} pts
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Carregando...</div>
        ) : agentUsages.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">Nenhum registro encontrado</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agente</TableHead>
                <TableHead>Mensagens</TableHead>
                <TableHead>Progresso</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agentUsages.map((agent) => {
                const reachedTarget = agent.message_count >= chatTargetCount;
                return (
                  <>
                    <TableRow key={agent.user_id}>
                      <TableCell className="font-medium">{agent.user_name}</TableCell>
                      <TableCell>{agent.message_count}</TableCell>
                      <TableCell>
                        <Badge variant={reachedTarget ? 'default' : 'secondary'}>
                          {reachedTarget ? 'Atingiu meta' : `${agent.message_count}/${chatTargetCount}`}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <button
                            className="text-xs text-primary underline"
                            onClick={() => setExpandedUser(expandedUser === agent.user_id ? null : agent.user_id)}
                          >
                            {expandedUser === agent.user_id ? 'Ocultar' : 'Ver mensagens'}
                          </button>
                          {reachedTarget && (
                            agent.hasApprovedCompletion ? (
                              <Badge variant="default" className="bg-green-600 text-white text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Aprovado
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                variant="default"
                                className="h-7 text-xs bg-green-600 hover:bg-green-700"
                                disabled={approvingUser === agent.user_id}
                                onClick={() => handleApprove(agent.user_id)}
                              >
                                {approvingUser === agent.user_id ? (
                                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                ) : (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                )}
                                Aprovar Pontos
                              </Button>
                            )
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedUser === agent.user_id && (
                      <TableRow key={`${agent.user_id}-messages`}>
                        <TableCell colSpan={4}>
                          <div className="max-h-60 overflow-y-auto space-y-1 p-2 bg-muted rounded-lg">
                            {agent.messages.slice(0, 50).map((msg, idx) => (
                              <div key={idx} className="text-xs flex gap-2">
                                <span className="text-muted-foreground flex-shrink-0">
                                  {format(new Date(msg.created_at), "dd/MM HH:mm", { locale: ptBR })}
                                </span>
                                <span>{msg.content}</span>
                              </div>
                            ))}
                            {agent.messages.length > 50 && (
                              <p className="text-xs text-muted-foreground">... e mais {agent.messages.length - 50} mensagens</p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
};
