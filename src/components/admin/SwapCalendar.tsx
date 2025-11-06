import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, Clock, User } from 'lucide-react';

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
  const [swaps, setSwaps] = useState<SwapRequest[]>([]);
  const [selectedDaySwaps, setSelectedDaySwaps] = useState<SwapRequest[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchSwaps();
  }, []);

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
    hasSwaps: 'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full',
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Calendário de Trocas
          </CardTitle>
          <CardDescription>
            Clique nos dias marcados para ver os detalhes das trocas
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDayClick}
            onDayClick={handleDayClick}
            locale={ptBR}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Trocas de {date && format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedDaySwaps.map((swap) => (
              <Card key={swap.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Troca #{swap.id.substring(0, 8)}
                    </CardTitle>
                    {getStatusBadge(swap.status)}
                  </div>
                  <CardDescription>{swap.reason}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <User className="h-4 w-4" />
                        Solicitante
                      </div>
                      <p className="text-sm text-muted-foreground">{swap.requester.name}</p>
                      {swap.requester_shift && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {swap.requester_shift.start_time} - {swap.requester_shift.end_time}
                          <Badge variant="outline" className="ml-2">
                            {swap.requester_shift.shift_type}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <User className="h-4 w-4" />
                        Alvo
                      </div>
                      <p className="text-sm text-muted-foreground">{swap.target.name}</p>
                      {swap.target_shift && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {swap.target_shift.start_time} - {swap.target_shift.end_time}
                          <Badge variant="outline" className="ml-2">
                            {swap.target_shift.shift_type}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="text-xs text-muted-foreground">
                    Criada em: {format(new Date(swap.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
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
