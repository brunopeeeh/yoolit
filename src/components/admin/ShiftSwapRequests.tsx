import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, Plus, X, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SwapRequest {
  id: string;
  created_at: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  payment_scheduled_for: string | null;
  requester: {
    id: string;
    name: string;
  };
  target: {
    id: string;
    name: string;
  };
  requester_shift: {
    shift_date: string;
    start_time: string;
    end_time: string;
  };
  target_shift: {
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
  pending: { label: 'Pendente', className: 'bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20' },
  approved: { label: 'Aprovada', className: 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' },
  rejected: { label: 'Recusada', className: 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20' },
  cancelled: { label: 'Cancelada', className: 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20' },
  completed: { label: 'Concluída', className: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20' },
};

const SwapRequestCard = ({ request, onUpdate }: { request: SwapRequest; onUpdate: () => void }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleApprove = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('shift_swap_requests')
        .update({ 
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', request.id);

      if (error) throw error;
      toast.success('Solicitação aprovada');
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

  const statusConfig = statusBadgeConfig[request.status];

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
              <p className="text-sm text-muted-foreground">
                {formatTime(request.requester_shift.start_time)} - {formatTime(request.requester_shift.end_time)}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {getDayOfWeek(request.requester_shift.shift_date)}
              </p>
            </div>
          </div>

          <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />

          <div className="flex-1 flex items-center gap-3 justify-end">
            <div className="flex-1 text-right">
              <p className="font-medium text-sm">{request.target.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatTime(request.target_shift.start_time)} - {formatTime(request.target_shift.end_time)}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {getDayOfWeek(request.target_shift.shift_date)}
              </p>
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

        {request.status === 'pending' && (
          <div className="flex items-center gap-2">
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
              onClick={handleApprove}
              disabled={isUpdating}
            >
              <Check className="h-4 w-4 mr-2" />
              Aprovar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const ShiftSwapRequests = () => {
  const [requests, setRequests] = useState<SwapRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterAgent, setFilterAgent] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [useMockData] = useState(true); // Para usar dados mockados

  const mockRequests: SwapRequest[] = [
    {
      id: '1',
      created_at: '2025-05-15T10:00:00',
      reason: 'Consulta médica',
      status: 'pending',
      payment_scheduled_for: '2025-05-23T20:00:00',
      requester: { id: '1', name: 'Roberto Dias' },
      target: { id: '2', name: 'Camila Rocha' },
      requester_shift: { shift_date: '2025-05-15', start_time: '14:00', end_time: '20:00' },
      target_shift: { shift_date: '2025-05-15', start_time: '20:00', end_time: '02:00' }
    },
    {
      id: '2',
      created_at: '2025-05-14T08:30:00',
      reason: 'Compromisso familiar',
      status: 'pending',
      payment_scheduled_for: null,
      requester: { id: '3', name: 'Juliana Lima' },
      target: { id: '4', name: 'João Pereira' },
      requester_shift: { shift_date: '2025-05-14', start_time: '14:00', end_time: '20:00' },
      target_shift: { shift_date: '2025-05-14', start_time: '08:00', end_time: '14:00' }
    },
    {
      id: '3',
      created_at: '2025-05-13T15:20:00',
      reason: 'Aula na faculdade',
      status: 'approved',
      payment_scheduled_for: '2025-05-20T14:00:00',
      requester: { id: '5', name: 'Lucas Duarte' },
      target: { id: '6', name: 'Mariana Silva' },
      requester_shift: { shift_date: '2025-05-13', start_time: '08:00', end_time: '14:00' },
      target_shift: { shift_date: '2025-05-13', start_time: '14:00', end_time: '20:00' }
    },
    {
      id: '4',
      created_at: '2025-05-12T11:00:00',
      reason: 'Exame de rotina',
      status: 'rejected',
      payment_scheduled_for: null,
      requester: { id: '7', name: 'Bruno Oliveira' },
      target: { id: '8', name: 'Andrea Guarani' },
      requester_shift: { shift_date: '2025-05-12', start_time: '20:00', end_time: '02:00' },
      target_shift: { shift_date: '2025-05-12', start_time: '14:00', end_time: '20:00' }
    }
  ];

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      
      // Se usar dados mockados, filtrar localmente
      if (useMockData) {
        let filtered = mockRequests;
        if (filterStatus !== 'all') {
          filtered = filtered.filter(r => r.status === filterStatus);
        }
        setRequests(filtered);
        setIsLoading(false);
        return;
      }

      let query = supabase
        .from('shift_swap_requests')
        .select(`
          id,
          created_at,
          reason,
          status,
          payment_scheduled_for,
          requester:requester_id(id, name),
          target:target_id(id, name),
          requester_shift:requester_shift_id(shift_date, start_time, end_time),
          target_shift:target_shift_id(shift_date, start_time, end_time)
        `)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRequests(data as any || []);
    } catch (error) {
      console.error('Error fetching swap requests:', error);
      toast.error('Erro ao carregar solicitações');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
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
          <Button className="bg-cyan-500 hover:bg-cyan-600">
            <Plus className="h-4 w-4 mr-2" />
            Nova Solicitação
          </Button>
        </div>
      </div>

      <Tabs 
        value={filterStatus} 
        onValueChange={(value) => setFilterStatus(value as typeof filterStatus)} 
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="approved">Aprovadas</TabsTrigger>
          <TabsTrigger value="rejected">Recusadas</TabsTrigger>
          <TabsTrigger value="all">Todas</TabsTrigger>
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
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
