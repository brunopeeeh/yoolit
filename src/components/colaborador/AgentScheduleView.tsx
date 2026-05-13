import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getDayOfWeekName } from '@/lib/shiftUtils';
import { type DaySchedule } from '@/lib/validateScheduleTimes';
import { Calendar, Loader2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const DEFAULT_WEEK: DaySchedule[] = [
  { day_of_week: 'seg', enabled: false, work_start_time: '08:00', work_end_time: '17:00', break_start_time: '12:00', break_end_time: '13:00' },
  { day_of_week: 'ter', enabled: false, work_start_time: '08:00', work_end_time: '17:00', break_start_time: '12:00', break_end_time: '13:00' },
  { day_of_week: 'qua', enabled: false, work_start_time: '08:00', work_end_time: '17:00', break_start_time: '12:00', break_end_time: '13:00' },
  { day_of_week: 'qui', enabled: false, work_start_time: '08:00', work_end_time: '17:00', break_start_time: '12:00', break_end_time: '13:00' },
  { day_of_week: 'sex', enabled: false, work_start_time: '08:00', work_end_time: '17:00', break_start_time: '12:00', break_end_time: '13:00' },
  { day_of_week: 'sab', enabled: false, work_start_time: '08:00', work_end_time: '17:00', break_start_time: '12:00', break_end_time: '13:00' },
  { day_of_week: 'dom', enabled: false, work_start_time: '08:00', work_end_time: '17:00', break_start_time: '12:00', break_end_time: '13:00' },
];

export const AgentScheduleView = () => {
  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>(DEFAULT_WEEK);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMySchedule();
  }, []);

  const fetchMySchedule = async () => {
    setIsLoading(true);
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      
      const userId = sessionData.session?.user.id;
      if (!userId) {
        toast.error('Sessão não encontrada');
        return;
      }

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
    } catch (error) {
      console.error('Error fetching schedule:', error);
      toast.error('Erro ao carregar sua escala');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <CardTitle>Minha Escala</CardTitle>
        </div>
        <CardDescription>
          Visualize seus horários de trabalho e intervalos por dia da semana
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {weeklySchedule.map((day) => (
              <div
                key={day.day_of_week}
                className={cn(
                  "border rounded-lg p-4 transition-all",
                  day.enabled ? "border-primary/50 bg-primary/5" : "border-border bg-muted/30 opacity-70"
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-medium">
                      {getDayOfWeekName(day.day_of_week)}
                    </span>
                  </div>
                  {day.enabled ? (
                    <Badge variant="default" className="text-xs bg-[#83cef6] text-[#0a639a] hover:bg-[#8dd1f6]">
                      Trabalha
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      Folga
                    </Badge>
                  )}
                </div>

                {day.enabled ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Expediente:</span>
                      <span className="font-medium">{day.work_start_time} - {day.work_end_time}</span>
                    </div>
                    {(day.break_start_time && day.break_end_time) && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Intervalo:</span>
                        <span className="font-medium">{day.break_start_time} - {day.break_end_time}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Você está de folga neste dia.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
