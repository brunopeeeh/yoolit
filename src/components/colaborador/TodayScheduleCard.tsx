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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a639a] to-[#0d4f7a] p-6 animate-pulse">
        <div className="h-5 w-40 bg-white/20 rounded mb-3" />
        <div className="h-10 w-28 bg-white/20 rounded mb-4" />
        <div className="h-4 w-56 bg-white/20 rounded" />
      </div>
    );
  }

  // Day off
  if (!schedule) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 p-6 text-white shadow-xl">
        <div className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-white/50 mb-1">{todayName}</p>
            <p className="text-4xl font-bold tabular-nums">{timeString}</p>
            <p className="text-sm text-white/60 mt-1">{dateString}</p>
          </div>
          <Moon className="h-8 w-8 text-white/30 mt-1 flex-shrink-0" />
        </div>
        <div className="relative mt-5 flex items-center gap-2 bg-white/10 rounded-xl px-4 py-3">
          <CalendarCheck className="h-4 w-4 text-white/50 flex-shrink-0" />
          <span className="text-sm text-white/70">
            Você está de <strong className="text-white">folga</strong> hoje. Aproveite!
          </span>
        </div>
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
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a639a] via-[#0d5a8a] to-[#083d61] p-6 text-white shadow-xl">
      <div className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-white/5" />

      {/* Header row */}
      <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-white/50 mb-1">{todayName}</p>
          <p className="text-5xl font-bold tabular-nums leading-none">{timeString}</p>
          <p className="text-sm text-white/60 mt-1">{dateString}</p>
        </div>

        <div className="flex items-center gap-1.5 self-start rounded-full bg-white/10 px-3 py-1.5">
          <span className={cn('h-2 w-2 rounded-full', cfg.dot)} />
          <span className={cn('text-xs font-medium', cfg.color)}>{cfg.label}</span>
        </div>
      </div>

      {/* Shift info pills */}
      <div className="relative mt-5 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2.5">
          <Clock className="h-4 w-4 text-[#83cef6] flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-white/50 uppercase tracking-wide">Expediente</p>
            <p className="text-sm font-semibold tabular-nums">
              {formatTime(schedule.work_start_time)} – {formatTime(schedule.work_end_time)}
            </p>
          </div>
        </div>

        {schedule.break_start_time && schedule.break_end_time ? (
          <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2.5">
            <Coffee className="h-4 w-4 text-[#83cef6] flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-white/50 uppercase tracking-wide">Intervalo</p>
              <p className="text-sm font-semibold tabular-nums">
                {formatTime(schedule.break_start_time)} – {formatTime(schedule.break_end_time)}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2.5 opacity-50">
            <Coffee className="h-4 w-4 text-white/40 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-wide">Intervalo</p>
              <p className="text-sm font-medium text-white/40">Não configurado</p>
            </div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {(status === 'working' || status === 'after') && (
        <div className="relative mt-4">
          <div className="flex justify-between text-[10px] text-white/40 mb-1.5">
            <span>{formatTime(schedule.work_start_time)}</span>
            <span className="text-white/60 font-medium">{progress}% concluído</span>
            <span>{formatTime(schedule.work_end_time)}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
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
