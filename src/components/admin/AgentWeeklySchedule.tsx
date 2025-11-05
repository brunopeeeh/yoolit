import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getDayOfWeekName } from '@/lib/shiftUtils';
import { validateScheduleTimes, type DaySchedule } from '@/lib/validateScheduleTimes';
import { TimeInput } from './TimeInput';
import { Calendar, Loader2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Agent {
  id: string;
  name: string;
}

const DEFAULT_WEEK: DaySchedule[] = [
  { day_of_week: 'seg', enabled: false, work_start_time: '08:00', work_end_time: '17:00', break_start_time: '12:00', break_end_time: '13:00' },
  { day_of_week: 'ter', enabled: false, work_start_time: '08:00', work_end_time: '17:00', break_start_time: '12:00', break_end_time: '13:00' },
  { day_of_week: 'qua', enabled: false, work_start_time: '08:00', work_end_time: '17:00', break_start_time: '12:00', break_end_time: '13:00' },
  { day_of_week: 'qui', enabled: false, work_start_time: '08:00', work_end_time: '17:00', break_start_time: '12:00', break_end_time: '13:00' },
  { day_of_week: 'sex', enabled: false, work_start_time: '08:00', work_end_time: '17:00', break_start_time: '12:00', break_end_time: '13:00' },
  { day_of_week: 'sab', enabled: false, work_start_time: '08:00', work_end_time: '17:00', break_start_time: '12:00', break_end_time: '13:00' },
  { day_of_week: 'dom', enabled: false, work_start_time: '08:00', work_end_time: '17:00', break_start_time: '12:00', break_end_time: '13:00' },
];

export const AgentWeeklySchedule = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>(DEFAULT_WEEK);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    if (selectedAgentId) {
      fetchAgentSchedule(selectedAgentId);
    }
  }, [selectedAgentId]);

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast.error('Erro ao carregar agentes');
    }
  };

  const fetchAgentSchedule = async (userId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('agent_schedules')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;

      // Merge existing schedules with default week
      const updatedSchedule = DEFAULT_WEEK.map(defaultDay => {
        const existingSchedule = data?.find(s => s.day_of_week === defaultDay.day_of_week);
        if (existingSchedule) {
          return {
            day_of_week: defaultDay.day_of_week,
            enabled: true,
            work_start_time: existingSchedule.work_start_time || '08:00',
            work_end_time: existingSchedule.work_end_time || '17:00',
            break_start_time: existingSchedule.break_start_time || null,
            break_end_time: existingSchedule.break_end_time || null,
            schedule_id: existingSchedule.id,
          };
        }
        return defaultDay;
      });

      setWeeklySchedule(updatedSchedule);
      setValidationErrors({});
    } catch (error) {
      console.error('Error fetching agent schedule:', error);
      toast.error('Erro ao carregar horários');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDayToggle = (dayIndex: number) => {
    setWeeklySchedule(prev => {
      const updated = [...prev];
      updated[dayIndex] = { ...updated[dayIndex], enabled: !updated[dayIndex].enabled };
      return updated;
    });
  };

  const handleTimeChange = (dayIndex: number, field: keyof DaySchedule, value: string) => {
    setWeeklySchedule(prev => {
      const updated = [...prev];
      updated[dayIndex] = { ...updated[dayIndex], [field]: value || null };
      return updated;
    });
    
    // Clear validation error for this day when user makes changes
    if (validationErrors[dayIndex]) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[dayIndex];
        return updated;
      });
    }
  };

  const handleSave = async () => {
    if (!selectedAgentId) {
      toast.error('Selecione um agente');
      return;
    }

    // Validate all enabled days
    const errors: Record<number, string[]> = {};
    weeklySchedule.forEach((day, index) => {
      const dayErrors = validateScheduleTimes(day);
      if (dayErrors.length > 0) {
        errors[index] = dayErrors;
      }
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error('Corrija os erros antes de salvar');
      return;
    }

    setIsSaving(true);

    try {
      for (const day of weeklySchedule) {
        if (day.enabled) {
          const scheduleData = {
            user_id: selectedAgentId,
            day_of_week: day.day_of_week,
            work_start_time: day.work_start_time,
            work_end_time: day.work_end_time,
            break_start_time: day.break_start_time,
            break_end_time: day.break_end_time,
          };

          if (day.schedule_id) {
            const { error } = await supabase
              .from('agent_schedules')
              .update(scheduleData)
              .eq('id', day.schedule_id);
            if (error) throw error;
          } else {
            const { error } = await supabase
              .from('agent_schedules')
              .insert(scheduleData);
            if (error) throw error;
          }
        } else if (day.schedule_id) {
          const { error } = await supabase
            .from('agent_schedules')
            .delete()
            .eq('id', day.schedule_id);
          if (error) throw error;
        }
      }

      toast.success('Horários salvos com sucesso!');
      fetchAgentSchedule(selectedAgentId);
    } catch (error) {
      console.error('Error saving schedules:', error);
      toast.error('Erro ao salvar horários');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <CardTitle>Configuração de Horários Semanais</CardTitle>
        </div>
        <CardDescription>
          Configure os horários de trabalho de cada agente por dia da semana
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Selecionar Agente</Label>
          <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha um agente" />
            </SelectTrigger>
            <SelectContent>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name || 'Sem nome'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedAgentId && (
          <>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                {weeklySchedule.map((day, index) => (
                  <div
                    key={day.day_of_week}
                    className={cn(
                      "border rounded-lg p-4 transition-all",
                      day.enabled ? "border-primary/50 bg-primary/5" : "border-border bg-muted/30"
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={day.enabled}
                          onCheckedChange={() => handleDayToggle(index)}
                        />
                        <Label className="text-base font-medium cursor-pointer">
                          {getDayOfWeekName(day.day_of_week)}
                        </Label>
                      </div>
                      {day.schedule_id && (
                        <Badge variant="secondary" className="text-xs">Configurado</Badge>
                      )}
                    </div>

                    {day.enabled ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <TimeInput
                            label="Início do expediente"
                            value={day.work_start_time}
                            onChange={(value) => handleTimeChange(index, 'work_start_time', value)}
                          />
                          <TimeInput
                            label="Fim do expediente"
                            value={day.work_end_time}
                            onChange={(value) => handleTimeChange(index, 'work_end_time', value)}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <TimeInput
                            label="Início do intervalo (opcional)"
                            value={day.break_start_time || ''}
                            onChange={(value) => handleTimeChange(index, 'break_start_time', value)}
                          />
                          <TimeInput
                            label="Fim do intervalo (opcional)"
                            value={day.break_end_time || ''}
                            onChange={(value) => handleTimeChange(index, 'break_end_time', value)}
                          />
                        </div>
                        {validationErrors[index] && (
                          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                            {validationErrors[index].map((error, i) => (
                              <p key={i} className="text-xs text-destructive">{error}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Este dia está desabilitado - o agente não trabalha neste dia
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSave}
                disabled={isSaving || isLoading}
                size="lg"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Horários
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
