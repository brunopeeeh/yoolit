import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { z } from 'zod';
import { Calendar, Clock, User } from 'lucide-react';
import { formatShiftType } from '@/lib/shiftUtils';

interface Shift {
  id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  shift_type: string;
}

interface Agent {
  id: string;
  name: string;
  shifts: Shift[];
}

const swapRequestSchema = z.object({
  requester_shift_id: z.string().min(1, 'Selecione seu turno'),
  target_id: z.string().min(1, 'Selecione o agente'),
  target_shift_id: z.string().min(1, 'Selecione o turno do agente'),
  reason: z.string().trim().min(10, 'Motivo deve ter pelo menos 10 caracteres').max(500, 'Motivo deve ter no máximo 500 caracteres'),
});

type SwapRequestForm = z.infer<typeof swapRequestSchema>;

export const NewSwapRequestDialog = ({ 
  open, 
  onOpenChange,
  onSuccess 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) => {
  const [myShifts, setMyShifts] = useState<Shift[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedMyShift, setSelectedMyShift] = useState<string>('');
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedTargetShift, setSelectedTargetShift] = useState<string>('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof SwapRequestForm, string>>>({});

  // Buscar meus turnos
  useEffect(() => {
    if (open) {
      fetchMyShifts();
      fetchAgents();
    }
  }, [open]);

  // Resetar campos quando o agente mudar
  useEffect(() => {
    setSelectedTargetShift('');
  }, [selectedAgent]);

  const fetchMyShifts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .rpc('list_future_shifts_for_swaps');

      if (error) throw error;
      
      const myShifts = (data || []).filter((shift: any) => shift.user_id === user.id);
      setMyShifts(myShifts);
    } catch (error) {
      console.error('Error fetching my shifts:', error);
      toast.error('Erro ao carregar seus turnos');
    }
  };

  const fetchAgents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar todos os agentes
      const { data: profiles, error: profilesError } = await supabase
        .rpc('list_agents_for_swaps');

      if (profilesError) throw profilesError;

      // Buscar turnos futuros
      const { data: shifts, error: shiftsError } = await supabase
        .rpc('list_future_shifts_for_swaps');

      if (shiftsError) throw shiftsError;

      // Combinar perfis com seus turnos (excluindo o usuário atual)
      const agentsWithShifts = (profiles || [])
        .filter((profile: any) => profile.id !== user.id)
        .map((profile: any) => ({
          id: profile.id,
          name: profile.name || 'Sem nome',
          shifts: (shifts || []).filter((shift: any) => shift.user_id === profile.id)
        }))
        .filter(agent => agent.shifts.length > 0);

      setAgents(agentsWithShifts);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast.error('Erro ao carregar agentes');
    }
  };

  const formatShiftDisplay = (shift: Shift) => {
    const date = format(new Date(shift.shift_date), "dd/MM/yyyy (EEE)", { locale: ptBR });
    const time = `${shift.start_time.substring(0, 5)} - ${shift.end_time.substring(0, 5)}`;
    const shiftType = formatShiftType(shift.shift_type as 'morning' | 'afternoon' | 'night');
    return `${date} • ${shiftType} • ${time}`;
  };

  const handleSubmit = async () => {
    try {
      // Validar formulário
      const formData: SwapRequestForm = {
        requester_shift_id: selectedMyShift,
        target_id: selectedAgent,
        target_shift_id: selectedTargetShift,
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

      // Criar solicitação
      const { error } = await supabase
        .from('shift_swap_requests')
        .insert({
          requester_id: user.id,
          requester_shift_id: selectedMyShift,
          target_id: selectedAgent,
          target_shift_id: selectedTargetShift,
          reason: reason.trim(),
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Solicitação criada com sucesso');
      
      // Resetar formulário
      setSelectedMyShift('');
      setSelectedAgent('');
      setSelectedTargetShift('');
      setReason('');
      
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error creating swap request:', error);
      toast.error('Erro ao criar solicitação');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedAgentData = agents.find(a => a.id === selectedAgent);

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
          {/* Meu turno */}
          <div className="space-y-2">
            <Label htmlFor="my-shift">
              <Calendar className="inline h-4 w-4 mr-2" />
              Seu Turno
            </Label>
            <Select value={selectedMyShift} onValueChange={setSelectedMyShift}>
              <SelectTrigger id="my-shift" className={errors.requester_shift_id ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecione seu turno" />
              </SelectTrigger>
              <SelectContent>
                {myShifts.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    Nenhum turno disponível
                  </div>
                ) : (
                  myShifts.map((shift) => (
                    <SelectItem key={shift.id} value={shift.id}>
                      {formatShiftDisplay(shift)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.requester_shift_id && (
              <p className="text-sm text-destructive">{errors.requester_shift_id}</p>
            )}
          </div>

          {/* Selecionar agente */}
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
                    Nenhum agente com turnos disponíveis
                  </div>
                ) : (
                  agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name} ({agent.shifts.length} turnos)
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.target_id && (
              <p className="text-sm text-destructive">{errors.target_id}</p>
            )}
          </div>

          {/* Turno do agente */}
          {selectedAgent && (
            <div className="space-y-2">
              <Label htmlFor="target-shift">
                <Clock className="inline h-4 w-4 mr-2" />
                Turno do Agente
              </Label>
              <Select value={selectedTargetShift} onValueChange={setSelectedTargetShift}>
                <SelectTrigger id="target-shift" className={errors.target_shift_id ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Selecione o turno do agente" />
                </SelectTrigger>
                <SelectContent>
                  {selectedAgentData?.shifts.map((shift) => (
                    <SelectItem key={shift.id} value={shift.id}>
                      {formatShiftDisplay(shift)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.target_shift_id && (
                <p className="text-sm text-destructive">{errors.target_shift_id}</p>
              )}
            </div>
          )}

          {/* Motivo */}
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
            disabled={isLoading || !selectedMyShift || !selectedAgent || !selectedTargetShift || !reason.trim()}
            className="bg-cyan-500 hover:bg-cyan-600"
          >
            {isLoading ? 'Criando...' : 'Criar Solicitação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
