import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { z } from 'zod';
import { Calendar, Clock, User, CalendarIcon, Wallet } from 'lucide-react';
import { getDayOfWeekName } from '@/lib/shiftUtils';
import { cn } from '@/lib/utils';

interface AgentSchedule {
  id: string;
  user_id: string;
  day_of_week: string;
  work_start_time: string;
  work_end_time: string;
  break_start_time: string | null;
  break_end_time: string | null;
}

interface Agent {
  id: string;
  name: string;
}

const swapRequestSchema = z.object({
  swap_date: z.date({
    required_error: 'Selecione uma data'
  }),
  target_id: z.string().min(1, 'Selecione o agente'),
  requester_schedule_id: z.string().min(1, 'Você não possui horário configurado para este dia'),
  target_schedule_id: z.string().min(1, 'O agente não possui horário configurado para este dia'),
  reason: z.string().trim().min(10, 'Motivo deve ter pelo menos 10 caracteres').max(500, 'Motivo deve ter no máximo 500 caracteres'),
});

type SwapRequestForm = z.infer<typeof swapRequestSchema>;

interface SwapCredit {
  id: string;
  debtor_id: string;
  debtor?: { name: string };
  created_at: string;
}

export const NewSwapRequestDialog = ({ 
  open, 
  onOpenChange,
  onSuccess 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentSchedules, setAgentSchedules] = useState<AgentSchedule[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [myScheduleForDate, setMyScheduleForDate] = useState<AgentSchedule | null>(null);
  const [targetScheduleForDate, setTargetScheduleForDate] = useState<AgentSchedule | null>(null);
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof SwapRequestForm, string>>>({});
  const [swapCredits, setSwapCredits] = useState<SwapCredit[]>([]);
  const [useCredit, setUseCredit] = useState(false);

  // Buscar dados iniciais
  useEffect(() => {
    if (open) {
      fetchAgents();
      fetchAgentSchedules();
      fetchSwapCredits();
    }
  }, [open]);

  // Atualizar horários quando data ou agente mudarem
  useEffect(() => {
    const updateSchedules = async () => {
      if (selectedDate && agentSchedules.length > 0) {
        const dayOfWeek = getDayOfWeekCode(selectedDate);
        
        // Buscar schedule do usuário atual
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const mySchedule = agentSchedules.find(
            s => s.user_id === user.id && s.day_of_week === dayOfWeek
          );
          setMyScheduleForDate(mySchedule || null);
        }
        
        // Buscar schedule do agente selecionado
        if (selectedAgent) {
          const targetSchedule = agentSchedules.find(
            s => s.user_id === selectedAgent && s.day_of_week === dayOfWeek
          );
          setTargetScheduleForDate(targetSchedule || null);
        } else {
          setTargetScheduleForDate(null);
        }
      } else {
        setMyScheduleForDate(null);
        setTargetScheduleForDate(null);
      }
    };
    
    updateSchedules();
  }, [selectedDate, selectedAgent, agentSchedules]);

  const getDayOfWeekCode = (date: Date): string => {
    const dayNum = date.getDay(); // 0 = domingo, 6 = sábado
    const days = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
    return days[dayNum];
  };

  const fetchAgents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profiles, error } = await supabase
        .rpc('list_agents_for_swaps');

      if (error) throw error;

      const agentsList = (profiles || [])
        .filter((profile: any) => profile.id !== user.id)
        .map((profile: any) => ({
          id: profile.id,
          name: profile.name || 'Sem nome',
        }));

      setAgents(agentsList);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast.error('Erro ao carregar agentes');
    }
  };

  const fetchAgentSchedules = async () => {
    try {
      const { data: schedules, error } = await supabase
        .rpc('list_agent_schedules_for_swaps');
      
      if (error) throw error;
      setAgentSchedules(schedules || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error('Erro ao carregar horários dos agentes');
    }
  };

  const fetchSwapCredits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: credits, error } = await supabase
        .from('swap_credits')
        .select(`
          id,
          debtor_id,
          created_at,
          debtor:profiles!swap_credits_debtor_id_fkey(name)
        `)
        .eq('creditor_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSwapCredits(credits || []);
    } catch (error) {
      console.error('Error fetching swap credits:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!selectedDate || !myScheduleForDate || !targetScheduleForDate) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      const formData = {
        swap_date: selectedDate,
        target_id: selectedAgent,
        requester_schedule_id: myScheduleForDate.id,
        target_schedule_id: targetScheduleForDate.id,
        reason: reason,
      };

      const result = swapRequestSchema.safeParse(formData);
      
      if (!result.success) {
        const fieldErrors: Partial<Record<keyof SwapRequestForm, string>> = {};
        result.error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof SwapRequestForm] = err.message;
          }
        });
        setErrors(fieldErrors);
        toast.error('Preencha todos os campos corretamente');
        return;
      }

      setErrors({});
      setIsLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Se usar crédito, marca como pré-aprovado
      const insertData: any = {
        requester_id: user.id,
        target_id: selectedAgent,
        swap_date: format(selectedDate, 'yyyy-MM-dd'),
        requester_schedule_id: myScheduleForDate.id,
        target_schedule_id: targetScheduleForDate.id,
        reason: reason.trim(),
        status: 'pending'
      };

      if (useCredit) {
        insertData.target_approved = true;
        insertData.target_approved_at = new Date().toISOString();
      }

      const { data: newRequest, error } = await supabase
        .from('shift_swap_requests')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Se usar crédito, atualizar o crédito para 'redeemed'
      if (useCredit && swapCredits.length > 0) {
        const creditToUse = swapCredits.find(c => c.debtor_id === selectedAgent);
        if (creditToUse) {
          const { error: creditError } = await supabase
            .from('swap_credits')
            .update({ 
              status: 'redeemed',
              redeemed_at: new Date().toISOString()
            })
            .eq('id', creditToUse.id);

          if (creditError) {
            console.error('Error updating credit:', creditError);
          }
        }
      }

      toast.success(useCredit 
        ? 'Solicitação criada usando ponto de troca! Aguardando aprovação do supervisor.' 
        : 'Solicitação criada com sucesso'
      );
      
      // Resetar formulário
      setSelectedDate(undefined);
      setSelectedAgent('');
      setReason('');
      setMyScheduleForDate(null);
      setTargetScheduleForDate(null);
      setUseCredit(false);
      
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error creating swap request:', error);
      toast.error('Erro ao criar solicitação');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Solicitação de Troca</DialogTitle>
          <DialogDescription>
            Selecione seu turno e o turno do agente com quem deseja trocar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Aviso de créditos disponíveis */}
          {swapCredits.length > 0 && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-3">
              <div className="flex items-start gap-3">
                <Wallet className="h-5 w-5 text-emerald-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-emerald-900">
                    Você tem {swapCredits.length} ponto{swapCredits.length > 1 ? 's' : ''} de troca disponível{swapCredits.length > 1 ? 'eis' : ''}!
                  </h4>
                  <p className="text-sm text-emerald-700 mt-1">
                    {swapCredits.map(credit => credit.debtor?.name).join(', ')} deve{swapCredits.length === 1 ? '' : 'm'} uma troca para você.
                  </p>
                  {selectedAgent && swapCredits.some(c => c.debtor_id === selectedAgent) && (
                    <div className="mt-3 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="use-credit"
                        checked={useCredit}
                        onChange={(e) => setUseCredit(e.target.checked)}
                        className="h-4 w-4 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500"
                      />
                      <label htmlFor="use-credit" className="text-sm font-medium text-emerald-900 cursor-pointer">
                        Usar ponto de troca com {agents.find(a => a.id === selectedAgent)?.name} (pré-aprovação automática)
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Data - PRIMEIRO */}
          <div className="space-y-2">
            <Label htmlFor="swap-date">
              <CalendarIcon className="inline h-4 w-4 mr-2" />
              Data da Troca
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground",
                    errors.swap_date && "border-destructive"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "PPP", { locale: ptBR })
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            {errors.swap_date && (
              <p className="text-sm text-destructive">{errors.swap_date}</p>
            )}
          </div>

          {/* Agente - SEGUNDO */}
          <div className="space-y-2">
            <Label htmlFor="target-agent">
              <User className="inline h-4 w-4 mr-2" />
              Agente
            </Label>
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger id="target-agent" className={errors.target_id ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecione o agente" />
              </SelectTrigger>
              <SelectContent>
                {agents.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    Nenhum agente disponível
                  </div>
                ) : (
                  agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.target_id && (
              <p className="text-sm text-destructive">{errors.target_id}</p>
            )}
          </div>

          {/* Seu horário - TERCEIRO (automático) */}
          {selectedDate && myScheduleForDate && (
            <div className="space-y-2">
              <Label>
                <Clock className="inline h-4 w-4 mr-2" />
                Seu Horário ({getDayOfWeekName(myScheduleForDate.day_of_week)})
              </Label>
              <div className="p-3 bg-muted rounded-md text-sm">
                <div className="font-medium">
                  {myScheduleForDate.work_start_time.substring(0, 5)} - {myScheduleForDate.work_end_time.substring(0, 5)}
                </div>
                {myScheduleForDate.break_start_time && myScheduleForDate.break_end_time && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Intervalo: {myScheduleForDate.break_start_time.substring(0, 5)} - {myScheduleForDate.break_end_time.substring(0, 5)}
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedDate && !myScheduleForDate && (
            <div className="p-4 text-sm text-amber-600 bg-amber-50 rounded-md border border-amber-200">
              ⚠️ Você não possui horário configurado para {selectedDate && getDayOfWeekName(getDayOfWeekCode(selectedDate))}
            </div>
          )}

          {/* Horário do agente - QUARTO (automático) */}
          {selectedDate && selectedAgent && targetScheduleForDate && (
            <div className="space-y-2">
              <Label>
                <Clock className="inline h-4 w-4 mr-2" />
                Horário do Agente ({getDayOfWeekName(targetScheduleForDate.day_of_week)})
              </Label>
              <div className="p-3 bg-muted rounded-md text-sm">
                <div className="font-medium">
                  {targetScheduleForDate.work_start_time.substring(0, 5)} - {targetScheduleForDate.work_end_time.substring(0, 5)}
                </div>
                {targetScheduleForDate.break_start_time && targetScheduleForDate.break_end_time && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Intervalo: {targetScheduleForDate.break_start_time.substring(0, 5)} - {targetScheduleForDate.break_end_time.substring(0, 5)}
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedDate && selectedAgent && !targetScheduleForDate && (
            <div className="p-4 text-sm text-amber-600 bg-amber-50 rounded-md border border-amber-200">
              ⚠️ O agente selecionado não possui horário configurado para {selectedDate && getDayOfWeekName(getDayOfWeekCode(selectedDate))}
            </div>
          )}

          {/* Motivo - QUINTO */}
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo da Troca</Label>
            <Textarea
              id="reason"
              placeholder="Explique o motivo da solicitação (mínimo 10 caracteres)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={errors.reason ? 'border-destructive' : ''}
              rows={4}
              maxLength={500}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              {errors.reason ? (
                <span className="text-destructive">{errors.reason}</span>
              ) : (
                <span>Mínimo 10 caracteres</span>
              )}
              <span>{reason.length}/500</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={
              isLoading || 
              !selectedDate ||
              !selectedAgent || 
              !myScheduleForDate ||
              !targetScheduleForDate ||
              !reason.trim()
            }
            className="bg-cyan-500 hover:bg-cyan-600"
          >
            {isLoading ? 'Criando...' : 'Criar Solicitação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
