export interface DaySchedule {
  day_of_week: 'dom' | 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab';
  enabled: boolean;
  work_start_time: string;
  work_end_time: string;
  break_start_time: string | null;
  break_end_time: string | null;
  schedule_id?: string;
}

export const validateScheduleTimes = (schedule: DaySchedule): string[] => {
  const errors: string[] = [];
  
  if (!schedule.enabled) return errors;
  
  // Validar horários de trabalho
  if (!schedule.work_start_time || !schedule.work_end_time) {
    errors.push('Horário de trabalho é obrigatório');
    return errors;
  }
  
  if (schedule.work_end_time <= schedule.work_start_time) {
    errors.push('Horário de término deve ser após horário de início');
  }
  
  // Validar intervalo se definido
  if (schedule.break_start_time && schedule.break_end_time) {
    if (schedule.break_start_time <= schedule.work_start_time) {
      errors.push('Intervalo deve começar após o início do expediente');
    }
    if (schedule.break_end_time >= schedule.work_end_time) {
      errors.push('Intervalo deve terminar antes do fim do expediente');
    }
    if (schedule.break_end_time <= schedule.break_start_time) {
      errors.push('Fim do intervalo deve ser após o início');
    }
  }
  
  return errors;
};
