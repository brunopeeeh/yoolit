import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Coffee, CalendarCheck, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

const JS_DAY_TO_KEY: Record<number, string> = {
  0: 'dom',
  1: 'seg',
  2: 'ter',
  3: 'qua',
  4: 'qui',
  5: 'sex',
  6: 'sab',
};

const DAY_NAMES: Record<string, string> = {
  dom: 'Domingo',
  seg: 'Segunda-feira',
  ter: 'Terça-feira',
  qua: 'Quarta-feira',
  qui: 'Quinta-feira',
  sex: 'Sexta-feira',
  sab: 'Sábado',
};

function formatTime(time: string | null | undefined): string {
  if (!time) return '--:--';
  return time.slice(0, 5);
}

function getShiftStatus(workStart: string, workEnd: string): 'before' | 'working' | 'after' {
  const now = new Date();
  const [sh, sm] = workStart.split(':').map(Number);
  const [eh, em] = workEnd.split(':').map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const nowMin = now.getHours() * 60 + now.getMinutes();

  if (nowMin < startMin) return 'before';
  if (nowMin >= startMin && nowMin <= endMin) return 'working';
  return 'after';
}

function getWorkdayProgress(workStart: string, workEnd: string): number {
  const now = new Date();
  const [sh, sm] = workStart.split(':').map(Number);
  const [eh, em] = workEnd.split(':').map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const total = endMin - startMin;
  if (total <= 0) return 0;
  const elapsed = Math.max(0, Math.min(nowMin - startMin, total));
  return Math.round((elapsed / total) * 100);
}

export const TodayScheduleCard = () => {
  const [schedule, setSchedule] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const todayKey = JS_DAY_TO_KEY[new Date().getDay()];
  const todayName = DAY_NAMES[todayKey];

  useEffect(() => {
    fetchTodaySchedule();
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchTodaySchedule = async () => {
    setIsLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) return;

      const { data, error } = await supabase
        .from('agent_schedules')
        .select('*')
        .eq('user_id', userId)
        .eq('day_of_week', todayKey)
        .maybeSingle();

      if (error) throw error;
      setSchedule(data);
    } catch (error) {
      console.error('Error fetching today schedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const timeString = currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const dateString = currentTime.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#0a639a] to-[#0d4f7a] p-4 animate-pulse flex items-center gap-4">
        <div className="h-4 w-24 bg-white/20 rounded" />
        <div className="h-4 w-32 bg-white/20 rounded" />
        <div className="h-4 w-32 bg-white/20 rounded" />
      </div>
    );
  }

  // Day off
  if (!schedule) {
    return (
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 px-4 py-3 text-white shadow-xl flex items-center gap-3">
        <Moon className="h-4 w-4 text-white/40 flex-shrink-0" />
        <span className="text-xs font-medium uppercase tracking-wide text-white/50">{todayName}</span>
        <span className="text-sm text-white/70 ml-1">
          Você está de <strong className="text-white">folga</strong> hoje!
        </span>
      </div>
    );
  }

  const status = getShiftStatus(schedule.work_start_time, schedule.work_end_time);
  const progress =
    status === 'working'
      ? getWorkdayProgress(schedule.work_start_time, schedule.work_end_time)
      : status === 'after'
      ? 100
      : 0;

  const statusConfig = {
    before: { label: 'Expediente não iniciado', color: 'text-yellow-300', dot: 'bg-yellow-400' },
    working: { label: 'Em expediente', color: 'text-emerald-300', dot: 'bg-emerald-400 animate-pulse' },
    after: { label: 'Expediente encerrado', color: 'text-white/50', dot: 'bg-white/40' },
  };

  const cfg = statusConfig[status];

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#0a639a] via-[#0d5a8a] to-[#083d61] px-5 py-4 text-white shadow-xl flex-1">
      <div className="pointer-events-none absolute -top-6 -right-6 h-32 w-32 rounded-full bg-white/5" />

      {/* Linha principal: status + horários */}
      <div className="relative flex flex-wrap items-center gap-x-5 gap-y-2">

        {/* Badge de status */}
        <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1">
          <span className={cn('h-2 w-2 rounded-full flex-shrink-0', cfg.dot)} />
          <span className={cn('text-xs font-medium', cfg.color)}>{cfg.label}</span>
        </div>

        {/* Hora atual em destaque */}
        <span className="text-2xl font-bold tabular-nums tracking-tight">{timeString}</span>

        {/* Separador */}
        <span className="text-white/20 text-sm hidden sm:inline">|</span>

        {/* Expediente */}
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-[#83cef6] flex-shrink-0" />
          <span className="text-[10px] text-white/50 uppercase tracking-wide">Expediente</span>
          <span className="text-sm font-semibold tabular-nums ml-1">
            {formatTime(schedule.work_start_time)} – {formatTime(schedule.work_end_time)}
          </span>
        </div>

        {/* Intervalo */}
        {schedule.break_start_time && schedule.break_end_time ? (
          <div className="flex items-center gap-1.5">
            <Coffee className="h-3.5 w-3.5 text-[#83cef6] flex-shrink-0" />
            <span className="text-[10px] text-white/50 uppercase tracking-wide">Intervalo</span>
            <span className="text-sm font-semibold tabular-nums ml-1">
              {formatTime(schedule.break_start_time)} – {formatTime(schedule.break_end_time)}
            </span>
          </div>
        ) : null}

        {/* Data à direita */}
        <div className="ml-auto hidden md:block">
          <span className="text-xs text-white/40">{todayName}, {dateString}</span>
        </div>
      </div>

      {/* Barra de progresso compacta */}
      {(status === 'working' || status === 'after') && (
        <div className="relative mt-3">
          <div className="flex justify-between text-[10px] text-white/40 mb-1">
            <span>{formatTime(schedule.work_start_time)}</span>
            <span className="text-white/60 font-medium">{progress}% concluído</span>
            <span>{formatTime(schedule.work_end_time)}</span>
          </div>
          <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-700',
                status === 'after' ? 'bg-white/40' : 'bg-[#83cef6]'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
