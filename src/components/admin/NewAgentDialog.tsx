import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const daysOfWeek = [
  { key: 'dom', label: 'Dom' },
  { key: 'seg', label: 'Seg' },
  { key: 'ter', label: 'Ter' },
  { key: 'qua', label: 'Qua' },
  { key: 'qui', label: 'Qui' },
  { key: 'sex', label: 'Sex' },
  { key: 'sab', label: 'Sáb' },
];

type DaySchedule = {
  workStart: string;
  workEnd: string;
  breakStart: string;
  breakEnd: string;
};

type WeekSchedule = {
  [key: string]: DaySchedule;
};

const agentSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(100),
  email: z.string().email('Email inválido').max(255),
});

type AgentFormData = z.infer<typeof agentSchema>;

interface NewAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const NewAgentDialog = ({ open, onOpenChange, onSuccess }: NewAgentDialogProps) => {
  const [selectedDay, setSelectedDay] = useState('dom');
  const [schedules, setSchedules] = useState<WeekSchedule>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
  });

  const handleScheduleChange = (field: keyof DaySchedule, value: string) => {
    setSchedules((prev) => ({
      ...prev,
      [selectedDay]: {
        ...prev[selectedDay],
        [field]: value,
      },
    }));
  };

  const getCurrentSchedule = (): DaySchedule => {
    return schedules[selectedDay] || {
      workStart: '',
      workEnd: '',
      breakStart: '',
      breakEnd: '',
    };
  };

  const onSubmit = async (data: AgentFormData) => {
    setIsSubmitting(true);
    try {
      // Criar o perfil do agente primeiro (isso seria implementado via Supabase Auth + trigger)
      // Por enquanto, vamos assumir que o usuário já existe e apenas salvar os horários
      
      // Nota: Para criar um novo usuário você precisaria usar supabase.auth.admin.createUser
      // ou ter um fluxo de convite/signup separado
      
      console.log('Agent data:', { ...data, schedules });
      toast.info('Funcionalidade de criação de agente em desenvolvimento. Configure os horários após criar o usuário no sistema de autenticação.');
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error creating agent:', error);
      toast.error('Erro ao criar agente');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentSchedule = getCurrentSchedule();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Agente</DialogTitle>
          <DialogDescription>
            Preencha os dados do agente e configure sua escala de trabalho semanal
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Digite o nome do agente"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* E-mail */}
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="agente@yooga.com.br"
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Escala de Trabalho */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Escala de Trabalho</h3>

            {/* Days selector */}
            <div className="flex gap-2">
              {daysOfWeek.map((day) => (
                <Button
                  key={day.key}
                  type="button"
                  variant={selectedDay === day.key ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setSelectedDay(day.key)}
                >
                  {day.label}
                </Button>
              ))}
            </div>

            {/* Schedule configuration */}
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Configurar Horários</h4>
                <span className="text-sm text-muted-foreground capitalize">
                  {daysOfWeek.find((d) => d.key === selectedDay)?.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Horário de Trabalho */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Horário de Trabalho</Label>
                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        type="time"
                        value={currentSchedule.workStart}
                        onChange={(e) => handleScheduleChange('workStart', e.target.value)}
                        className="pl-8"
                      />
                      <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                    <div className="text-center text-xs text-muted-foreground">até</div>
                    <div className="relative">
                      <Input
                        type="time"
                        value={currentSchedule.workEnd}
                        onChange={(e) => handleScheduleChange('workEnd', e.target.value)}
                        className="pl-8"
                      />
                      <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Intervalo */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Intervalo</Label>
                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        type="time"
                        value={currentSchedule.breakStart}
                        onChange={(e) => handleScheduleChange('breakStart', e.target.value)}
                        className="pl-8"
                      />
                      <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                    <div className="text-center text-xs text-muted-foreground">até</div>
                    <div className="relative">
                      <Input
                        type="time"
                        value={currentSchedule.breakEnd}
                        onChange={(e) => handleScheduleChange('breakEnd', e.target.value)}
                        className="pl-8"
                      />
                      <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule summary */}
            {Object.keys(schedules).length > 0 && (
              <div className="border rounded-lg p-3 bg-muted/30">
                <p className="text-xs font-medium mb-2">Horários configurados:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(schedules).map(([day, schedule]) => (
                    <div
                      key={day}
                      className="text-xs bg-background px-2 py-1 rounded border"
                    >
                      <span className="font-medium capitalize">
                        {daysOfWeek.find((d) => d.key === day)?.label}:
                      </span>{' '}
                      {schedule.workStart && schedule.workEnd
                        ? `${schedule.workStart}-${schedule.workEnd}`
                        : 'Não configurado'}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                setSchedules({});
                setSelectedDay('dom');
                onOpenChange(false);
              }}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-cyan-500 hover:bg-cyan-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
