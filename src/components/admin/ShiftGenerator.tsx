import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Calendar, Loader2 } from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getShiftType, dayOfWeekToNumber } from '@/lib/shiftUtils';

export const ShiftGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [weeksToGenerate, setWeeksToGenerate] = useState(4);

  const generateShifts = async () => {
    try {
      setIsGenerating(true);

      // Buscar todas as escalas dos agentes
      const { data: schedules, error: schedulesError } = await supabase
        .from('agent_schedules')
        .select('*');

      if (schedulesError) throw schedulesError;

      if (!schedules || schedules.length === 0) {
        toast.error('Nenhuma escala configurada. Configure as escalas dos agentes primeiro.');
        return;
      }

      // Agrupar escalas por usuário
      const schedulesByUser = schedules.reduce((acc, schedule) => {
        if (!acc[schedule.user_id]) {
          acc[schedule.user_id] = [];
        }
        acc[schedule.user_id].push(schedule);
        return acc;
      }, {} as Record<string, typeof schedules>);

      const shiftsToInsert = [];
      const today = new Date();
      const startDate = startOfWeek(today, { weekStartsOn: 0 });

      // Gerar turnos para as próximas semanas
      for (let week = 0; week < weeksToGenerate; week++) {
        for (let day = 0; day < 7; day++) {
          const currentDate = addDays(startDate, week * 7 + day);
          const dayOfWeek = currentDate.getDay();

          // Para cada usuário, verificar se tem escala neste dia
          for (const [userId, userSchedules] of Object.entries(schedulesByUser)) {
            const daySchedule = userSchedules.find(
              s => dayOfWeekToNumber(s.day_of_week) === dayOfWeek
            );

            if (daySchedule && daySchedule.work_start_time && daySchedule.work_end_time) {
              const shiftType = getShiftType(daySchedule.work_start_time);
              
              shiftsToInsert.push({
                user_id: userId,
                shift_date: format(currentDate, 'yyyy-MM-dd'),
                start_time: daySchedule.work_start_time,
                end_time: daySchedule.work_end_time,
                shift_type: shiftType,
                notes: 'Turno gerado automaticamente'
              });
            }
          }
        }
      }

      if (shiftsToInsert.length === 0) {
        toast.error('Nenhum turno para gerar. Verifique as escalas dos agentes.');
        return;
      }

      // Deletar turnos futuros existentes para evitar duplicatas
      const { error: deleteError } = await supabase
        .from('shifts')
        .delete()
        .gte('shift_date', format(today, 'yyyy-MM-dd'));

      if (deleteError) throw deleteError;

      // Inserir novos turnos
      const { error: insertError } = await supabase
        .from('shifts')
        .insert(shiftsToInsert);

      if (insertError) throw insertError;

      toast.success(`${shiftsToInsert.length} turnos gerados com sucesso para ${weeksToGenerate} semanas!`);
    } catch (error) {
      console.error('Error generating shifts:', error);
      toast.error('Erro ao gerar turnos');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Gerador de Turnos
        </CardTitle>
        <CardDescription>
          Gera turnos automaticamente baseados nas escalas dos agentes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="weeks">Semanas para Gerar</Label>
          <div className="flex items-center gap-4">
            <input
              id="weeks"
              type="number"
              min="1"
              max="12"
              value={weeksToGenerate}
              onChange={(e) => setWeeksToGenerate(parseInt(e.target.value) || 4)}
              className="w-20 px-3 py-2 border rounded-md"
            />
            <span className="text-sm text-muted-foreground">
              semanas a partir de hoje
            </span>
          </div>
        </div>

        <Button 
          onClick={generateShifts} 
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Gerando Turnos...
            </>
          ) : (
            <>
              <Calendar className="h-4 w-4 mr-2" />
              Gerar Turnos
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground">
          Este processo irá deletar todos os turnos futuros existentes e gerar novos turnos
          baseados nas escalas semanais configuradas para cada agente.
        </p>
      </CardContent>
    </Card>
  );
};
