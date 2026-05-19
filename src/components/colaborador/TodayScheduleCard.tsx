import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Coffee, Timer, Moon, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

const JS_DAY_TO_KEY: Record<number, string> = {
  0: 'dom', 1: 'seg', 2: 'ter', 3: 'qua',
  4: 'qui', 5: 'sex', 6: 'sab',
};

const DAY_NAMES: Record<string, string> = {
  dom: 'Domingo', seg: 'Segunda-feira', ter: 'Terça-feira',
  qua: 'Quarta-feira', qui: 'Quinta-feira', sex: 'Sexta-feira', sab: 'Sábado',
};

function formatTime(time: string | null | undefined): string {
  if (!time) return '--:--';
  return time.slice(0, 5);
}

function parseMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
}

function getShiftStatus(workStart: string, workEnd: string): 'before' | 'working' | 'after' {
  const now = nowMinutes();
  const start = parseMinutes(workStart);
  const end = parseMinutes(workEnd);
  if (now < start) return 'before';
  if (now >= start && now <= end) return 'working';
  return 'after';
}

function getWorkdayProgress(workStart: string, workEnd: string): number {
  const now = nowMinutes();
  const start = parseMinutes(workStart);
  const end = parseMinutes(workEnd);
  const total = end - start;
  if (total <= 0) return 0;
  const elapsed = Math.max(0, Math.min(now - start, total));
  return Math.round((elapsed / total) * 100);
}

function getRemainingTime(workEnd: string, currentTime: Date): string {
  const [eh, em] = workEnd.split(':').map(Number);
  const endTotalSeconds = (eh * 60 + em) * 60;
  const nowTotalSeconds =
    currentTime.getHours() * 3600 +
    currentTime.getMinutes() * 60 +
    currentTime.getSeconds();
  const diffSeconds = endTotalSeconds - nowTotalSeconds;
  if (diffSeconds <= 0) return '0m';
  const h = Math.floor(diffSeconds / 3600);
  const m = Math.floor((diffSeconds % 3600) / 60);
  const s = diffSeconds % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, '0')}s`;
  return `${s}s`;
}

function getTimeUntilStart(workStart: string, currentTime: Date): string {
  const [sh, sm] = workStart.split(':').map(Number);
  const startTotalSeconds = (sh * 60 + sm) * 60;
  const nowTotalSeconds =
    currentTime.getHours() * 3600 +
    currentTime.getMinutes() * 60 +
    currentTime.getSeconds();
  const diffSeconds = startTotalSeconds - nowTotalSeconds;
  if (diffSeconds <= 0) return '0m';
  const h = Math.floor(diffSeconds / 3600);
  const m = Math.floor((diffSeconds % 3600) / 60);
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  return `${m}m`;
}

type RGB = { r: number; g: number; b: number };

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpRgb(a: RGB, b: RGB, t: number): RGB {
  return {
    r: Math.round(lerp(a.r, b.r, t)),
    g: Math.round(lerp(a.g, b.g, t)),
    b: Math.round(lerp(a.b, b.b, t)),
  };
}

function rgbToCss({ r, g, b }: RGB): string {
  return `rgb(${r}, ${g}, ${b})`;
}

function minuteOfDay(now: Date): number {
  return (
    now.getHours() * 60 +
    now.getMinutes() +
    now.getSeconds() / 60 +
    now.getMilliseconds() / 60000
  );
}

/**
 * Paleta de cores por período do dia:
 * Manhã  — #A0C4FF (azul céu) · #FFD166 (dourado alvorecer) · #FFADAD (rosa amanhecer)
 * Tarde  — #0077B6 (azul vibrante) · #F4A261 (laranja) · #E76F51 (terracota) · #E9C46A (amarelo)
 * Noite  — #0B0C10 (preto espacial) · #0B3C5D (azul meia-noite) · #1D1135 (roxo cósmico) · #FDFD96 (lua)
 */
const SKY_CARD_STOPS: {
  at: number;
  gradient: [RGB, RGB, RGB];
  orb1: RGB;
  orb2: RGB;
  orb1Opacity: number;
  orb2Opacity: number;
  warmGlowOpacity: number;
  accentSoft: RGB;
  accentBright: RGB;
  progressFrom: RGB;
  progressTo: RGB;
}[] = [
  // 00:00 — Noite cerrada  →  #0B0C10 · #0B3C5D · #1D1135
  {
    at: 0,
    gradient: [
      { r: 11, g: 12, b: 16 },   // #0B0C10 preto espacial
      { r: 11, g: 60, b: 93 },   // #0B3C5D azul meia-noite
      { r: 11, g: 12, b: 16 },
    ],
    orb1: { r: 29, g: 17, b: 53 },   // #1D1135 roxo cósmico
    orb2: { r: 11, g: 60, b: 93 },   // #0B3C5D
    orb1Opacity: 0.22,
    orb2Opacity: 0.14,
    warmGlowOpacity: 0,
    accentSoft:   { r: 180, g: 195, b: 215 },
    accentBright: { r: 253, g: 253, b: 150 }, // #FDFD96 amarelo lunar
    progressFrom: { r: 100, g: 145, b: 205 },
    progressTo:   { r: 55,  g: 100, b: 158 },
  },
  // 05:00 — Madrugada, aurora ainda distante
  {
    at: 5 * 60,
    gradient: [
      { r: 18, g: 14, b: 46 },
      { r: 13, g: 52, b: 82 },
      { r: 14, g: 12, b: 36 },
    ],
    orb1: { r: 55,  g: 32, b: 98 },  // roxo mais brilhante
    orb2: { r: 11,  g: 60, b: 93 },
    orb1Opacity: 0.18,
    orb2Opacity: 0.1,
    warmGlowOpacity: 0.04,
    accentSoft:   { r: 160, g: 196, b: 235 },
    accentBright: { r: 220, g: 230, b: 190 }, // hint de #FDFD96
    progressFrom: { r: 82,  g: 148, b: 218 },
    progressTo:   { r: 50,  g: 108, b: 172 },
  },
  // 06:15 — Nascer do sol: fundo escuro + glow dourado/rosa
  //  orbs: #FFD166 (dourado) + #FFADAD (rosa)
  {
    at: 6.25 * 60,
    gradient: [
      { r: 72, g: 50, b: 82 },    // roxo-índigo escuro
      { r: 52, g: 70, b: 125 },
      { r: 36, g: 55, b: 105 },
    ],
    orb1: { r: 255, g: 209, b: 102 }, // #FFD166 dourado
    orb2: { r: 255, g: 173, b: 173 }, // #FFADAD rosa
    orb1Opacity: 0.45,
    orb2Opacity: 0.25,
    warmGlowOpacity: 0.32,
    accentSoft:   { r: 255, g: 209, b: 102 }, // #FFD166
    accentBright: { r: 255, g: 222, b: 158 },
    progressFrom: { r: 255, g: 209, b: 102 }, // #FFD166
    progressTo:   { r: 160, g: 196, b: 255 }, // #A0C4FF
  },
  // 07:30 — Amanhecer: céu azul abrindo, quente ainda no horizonte
  {
    at: 7.5 * 60,
    gradient: [
      { r: 82, g: 122, b: 182 },   // azul amanhecer
      { r: 60, g: 145, b: 202 },
      { r: 45, g: 115, b: 172 },
    ],
    orb1: { r: 255, g: 209, b: 102 }, // #FFD166
    orb2: { r: 255, g: 173, b: 173 }, // #FFADAD
    orb1Opacity: 0.32,
    orb2Opacity: 0.18,
    warmGlowOpacity: 0.24,
    accentSoft:   { r: 255, g: 209, b: 102 },
    accentBright: { r: 255, g: 230, b: 175 },
    progressFrom: { r: 255, g: 209, b: 102 },
    progressTo:   { r: 160, g: 196, b: 255 },
  },
  // 09:00 — Manhã clara: #A0C4FF como referência (azul pastel vibrante)
  {
    at: 9 * 60,
    gradient: [
      { r: 58, g: 130, b: 210 },   // versão escurecida de #A0C4FF para contraste texto
      { r: 42, g: 112, b: 190 },
      { r: 30, g: 95,  b: 168 },
    ],
    orb1: { r: 255, g: 209, b: 102 }, // #FFD166 dourado residual
    orb2: { r: 255, g: 173, b: 173 }, // #FFADAD rosa residual
    orb1Opacity: 0.2,
    orb2Opacity: 0.1,
    warmGlowOpacity: 0.1,
    accentSoft:   { r: 160, g: 196, b: 255 }, // #A0C4FF
    accentBright: { r: 225, g: 240, b: 255 },
    progressFrom: { r: 255, g: 209, b: 102 }, // #FFD166
    progressTo:   { r: 160, g: 196, b: 255 }, // #A0C4FF
  },
  // 11:30 — Manhã avançada: transição de #A0C4FF → #0077B6
  {
    at: 11.5 * 60,
    gradient: [
      { r: 38, g: 118, b: 195 },
      { r: 28, g: 102, b: 175 },
      { r: 20, g: 88,  b: 155 },
    ],
    orb1: { r: 233, g: 196, b: 106 }, // #E9C46A amarelo quente
    orb2: { r: 160, g: 196, b: 255 }, // #A0C4FF
    orb1Opacity: 0.15,
    orb2Opacity: 0.1,
    warmGlowOpacity: 0.05,
    accentSoft:   { r: 160, g: 196, b: 255 },
    accentBright: { r: 205, g: 235, b: 255 },
    progressFrom: { r: 160, g: 196, b: 255 },
    progressTo:   { r: 85,  g: 175, b: 242 },
  },
  // 13:00 — Meio-dia: #0077B6 (azul vibrante)
  {
    at: 13 * 60,
    gradient: [
      { r: 0,   g: 119, b: 182 },  // #0077B6
      { r: 0,   g: 102, b: 162 },
      { r: 0,   g: 85,  b: 142 },
    ],
    orb1: { r: 233, g: 196, b: 106 }, // #E9C46A amarelo
    orb2: { r: 160, g: 196, b: 255 }, // #A0C4FF
    orb1Opacity: 0.2,
    orb2Opacity: 0.08,
    warmGlowOpacity: 0.06,
    accentSoft:   { r: 160, g: 196, b: 255 },
    accentBright: { r: 205, g: 235, b: 255 },
    progressFrom: { r: 160, g: 196, b: 255 },
    progressTo:   { r: 78,  g: 172, b: 238 },
  },
  // 15:30 — Tarde: #0077B6 com calor crescendo (#E9C46A)
  {
    at: 15.5 * 60,
    gradient: [
      { r: 18,  g: 98, b: 168 },
      { r: 12,  g: 85, b: 150 },
      { r: 8,   g: 72, b: 132 },
    ],
    orb1: { r: 233, g: 196, b: 106 }, // #E9C46A
    orb2: { r: 244, g: 162, b: 97  }, // #F4A261
    orb1Opacity: 0.28,
    orb2Opacity: 0.14,
    warmGlowOpacity: 0.14,
    accentSoft:   { r: 233, g: 196, b: 106 }, // #E9C46A
    accentBright: { r: 255, g: 222, b: 148 },
    progressFrom: { r: 233, g: 196, b: 106 }, // #E9C46A
    progressTo:   { r: 160, g: 196, b: 255 },
  },
  // 17:00 — Golden hour / Entardecer: #F4A261 + #E9C46A
  {
    at: 17 * 60,
    gradient: [
      { r: 178, g: 88,  b: 40 },  // laranja-terra escurecido
      { r: 152, g: 75,  b: 35 },
      { r: 88,  g: 60,  b: 88 },  // roxo-terra no canto
    ],
    orb1: { r: 255, g: 209, b: 102 }, // #FFD166
    orb2: { r: 244, g: 162, b: 97  }, // #F4A261
    orb1Opacity: 0.38,
    orb2Opacity: 0.24,
    warmGlowOpacity: 0.3,
    accentSoft:   { r: 244, g: 162, b: 97  }, // #F4A261
    accentBright: { r: 255, g: 209, b: 102 }, // #FFD166
    progressFrom: { r: 255, g: 209, b: 102 },
    progressTo:   { r: 244, g: 162, b: 97  },
  },
  // 18:45 — Pôr do sol: #E76F51 + #F4A261
  {
    at: 18.75 * 60,
    gradient: [
      { r: 145, g: 48, b: 52 },   // terracota escurecido
      { r: 105, g: 48, b: 85 },
      { r: 40,  g: 36, b: 78 },
    ],
    orb1: { r: 231, g: 111, b: 81  }, // #E76F51 terracota
    orb2: { r: 244, g: 162, b: 97  }, // #F4A261
    orb1Opacity: 0.32,
    orb2Opacity: 0.22,
    warmGlowOpacity: 0.28,
    accentSoft:   { r: 244, g: 162, b: 97  }, // #F4A261
    accentBright: { r: 231, g: 111, b: 81  }, // #E76F51
    progressFrom: { r: 231, g: 111, b: 81  },
    progressTo:   { r: 244, g: 162, b: 97  },
  },
  // 20:30 — Crepúsculo: #1D1135 + #0B3C5D
  {
    at: 20.5 * 60,
    gradient: [
      { r: 29, g: 17, b: 53 },   // #1D1135
      { r: 20, g: 28, b: 62 },
      { r: 12, g: 18, b: 48 },
    ],
    orb1: { r: 75,  g: 45, b: 122 }, // roxo mais brilhante
    orb2: { r: 11,  g: 60, b: 93  }, // #0B3C5D
    orb1Opacity: 0.2,
    orb2Opacity: 0.13,
    warmGlowOpacity: 0.06,
    accentSoft:   { r: 172, g: 158, b: 225 },
    accentBright: { r: 138, g: 180, b: 242 },
    progressFrom: { r: 148, g: 128, b: 238 },
    progressTo:   { r: 80,  g: 112, b: 198 },
  },
  // 22:30 — Noite fechada: de volta a #0B0C10 + #0B3C5D
  {
    at: 22.5 * 60,
    gradient: [
      { r: 11, g: 12, b: 16 },
      { r: 11, g: 60, b: 93 },
      { r: 11, g: 12, b: 16 },
    ],
    orb1: { r: 29, g: 17, b: 53 },
    orb2: { r: 11, g: 60, b: 93 },
    orb1Opacity: 0.22,
    orb2Opacity: 0.14,
    warmGlowOpacity: 0,
    accentSoft:   { r: 180, g: 195, b: 215 },
    accentBright: { r: 253, g: 253, b: 150 }, // #FDFD96
    progressFrom: { r: 100, g: 145, b: 205 },
    progressTo:   { r: 55,  g: 100, b: 158 },
  },
  // 24:00 — fecha o loop
  {
    at: 24 * 60,
    gradient: [
      { r: 11, g: 12, b: 16 },
      { r: 11, g: 60, b: 93 },
      { r: 11, g: 12, b: 16 },
    ],
    orb1: { r: 29, g: 17, b: 53 },
    orb2: { r: 11, g: 60, b: 93 },
    orb1Opacity: 0.22,
    orb2Opacity: 0.14,
    warmGlowOpacity: 0,
    accentSoft:   { r: 180, g: 195, b: 215 },
    accentBright: { r: 253, g: 253, b: 150 },
    progressFrom: { r: 100, g: 145, b: 205 },
    progressTo:   { r: 55,  g: 100, b: 158 },
  },
];

function interpolateSkyCardTheme(minutes: number) {
  const m = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const stops = SKY_CARD_STOPS;
  let i = stops.length - 2;
  for (let s = 0; s < stops.length - 1; s++) {
    if (m >= stops[s].at && m < stops[s + 1].at) {
      i = s;
      break;
    }
  }
  const a = stops[i];
  const b = stops[i + 1];
  const span = b.at - a.at;
  const t = span > 0 ? Math.min(1, Math.max(0, (m - a.at) / span)) : 0;

  const g0 = lerpRgb(a.gradient[0], b.gradient[0], t);
  const g1 = lerpRgb(a.gradient[1], b.gradient[1], t);
  const g2 = lerpRgb(a.gradient[2], b.gradient[2], t);

  return {
    gradientCss: `linear-gradient(135deg, ${rgbToCss(g0)} 0%, ${rgbToCss(g1)} 48%, ${rgbToCss(g2)} 100%)`,
    orb1: lerpRgb(a.orb1, b.orb1, t),
    orb2: lerpRgb(a.orb2, b.orb2, t),
    orb1Opacity: lerp(a.orb1Opacity, b.orb1Opacity, t),
    orb2Opacity: lerp(a.orb2Opacity, b.orb2Opacity, t),
    warmGlowOpacity: lerp(a.warmGlowOpacity, b.warmGlowOpacity, t),
    accentSoft: lerpRgb(a.accentSoft, b.accentSoft, t),
    accentBright: lerpRgb(a.accentBright, b.accentBright, t),
    progressFrom: lerpRgb(a.progressFrom, b.progressFrom, t),
    progressTo: lerpRgb(a.progressTo, b.progressTo, t),
  };
}

type SkyCardTheme = ReturnType<typeof interpolateSkyCardTheme>;

function SkyDecorOrbs({ sky }: { sky: SkyCardTheme }) {
  return (
    <>
      {sky.warmGlowOpacity > 0.03 && (
        <div
          className="pointer-events-none absolute -top-[20%] left-[10%] h-[85%] w-[90%] rounded-full blur-[64px]"
          style={{
            background: `radial-gradient(ellipse 70% 50% at 40% 15%, rgba(255,218,148,${sky.warmGlowOpacity}) 0%, rgba(255,165,100,${sky.warmGlowOpacity * 0.4}) 30%, transparent 62%)`,
          }}
        />
      )}
      <div
        className="pointer-events-none absolute -top-10 -right-10 h-52 w-52 rounded-full transition-opacity duration-[3000ms]"
        style={{ backgroundColor: rgbToCss(sky.orb1), opacity: sky.orb1Opacity }}
      />
      <div
        className="pointer-events-none absolute -bottom-8 -left-8 h-36 w-36 rounded-full transition-opacity duration-[3000ms]"
        style={{ backgroundColor: rgbToCss(sky.orb2), opacity: sky.orb2Opacity }}
      />
    </>
  );
}

export const TodayScheduleCard = () => {
  const [schedule, setSchedule] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const todayKey = JS_DAY_TO_KEY[new Date().getDay()];
  const todayName = DAY_NAMES[todayKey];

  useEffect(() => {
    fetchTodaySchedule();
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
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

  const timeString = currentTime.toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const dateString = currentTime.toLocaleDateString('pt-BR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const sky = interpolateSkyCardTheme(minuteOfDay(currentTime));

  if (isLoading) {
    return (
      <div
        className="relative overflow-hidden rounded-2xl p-6 animate-pulse text-white shadow-xl transition-[background] duration-[2500ms] ease-out"
        style={{ background: sky.gradientCss }}
      >
        <SkyDecorOrbs sky={sky} />
        <div className="relative z-[1] h-8 w-32 bg-white/20 rounded mb-3" />
        <div className="relative z-[1] h-4 w-48 bg-white/20 rounded" />
      </div>
    );
  }

  // Folga
  if (!schedule) {
    return (
      <div
        className="relative overflow-hidden rounded-2xl p-6 text-white shadow-xl transition-[background] duration-[2500ms] ease-out"
        style={{ background: sky.gradientCss }}
      >
        <SkyDecorOrbs sky={sky} />
        <div className="relative z-[1] flex items-center gap-3 mb-4">
          <Moon className="h-5 w-5" style={{ color: rgbToCss(sky.accentSoft), opacity: 0.6 }} />
          <span className="text-xs font-semibold uppercase tracking-widest text-white/40">{todayName}</span>
        </div>
        <p className="relative z-[1] text-2xl font-bold">{timeString}</p>
        <p className="relative z-[1] text-white/60 mt-1 text-sm">
          Você está de <strong className="text-white">folga</strong> hoje. Aproveite! 🌙
        </p>
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

  const remaining =
    status === 'working'
      ? getRemainingTime(schedule.work_end_time, currentTime)
      : null;

  const untilStart =
    status === 'before'
      ? getTimeUntilStart(schedule.work_start_time, currentTime)
      : null;

  const statusConfig = {
    before:  { label: 'Expediente não iniciado', color: 'text-yellow-300',  dot: 'bg-yellow-400' },
    working: { label: 'Em expediente',           color: 'text-emerald-300', dot: 'bg-emerald-400 animate-pulse' },
    after:   { label: 'Expediente encerrado',    color: 'text-white/50',    dot: 'bg-white/40' },
  };
  const cfg = statusConfig[status];

  return (
    <div
      className="relative overflow-hidden rounded-2xl text-white shadow-2xl transition-[background] duration-[2500ms] ease-out"
      style={{ background: sky.gradientCss }}
    >
      <SkyDecorOrbs sky={sky} />

      <div className="relative z-[1] p-5 sm:p-6">
        {/* Badge de status + data */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
            <span className={cn('h-2 w-2 rounded-full flex-shrink-0', cfg.dot)} />
            <span className={cn('text-xs font-semibold', cfg.color)}>{cfg.label}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-white/40">
            <CalendarDays className="h-3.5 w-3.5" />
            <span className="text-xs">{todayName}, {dateString}</span>
          </div>
        </div>

        {/* Hora principal */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-5xl font-black tabular-nums tracking-tight leading-none">
              {timeString}
            </p>
            <p className="text-white/40 text-xs mt-1 sm:hidden">{todayName}, {dateString}</p>
          </div>

          {remaining && (
            <div className="flex flex-col items-start sm:items-end gap-1">
              <div className="flex items-center gap-1.5 text-white/50">
                <Timer className="h-3.5 w-3.5" />
                <span className="text-[11px] uppercase tracking-wider">Faltam para terminar</span>
              </div>
              <span
                className="text-2xl font-bold tabular-nums leading-none transition-colors duration-[2500ms]"
                style={{ color: rgbToCss(sky.accentBright) }}
              >
                {remaining}
              </span>
            </div>
          )}

          {untilStart && (
            <div className="flex flex-col items-start sm:items-end gap-1">
              <div className="flex items-center gap-1.5 text-white/50">
                <Timer className="h-3.5 w-3.5" />
                <span className="text-[11px] uppercase tracking-wider">Expediente começa em</span>
              </div>
              <span className="text-2xl font-bold tabular-nums text-yellow-300 leading-none">
                {untilStart}
              </span>
            </div>
          )}

          {status === 'after' && (
            <div className="flex flex-col items-start sm:items-end gap-1">
              <span className="text-[11px] uppercase tracking-wider text-white/40">Expediente encerrado</span>
              <span className="text-sm font-semibold text-white/50">
                {formatTime(schedule.work_start_time)} – {formatTime(schedule.work_end_time)}
              </span>
            </div>
          )}
        </div>

        {/* Detalhes do turno */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-5 pt-4 border-t border-white/10">
          <div className="flex items-center gap-1.5">
            <Clock
              className="h-3.5 w-3.5 transition-colors duration-[2500ms]"
              style={{ color: rgbToCss(sky.accentSoft) }}
            />
            <span className="text-[10px] text-white/50 uppercase tracking-wide">Expediente</span>
            <span className="text-sm font-semibold tabular-nums ml-1">
              {formatTime(schedule.work_start_time)} – {formatTime(schedule.work_end_time)}
            </span>
          </div>
          {schedule.break_start_time && schedule.break_end_time && (
            <div className="flex items-center gap-1.5">
              <Coffee
                className="h-3.5 w-3.5 transition-colors duration-[2500ms]"
                style={{ color: rgbToCss(sky.accentSoft) }}
              />
              <span className="text-[10px] text-white/50 uppercase tracking-wide">Intervalo</span>
              <span className="text-sm font-semibold tabular-nums ml-1">
                {formatTime(schedule.break_start_time)} – {formatTime(schedule.break_end_time)}
              </span>
            </div>
          )}

          {(status === 'working' || status === 'after') && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[10px] text-white/40">{progress}% concluído</span>
            </div>
          )}
        </div>

        {/* Barra de progresso */}
        {(status === 'working' || status === 'after') && (
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-white/30 mb-1.5">
              <span>{formatTime(schedule.work_start_time)}</span>
              <span>{formatTime(schedule.work_end_time)}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-1000',
                  status === 'after' && 'bg-white/30'
                )}
                style={
                  status === 'after'
                    ? { width: `${progress}%` }
                    : {
                        width: `${progress}%`,
                        background: `linear-gradient(to right, ${rgbToCss(sky.progressFrom)}, ${rgbToCss(sky.progressTo)})`,
                      }
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
