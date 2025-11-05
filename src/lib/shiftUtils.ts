// Utilitários para gerenciamento de turnos

export type ShiftType = 'morning' | 'afternoon' | 'night';

/**
 * Determina o tipo de turno baseado no horário de início
 * Manhã: 01:00-12:00
 * Tarde: 13:00-17:00  
 * Noite: 18:00-23:00
 */
export const getShiftType = (startTime: string): ShiftType => {
  const hour = parseInt(startTime.split(':')[0]);
  
  if (hour >= 1 && hour <= 12) {
    return 'morning';
  } else if (hour >= 13 && hour <= 17) {
    return 'afternoon';
  } else {
    return 'night';
  }
};

/**
 * Formata o tipo de turno para exibição
 */
export const formatShiftType = (type: ShiftType): string => {
  const types = {
    morning: 'Manhã',
    afternoon: 'Tarde',
    night: 'Noite'
  };
  return types[type];
};

/**
 * Retorna os dias da semana em português
 */
export const getDayOfWeekName = (dayOfWeek: string): string => {
  const days: Record<string, string> = {
    'dom': 'Domingo',
    'seg': 'Segunda',
    'ter': 'Terça',
    'qua': 'Quarta',
    'qui': 'Quinta',
    'sex': 'Sexta',
    'sab': 'Sábado'
  };
  return days[dayOfWeek] || dayOfWeek;
};

/**
 * Converte dia da semana em português para número (0-6)
 */
export const dayOfWeekToNumber = (dayOfWeek: string): number => {
  const days: Record<string, number> = {
    'dom': 0,
    'seg': 1,
    'ter': 2,
    'qua': 3,
    'qui': 4,
    'sex': 5,
    'sab': 6
  };
  return days[dayOfWeek] ?? 0;
};
