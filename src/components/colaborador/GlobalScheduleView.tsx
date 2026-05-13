import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Table as TableIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const DAYS_OF_WEEK = [
  { value: 'seg', label: 'Segunda-feira' },
  { value: 'ter', label: 'Terça-feira' },
  { value: 'qua', label: 'Quarta-feira' },
  { value: 'qui', label: 'Quinta-feira' },
  { value: 'sex', label: 'Sexta-feira' },
  { value: 'sab', label: 'Sábado' },
  { value: 'dom', label: 'Domingo' },
];

// Helper para gerar blocos de tempo
const generateTimeBlocks = () => {
  const blocks = [];
  let currentHour = 7;
  let currentMinute = 0;

  // Vai de 07:00 até 23:40 (antes de 00:00 do proximo dia)
  while (currentHour < 24) {
    const startStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    
    let nextMinute = currentMinute + 20;
    let nextHour = currentHour;
    
    if (nextMinute >= 60) {
      nextMinute = nextMinute - 60;
      nextHour++;
    }
    
    let endStr = '00:00';
    if (nextHour < 24) {
      endStr = `${nextHour.toString().padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`;
    }

    blocks.push({ start: startStr, end: endStr });

    currentMinute = nextMinute;
    currentHour = nextHour;
  }

  return blocks;
};

const TIME_BLOCKS = generateTimeBlocks();

export const GlobalScheduleView = () => {
  // Pega o dia atual da semana (0 = domingo, 1 = segunda...)
  const todayIndex = new Date().getDay();
  // Mapeamento simples (dom = 6, seg = 0, ...) -> DAYS_OF_WEEK array é seg a dom
  const initialDayIndex = todayIndex === 0 ? 6 : todayIndex - 1;
  const initialDay = DAYS_OF_WEEK[initialDayIndex]?.value || 'seg';

  const [selectedDay, setSelectedDay] = useState<string>(initialDay);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchGlobalSchedule();
  }, [selectedDay]);

  const fetchGlobalSchedule = async () => {
    setIsLoading(true);
    try {
      // 1. Busca todas as escalas do dia selecionado
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('agent_schedules')
        .select('*')
        .eq('day_of_week', selectedDay);

      if (scheduleError) throw scheduleError;

      // 2. Extrai IDs unicos dos usuarios que tem escala nesse dia
      const userIds = [...new Set(scheduleData?.map(s => s.user_id) || [])];

      if (userIds.length > 0) {
        // 3. Busca o nome desses perfis
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, full_name')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        const profilesMap: Record<string, string> = {};
        profilesData?.forEach(p => {
          profilesMap[p.id] = p.name || p.full_name || 'Desconhecido';
        });

        setProfiles(profilesMap);
      } else {
        setProfiles({});
      }

      setSchedules(scheduleData || []);
    } catch (error) {
      console.error('Erro ao buscar escala global:', error);
      toast.error('Erro ao carregar a escala global.');
    } finally {
      setIsLoading(false);
    }
  };

  // Funções para verificar se um bloco de tempo está contido no expediente ou no intervalo
  const timeToMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const isTimeInShift = (blockStart: string, schedule: any) => {
    if (!schedule || !schedule.work_start_time || !schedule.work_end_time) return false;
    
    const blockMin = timeToMinutes(blockStart);
    const workStartMin = timeToMinutes(schedule.work_start_time);
    const workEndMin = timeToMinutes(schedule.work_end_time);

    // Turno normal (ex: 08:00 as 17:00)
    if (workStartMin <= workEndMin) {
      return blockMin >= workStartMin && blockMin < workEndMin;
    } 
    // Vira a noite (ex: 22:00 as 06:00) - menos comum mas possivel
    return blockMin >= workStartMin || blockMin < workEndMin;
  };

  const isTimeInBreak = (blockStart: string, schedule: any) => {
    if (!schedule || !schedule.break_start_time || !schedule.break_end_time) return false;
    
    const blockMin = timeToMinutes(blockStart);
    const breakStartMin = timeToMinutes(schedule.break_start_time);
    const breakEndMin = timeToMinutes(schedule.break_end_time);

    if (breakStartMin <= breakEndMin) {
      return blockMin >= breakStartMin && blockMin < breakEndMin;
    }
    return blockMin >= breakStartMin || blockMin < breakEndMin;
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TableIcon className="h-5 w-5 text-primary" />
            <CardTitle>Escala Global</CardTitle>
          </div>
          <CardDescription>
            Visualização completa da equipe para o dia selecionado.
          </CardDescription>
        </div>

        <Select value={selectedDay} onValueChange={setSelectedDay}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione o dia" />
          </SelectTrigger>
          <SelectContent>
            {DAYS_OF_WEEK.map((day) => (
              <SelectItem key={day.value} value={day.value}>
                {day.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/20">
            Nenhum colaborador possui escala configurada para {DAYS_OF_WEEK.find(d => d.value === selectedDay)?.label.toLowerCase()}.
          </div>
        ) : (
          <div className="overflow-x-auto border rounded-lg shadow-sm">
            <table className="w-full border-collapse text-sm min-w-max">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border p-2 font-semibold text-left sticky left-0 z-20 bg-muted" colSpan={2}>
                    <div className="flex justify-center text-red-600 font-bold uppercase tracking-wider">
                      {DAYS_OF_WEEK.find(d => d.value === selectedDay)?.label}
                    </div>
                  </th>
                  {schedules.map((schedule) => (
                    <th key={schedule.user_id} className="border p-2 font-medium text-center min-w-[80px]">
                      {profiles[schedule.user_id]?.split(' ')[0] || 'Desconhecido'}
                    </th>
                  ))}
                  <th className="border p-2 font-bold text-center text-red-600 min-w-[60px] bg-muted/80">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {TIME_BLOCKS.map((block) => {
                  let totalWorking = 0;

                  return (
                    <tr key={block.start} className="hover:bg-muted/30 transition-colors">
                      <td className="border p-1 text-center text-xs text-muted-foreground sticky left-0 z-10 bg-background/95 font-medium border-r-0">
                        {block.start}
                      </td>
                      <td className="border p-1 text-center text-xs text-muted-foreground sticky left-[40px] z-10 bg-background/95 font-medium border-l-0">
                        {block.end}
                      </td>
                      
                      {schedules.map((schedule) => {
                        const inShift = isTimeInShift(block.start, schedule);
                        const inBreak = isTimeInBreak(block.start, schedule);
                        
                        let cellClass = "";
                        let cellContent = "";

                        if (inBreak) {
                          cellClass = "bg-[#f8b890] border-[#e8a880]"; // Laranja/Coral (Intervalo)
                        } else if (inShift) {
                          cellClass = "bg-[#c6dfc0] border-[#b6cfb0] font-medium text-[#2d5a27]"; // Verde (Trabalhando)
                          cellContent = "1";
                          totalWorking++;
                        }

                        return (
                          <td 
                            key={`${block.start}-${schedule.user_id}`} 
                            className={cn("border p-1 text-center", cellClass)}
                          >
                            {cellContent}
                          </td>
                        );
                      })}
                      
                      <td className="border p-1 text-center font-bold bg-muted/30 text-muted-foreground">
                        {totalWorking > 0 ? totalWorking : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
