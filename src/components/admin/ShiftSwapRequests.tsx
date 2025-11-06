import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowRight, Plus, X, Check, Trash2, Wallet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { NewSwapRequestDialog } from './NewSwapRequestDialog';
import { PreApprovalDialog } from './PreApprovalDialog';
import { useRoles } from '@/hooks/useRoles';

interface SwapCredit {
  id: string;
  creditor_id: string;
  debtor_id: string;
  status: 'pending' | 'scheduled' | 'redeemed';
  scheduled_payment_date: string | null;
  scheduled_payment_time: string | null;
  created_at: string;
  debtor?: {
    name: string;
  };
  creditor?: {
    name: string;
  };
}

interface SwapRequest {
  id: string;
  created_at: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  payment_scheduled_for: string | null;
  swap_date: string | null;
  target_approved: boolean;
  target_approved_at: string | null;
  requester: {
    id: string;
    name: string;
  };
  target: {
    id: string;
    name: string;
  };
  requester_schedule?: {
    day_of_week: string;
    work_start_time: string;
    work_end_time: string;
  };
  target_schedule?: {
    day_of_week: string;
    work_start_time: string;
    work_end_time: string;
  };
  // Manter campos antigos para compatibilidade
  requester_shift?: {
    shift_date: string;
    start_time: string;
    end_time: string;
  };
  target_shift?: {
    shift_date: string;
    start_time: string;
    end_time: string;
  };
}

const getInitials = (name: string) => {
  const names = name.split(' ');
  if (names.length >= 2) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const getDayOfWeek = (date: string) => {
  return format(new Date(date), 'EEEE', { locale: ptBR });
};

const formatTime = (time: string) => {
  return time.substring(0, 5);
};

const statusBadgeConfig = {
  pending: { label: 'Aguardando Agente', className: 'bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20' },
  pending_supervisor: { label: 'Aguardando Supervisor', className: 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' },
  approved: { label: 'Aprovada', className: 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' },
  rejected: { label: 'Recusada', className: 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20' },
  cancelled: { label: 'Cancelada', className: 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20' },
  completed: { label: 'Concluída', className: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20' },
};

const SwapRequestCard = ({ request, onUpdate, currentUserId, swapCredits }: { 
  request: SwapRequest; 
  onUpdate: () => void; 
  currentUserId: string | null;
  swapCredits: SwapCredit[];
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPreApprovalDialog, setShowPreApprovalDialog] = useState(false);
  const { isAdmin, hasRole } = useRoles(currentUserId || undefined);
  
  const canDelete = currentUserId === request.requester.id || isAdmin;
  const isTarget = currentUserId === request.target.id;
  const isSupervisor = hasRole('supervisor');
  const canSupervisorApprove = isAdmin || isSupervisor;
  
  // Determine display status
  const displayStatus = request.status === 'pending' && request.target_approved 
    ? 'pending_supervisor' 
    : request.status;

  // Count pending credits with the requester
  const pendingCreditsCount = swapCredits.filter(
    credit => credit.debtor_id === request.requester.id && credit.status === 'pending'
  ).length;

  const handleTargetApprove = async (paymentType: 'scheduled' | 'wallet', scheduledDate?: Date, scheduledTime?: string) => {
    setIsUpdating(true);
    try {
      // Update swap request with pre-approval
      const { error: swapError } = await supabase
        .from('shift_swap_requests')
        .update({ 
          target_approved: true,
          target_approved_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (swapError) throw swapError;

      // Create swap credit record
      const creditData: any = {
        creditor_id: request.target.id,
        debtor_id: request.requester.id,
        swap_request_id: request.id,
        status: paymentType === 'scheduled' ? 'scheduled' : 'pending'
      };

      if (paymentType === 'scheduled' && scheduledDate && scheduledTime) {
        creditData.scheduled_payment_date = format(scheduledDate, 'yyyy-MM-dd');
        creditData.scheduled_payment_time = scheduledTime;
      }

      const { error: creditError } = await supabase
        .from('swap_credits')
        .insert(creditData);

      if (creditError) throw creditError;

      const message = paymentType === 'wallet' 
        ? 'Troca pré-aprovada e adicionada ao seu saldo!' 
        : 'Troca pré-aprovada e pagamento agendado!';
      
      toast.success(message);
      setShowPreApprovalDialog(false);
      onUpdate();
    } catch (error: any) {
      console.error('Error approving as target:', error);
      toast.error(error.message || 'Erro ao pré-aprovar solicitação');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSupervisorApprove = async () => {
    setIsUpdating(true);
    try {
      // Verificar se o agente já aprovou
      if (!request.target_approved) {
        toast.error('O agente destinatário precisa aprovar primeiro');
        setIsUpdating(false);
        return;
      }

      const { error } = await supabase
        .from('shift_swap_requests')
        .update({ 
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', request.id);

      if (error) throw error;
      toast.success('Troca confirmada pelo supervisor!');
      onUpdate();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Erro ao aprovar solicitação');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('shift_swap_requests')
        .update({ 
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', request.id);

      if (error) throw error;
      toast.success('Solicitação recusada');
      onUpdate();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Erro ao recusar solicitação');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('shift_swap_requests')
        .delete()
        .eq('id', request.id);

      if (error) throw error;
      toast.success('Solicitação excluída');
      onUpdate();
    } catch (error) {
      console.error('Error deleting request:', error);
      toast.error('Erro ao excluir solicitação');
    } finally {
      setIsUpdating(false);
    }
  };

  const statusConfig = statusBadgeConfig[displayStatus as keyof typeof statusBadgeConfig];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="font-semibold text-lg">Solicitação #{request.id.substring(0, 1)}</h3>
            <p className="text-sm text-muted-foreground">
              {format(new Date(request.created_at), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          </div>
          <Badge className={statusConfig.className}>
            {statusConfig.label}
          </Badge>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-background border-2 border-primary flex items-center justify-center font-bold text-sm">
              {getInitials(request.requester.name)}
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{request.requester.name}</p>
              {request.requester_schedule ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    {formatTime(request.requester_schedule.work_start_time)} - {formatTime(request.requester_schedule.work_end_time)}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {request.swap_date ? getDayOfWeek(request.swap_date) : request.requester_schedule.day_of_week}
                  </p>
                </>
              ) : request.requester_shift ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    {formatTime(request.requester_shift.start_time)} - {formatTime(request.requester_shift.end_time)}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {getDayOfWeek(request.requester_shift.shift_date)}
                  </p>
                </>
              ) : null}
            </div>
          </div>

          <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />

          <div className="flex-1 flex items-center gap-3 justify-end">
            <div className="flex-1 text-right">
              <p className="font-medium text-sm">{request.target.name}</p>
              {request.target_schedule ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    {formatTime(request.target_schedule.work_start_time)} - {formatTime(request.target_schedule.work_end_time)}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {request.swap_date ? getDayOfWeek(request.swap_date) : request.target_schedule.day_of_week}
                  </p>
                </>
              ) : request.target_shift ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    {formatTime(request.target_shift.start_time)} - {formatTime(request.target_shift.end_time)}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {getDayOfWeek(request.target_shift.shift_date)}
                  </p>
                </>
              ) : null}
            </div>
            <div className="w-12 h-12 rounded-full bg-background border-2 border-secondary flex items-center justify-center font-bold text-sm">
              {getInitials(request.target.name)}
            </div>
          </div>
        </div>

        <div className="mb-6 space-y-2 text-sm">
          <p>
            <span className="font-medium">Motivo:</span> {request.reason}
          </p>
          {request.payment_scheduled_for ? (
            <p>
              <span className="font-medium">Pagamento:</span>{' '}
              {format(new Date(request.payment_scheduled_for), "dd/MM/yyyy (HH:mm - HH:mm)", { locale: ptBR })}
            </p>
          ) : (
            <p className="text-amber-600">
              <span className="font-medium">Pagamento:</span> ⚠️ Em aberto
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {request.status === 'pending' && !request.target_approved && isTarget && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleReject}
                disabled={isUpdating}
              >
                <X className="h-4 w-4 mr-2" />
                Recusar
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white"
                onClick={() => setShowPreApprovalDialog(true)}
                disabled={isUpdating}
              >
                <Check className="h-4 w-4 mr-2" />
                Pré-aprovar
              </Button>
            </>
          )}
          
          {request.status === 'pending' && request.target_approved && canSupervisorApprove && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleReject}
                disabled={isUpdating}
              >
                <X className="h-4 w-4 mr-2" />
                Recusar
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                onClick={handleSupervisorApprove}
                disabled={isUpdating}
              >
                <Check className="h-4 w-4 mr-2" />
                Confirmar Troca
              </Button>
            </>
          )}
          
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={request.status === 'pending' ? '' : 'w-full'}
                  disabled={isUpdating}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir esta solicitação de troca? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {pendingCreditsCount > 0 && isTarget && (
          <div className="mt-4 pt-4 border-t flex items-center gap-2 text-sm text-muted-foreground">
            <Wallet className="h-4 w-4" />
            <span>
              {request.requester.name} tem {pendingCreditsCount} {pendingCreditsCount === 1 ? 'crédito pendente' : 'créditos pendentes'} com você
            </span>
          </div>
        )}
      </CardContent>

      <PreApprovalDialog
        open={showPreApprovalDialog}
        onOpenChange={setShowPreApprovalDialog}
        onConfirm={handleTargetApprove}
        isLoading={isUpdating}
      />
    </Card>
  );
};

interface ShiftSwapRequestsProps {
  isAgentView?: boolean;
}

export const ShiftSwapRequests = ({ isAgentView = false }: ShiftSwapRequestsProps) => {
  const [requests, setRequests] = useState<SwapRequest[]>([]);
  const [swapCredits, setSwapCredits] = useState<SwapCredit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterAgent, setFilterAgent] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'pending' | 'approved' | 'rejected' | 'all' | 'mine' | 'supervisor' | 'agent'>('pending');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    fetchCurrentUser();
  }, []);

  const fetchSwapCredits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('swap_credits')
        .select(`
          id,
          creditor_id,
          debtor_id,
          status,
          scheduled_payment_date,
          scheduled_payment_time,
          created_at,
          creditor:profiles!swap_credits_creditor_id_fkey(name),
          debtor:profiles!swap_credits_debtor_id_fkey(name)
        `)
        .or(`creditor_id.eq.${user.id},debtor_id.eq.${user.id}`);

      if (error) throw error;

      const credits: SwapCredit[] = (data || []).map((credit: any) => ({
        id: credit.id,
        creditor_id: credit.creditor_id,
        debtor_id: credit.debtor_id,
        status: credit.status,
        scheduled_payment_date: credit.scheduled_payment_date,
        scheduled_payment_time: credit.scheduled_payment_time,
        created_at: credit.created_at,
        creditor: credit.creditor || { name: 'Usuário desconhecido' },
        debtor: credit.debtor || { name: 'Usuário desconhecido' },
      }));

      setSwapCredits(credits);
    } catch (error) {
      console.error('Error fetching swap credits:', error);
    }
  };

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Buscar solicitações de troca com dados relacionados
      let query = supabase
        .from('shift_swap_requests')
        .select(`
          id,
          created_at,
          reason,
          status,
          payment_scheduled_for,
          swap_date,
          target_approved,
          target_approved_at,
          requester_id,
          target_id,
          requester_shift_id,
          target_shift_id,
          requester_schedule_id,
          target_schedule_id,
          requester:profiles!shift_swap_requests_requester_id_fkey(id, name),
          target:profiles!shift_swap_requests_target_id_fkey(id, name),
          requester_schedule:agent_schedules!shift_swap_requests_requester_schedule_id_fkey(
            day_of_week,
            work_start_time,
            work_end_time
          ),
          target_schedule:agent_schedules!shift_swap_requests_target_schedule_id_fkey(
            day_of_week,
            work_start_time,
            work_end_time
          )
        `)
        .order('created_at', { ascending: false });

      // Aplicar filtros baseados no status
      if (filterStatus === 'mine') {
        // Mostrar apenas solicitações onde o usuário é requester ou target
        query = query.or(`requester_id.eq.${user.id},target_id.eq.${user.id}`);
      } else if (filterStatus === 'supervisor') {
        // Mostrar solicitações aguardando aprovação do supervisor (pré-aprovadas pelo agente)
        query = query.eq('status', 'pending').eq('target_approved', true);
      } else if (filterStatus === 'agent') {
        // Mostrar solicitações aguardando pré-aprovação do agente target
        query = query.eq('status', 'pending').eq('target_approved', false).eq('target_id', user.id);
      } else if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data: swapRequests, error } = await query;

      if (error) throw error;

      if (!swapRequests || swapRequests.length === 0) {
        setRequests([]);
        setIsLoading(false);
        return;
      }

      // Os dados já vêm completos com os JOINs
      const completeRequests: SwapRequest[] = swapRequests.map((req: any) => ({
        id: req.id,
        created_at: req.created_at,
        reason: req.reason,
        status: req.status,
        payment_scheduled_for: req.payment_scheduled_for,
        swap_date: req.swap_date,
        target_approved: req.target_approved,
        target_approved_at: req.target_approved_at,
        requester: req.requester || { id: req.requester_id, name: 'Usuário desconhecido' },
        target: req.target || { id: req.target_id, name: 'Usuário desconhecido' },
        requester_schedule: req.requester_schedule,
        target_schedule: req.target_schedule,
      }));

      setRequests(completeRequests);
    } catch (error) {
      console.error('Error fetching swap requests:', error);
      toast.error('Erro ao carregar solicitações');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchSwapCredits();
  }, [filterStatus]);

  // Setup realtime subscription for shift swap requests
  useEffect(() => {
    const channel = supabase
      .channel('shift-swap-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shift_swap_requests'
        },
        (payload) => {
          console.log('Nova solicitação criada:', payload);
          toast.success('Nova solicitação de troca criada!');
          fetchRequests();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shift_swap_requests'
        },
        (payload) => {
          const newStatus = (payload.new as any).status;
          const oldStatus = (payload.old as any).status;
          const newTargetApproved = (payload.new as any).target_approved;
          const oldTargetApproved = (payload.old as any).target_approved;
          
          if (newStatus !== oldStatus) {
            console.log('Status da solicitação atualizado:', payload);
            
            if (newStatus === 'approved') {
              toast.success('Solicitação aprovada!');
            } else if (newStatus === 'rejected') {
              toast.error('Solicitação recusada');
            } else if (newStatus === 'completed') {
              toast.success('Solicitação concluída!');
            } else if (newStatus === 'cancelled') {
              toast.info('Solicitação cancelada');
            }
            
            fetchRequests();
          } else if (newTargetApproved !== oldTargetApproved && newTargetApproved === true) {
            console.log('Solicitação pré-aprovada pelo agente:', payload);
            toast.info('Solicitação pré-aprovada pelo agente destinatário');
            fetchRequests();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filterStatus]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Solicitações de Troca</h2>
        <div className="flex items-center gap-3">
          <Select value={filterAgent} onValueChange={setFilterAgent}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por agente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os agentes</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-cyan-500 hover:bg-cyan-600" onClick={() => setShowNewDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Solicitação
          </Button>
        </div>
      </div>

      <NewSwapRequestDialog 
        open={showNewDialog} 
        onOpenChange={setShowNewDialog}
        onSuccess={fetchRequests}
      />

      <Tabs
        value={filterStatus} 
        onValueChange={(value) => setFilterStatus(value as typeof filterStatus)} 
        className="w-full"
      >
        <TabsList className={isAgentView ? "grid w-full grid-cols-4 max-w-2xl" : "grid w-full grid-cols-7 max-w-4xl"}>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="approved">Aprovadas</TabsTrigger>
          <TabsTrigger value="rejected">Recusadas</TabsTrigger>
          <TabsTrigger value="mine">Minhas Solicitações</TabsTrigger>
          {!isAgentView && (
            <>
              <TabsTrigger value="supervisor">Supervisor</TabsTrigger>
              <TabsTrigger value="agent">Agente</TabsTrigger>
              <TabsTrigger value="all">Todas</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Carregando...
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma solicitação encontrada
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {requests.map((request) => (
                <SwapRequestCard 
                  key={request.id} 
                  request={request} 
                  onUpdate={fetchRequests}
                  currentUserId={currentUserId}
                  swapCredits={swapCredits}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Carregando...
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma solicitação encontrada
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {requests.map((request) => (
                <SwapRequestCard 
                  key={request.id} 
                  request={request} 
                  onUpdate={fetchRequests}
                  currentUserId={currentUserId}
                  swapCredits={swapCredits}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Carregando...
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma solicitação encontrada
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {requests.map((request) => (
                <SwapRequestCard 
                  key={request.id} 
                  request={request} 
                  onUpdate={fetchRequests}
                  currentUserId={currentUserId}
                  swapCredits={swapCredits}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Carregando...
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma solicitação encontrada
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {requests.map((request) => (
                <SwapRequestCard 
                  key={request.id} 
                  request={request} 
                  onUpdate={fetchRequests}
                  currentUserId={currentUserId}
                  swapCredits={swapCredits}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="mine" className="mt-6">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Carregando...
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Você não possui solicitações
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {requests.map((request) => (
                <SwapRequestCard 
                  key={request.id} 
                  request={request} 
                  onUpdate={fetchRequests}
                  currentUserId={currentUserId}
                  swapCredits={swapCredits}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="supervisor" className="mt-6">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Carregando...
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma solicitação encontrada
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {requests.map((request) => (
                <SwapRequestCard 
                  key={request.id} 
                  request={request} 
                  onUpdate={fetchRequests}
                  currentUserId={currentUserId}
                  swapCredits={swapCredits}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="agent" className="mt-6">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Carregando...
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma solicitação encontrada
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {requests.map((request) => (
                <SwapRequestCard 
                  key={request.id} 
                  request={request} 
                  onUpdate={fetchRequests}
                  currentUserId={currentUserId}
                  swapCredits={swapCredits}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
