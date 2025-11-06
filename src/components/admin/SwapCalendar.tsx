import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format, isSameDay, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, Clock, User, ArrowLeftRight, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';

interface SwapRequest {
  id: string;
  swap_date: string;
  status: string;
  reason: string;
  created_at: string;
  requester: {
    id: string;
    name: string;
  };
  target: {
    id: string;
    name: string;
  };
  requester_shift?: {
    start_time: string;
    end_time: string;
    shift_type: string;
  };
  target_shift?: {
    start_time: string;
    end_time: string;
    shift_type: string;
  };
}

export const SwapCalendar = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [month, setMonth] = useState<Date>(new Date());
  const [swaps, setSwaps] = useState<SwapRequest[]>([]);
  const [selectedDaySwaps, setSelectedDaySwaps] = useState<SwapRequest[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchSwaps();
  }, []);

  const monthStats = {
    total: swaps.filter(s => {
      const swapDate = new Date(s.swap_date);
      return swapDate >= startOfMonth(month) && swapDate <= endOfMonth(month);
    }).length,
    pending: swaps.filter(s => {
      const swapDate = new Date(s.swap_date);
      return s.status === 'pending' && swapDate >= startOfMonth(month) && swapDate <= endOfMonth(month);
    }).length,
    approved: swaps.filter(s => {
      const swapDate = new Date(s.swap_date);
      return s.status === 'approved' && swapDate >= startOfMonth(month) && swapDate <= endOfMonth(month);
    }).length,
  };

  const fetchSwaps = async () => {
    const { data, error } = await supabase
      .from('shift_swap_requests')
      .select(`
        id,
        swap_date,
        status,
        reason,
        created_at,
        requester:requester_id (id, name),
        target:target_id (id, name),
        requester_shift:requester_shift_id (start_time, end_time, shift_type),
        target_shift:target_shift_id (start_time, end_time, shift_type)
      `)
      .in('status', ['approved', 'pending'])
      .not('swap_date', 'is', null)
      .order('swap_date', { ascending: true });

    if (error) {
      console.error('Error fetching swaps:', error);
      return;
    }

    setSwaps(data as any || []);
  };

  const getSwapsForDate = (date: Date) => {
    return swaps.filter(swap => {
      const swapDate = new Date(swap.swap_date);
      return isSameDay(swapDate, date);
    });
  };

  const handleDayClick = (day: Date | undefined) => {
    if (!day) return;
    
    const daySwaps = getSwapsForDate(day);
    if (daySwaps.length > 0) {
      setSelectedDaySwaps(daySwaps);
      setShowModal(true);
    }
    setDate(day);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'Pendente', variant: 'outline' },
      approved: { label: 'Aprovada', variant: 'default' },
      scheduled: { label: 'Agendada', variant: 'secondary' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const modifiers = {
    hasSwaps: (day: Date) => getSwapsForDate(day).length > 0,
  };

  const modifiersClassNames = {
    hasSwaps: 'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:bg-primary after:rounded-full font-semibold',
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Calendário de Trocas de Turno
              </CardTitle>
              <CardDescription>
                Visualização completa das trocas agendadas - Clique nos dias marcados para detalhes
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Estatísticas do Mês */}
            <div className="lg:col-span-1 space-y-4">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Estatísticas do Mês
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Total de Trocas</span>
                    </div>
                    <Badge variant="secondary" className="font-semibold">
                      {monthStats.total}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">Pendentes</span>
                    </div>
                    <Badge variant="outline" className="font-semibold">
                      {monthStats.pending}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Aprovadas</span>
                    </div>
                    <Badge variant="default" className="font-semibold">
                      {monthStats.approved}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Legenda */}
              <div className="space-y-3 pt-4 border-t">
                <h3 className="text-sm font-semibold">Legenda</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <span className="text-muted-foreground">Dias com trocas agendadas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Clique para ver detalhes</span>
                  </div>
                </div>
              </div>

              {/* Próximas Trocas */}
              <div className="space-y-3 pt-4 border-t">
                <h3 className="text-sm font-semibold">Próximas Trocas</h3>
                <div className="space-y-2">
                  {swaps
                    .filter(s => new Date(s.swap_date) >= new Date())
                    .slice(0, 3)
                    .map(swap => (
                      <div key={swap.id} className="p-2 rounded-lg bg-muted/30 text-xs">
                        <div className="font-medium">{format(new Date(swap.swap_date), 'dd/MM/yyyy')}</div>
                        <div className="text-muted-foreground truncate">
                          {swap.requester.name} ↔ {swap.target.name}
                        </div>
                      </div>
                    ))}
                  {swaps.filter(s => new Date(s.swap_date) >= new Date()).length === 0 && (
                    <p className="text-xs text-muted-foreground">Nenhuma troca agendada</p>
                  )}
                </div>
              </div>
            </div>

            {/* Calendário */}
            <div className="lg:col-span-2 flex justify-center items-start w-full">
              <Calendar
                mode="single"
                selected={date}
                month={month}
                onMonthChange={setMonth}
                onSelect={handleDayClick}
                onDayClick={handleDayClick}
                locale={ptBR}
                modifiers={modifiers}
                modifiersClassNames={modifiersClassNames}
                className="rounded-md border p-6 w-full max-w-full"
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
                  month: "space-y-4 w-full",
                  table: "w-full border-collapse",
                  head_row: "flex w-full",
                  head_cell: "text-muted-foreground rounded-md flex-1 font-normal text-sm",
                  row: "flex w-full mt-2",
                  cell: "flex-1 aspect-square text-center text-sm p-0.5 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                  day: "h-full w-full p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md",
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <CalendarDays className="h-6 w-6" />
              Detalhes das Trocas - {date && format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
              <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total de trocas neste dia</p>
                <p className="text-2xl font-bold">{selectedDaySwaps.length}</p>
              </div>
            </div>

            {selectedDaySwaps.map((swap, index) => (
              <Card key={swap.id} className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span className="text-muted-foreground">#{index + 1}</span>
                        Troca {swap.id.substring(0, 8)}
                      </CardTitle>
                      <CardDescription className="text-sm">{swap.reason}</CardDescription>
                    </div>
                    {getStatusBadge(swap.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Cabeçalho da Troca */}
                  <div className="flex items-center justify-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <ArrowLeftRight className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Troca de Turno Entre Agentes
                    </span>
                  </div>

                  {/* Detalhes dos Agentes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Solicitante */}
                    <div className="space-y-3 p-4 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/50">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">Solicitante</span>
                      </div>
                      <div className="space-y-2">
                        <p className="font-medium text-base">{swap.requester.name}</p>
                        {swap.requester_shift ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="font-mono">
                                {swap.requester_shift.start_time} - {swap.requester_shift.end_time}
                              </span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {swap.requester_shift.shift_type}
                            </Badge>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">Turno não especificado</p>
                        )}
                      </div>
                    </div>

                    {/* Alvo */}
                    <div className="space-y-3 p-4 rounded-lg bg-green-50/50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/50">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-semibold text-green-900 dark:text-green-100">Alvo da Troca</span>
                      </div>
                      <div className="space-y-2">
                        <p className="font-medium text-base">{swap.target.name}</p>
                        {swap.target_shift ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="font-mono">
                                {swap.target_shift.start_time} - {swap.target_shift.end_time}
                              </span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {swap.target_shift.shift_type}
                            </Badge>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">Turno não especificado</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Informações Adicionais */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Data da Solicitação</p>
                      <p className="font-medium">
                        {format(new Date(swap.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">ID da Troca</p>
                      <p className="font-mono font-medium">{swap.id.substring(0, 13)}...</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
