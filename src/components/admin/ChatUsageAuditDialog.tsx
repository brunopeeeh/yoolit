import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChatUsageAuditDialogProps {
  taskId: string;
  taskTitle: string;
  chatTargetCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AgentUsage {
  user_id: string;
  user_name: string;
  message_count: number;
  messages: Array<{ content: string; created_at: string }>;
}

export const ChatUsageAuditDialog = ({ taskId, taskTitle, chatTargetCount, open, onOpenChange }: ChatUsageAuditDialogProps) => {
  const [agentUsages, setAgentUsages] = useState<AgentUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const fetchAuditData = async () => {
      setIsLoading(true);
      try {
        // Get all chat logs
        const { data: logs, error: logsError } = await supabase
          .from('chat_usage_logs')
          .select('user_id, message_content, created_at')
          .order('created_at', { ascending: false });

        if (logsError) throw logsError;

        // Get profiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, email');

        // Group by user
        const userMap = new Map<string, AgentUsage>();
        (logs || []).forEach((log: any) => {
          const profile = profiles?.find((p: any) => p.id === log.user_id);
          if (!userMap.has(log.user_id)) {
            userMap.set(log.user_id, {
              user_id: log.user_id,
              user_name: profile?.name || profile?.email || 'Desconhecido',
              message_count: 0,
              messages: [],
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

    fetchAuditData();
  }, [open, taskId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Auditoria de Uso do Chat</DialogTitle>
          <DialogDescription>
            {taskTitle} — Meta: {chatTargetCount} mensagens
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
              {agentUsages.map((agent) => (
                <>
                  <TableRow key={agent.user_id}>
                    <TableCell className="font-medium">{agent.user_name}</TableCell>
                    <TableCell>{agent.message_count}</TableCell>
                    <TableCell>
                      <Badge variant={agent.message_count >= chatTargetCount ? 'default' : 'secondary'}>
                        {agent.message_count >= chatTargetCount ? 'Atingiu meta' : `${agent.message_count}/${chatTargetCount}`}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <button
                        className="text-xs text-primary underline"
                        onClick={() => setExpandedUser(expandedUser === agent.user_id ? null : agent.user_id)}
                      >
                        {expandedUser === agent.user_id ? 'Ocultar' : 'Ver mensagens'}
                      </button>
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
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
};
