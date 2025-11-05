-- Criar função RLS para buscar schedules de agentes para trocas
CREATE OR REPLACE FUNCTION public.list_agent_schedules_for_swaps()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  day_of_week text,
  work_start_time time,
  work_end_time time,
  break_start_time time,
  break_end_time time
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id, 
    user_id, 
    day_of_week, 
    work_start_time, 
    work_end_time,
    break_start_time,
    break_end_time
  FROM public.agent_schedules
  ORDER BY 
    CASE day_of_week
      WHEN 'dom' THEN 0
      WHEN 'seg' THEN 1
      WHEN 'ter' THEN 2
      WHEN 'qua' THEN 3
      WHEN 'qui' THEN 4
      WHEN 'sex' THEN 5
      WHEN 'sab' THEN 6
    END;
$$;

GRANT EXECUTE ON FUNCTION public.list_agent_schedules_for_swaps() TO authenticated;

-- Adicionar novos campos para data e informações de schedule
ALTER TABLE public.shift_swap_requests 
  ADD COLUMN IF NOT EXISTS swap_date DATE,
  ADD COLUMN IF NOT EXISTS requester_schedule_id UUID REFERENCES public.agent_schedules(id),
  ADD COLUMN IF NOT EXISTS target_schedule_id UUID REFERENCES public.agent_schedules(id);

-- Tornar os campos antigos opcionais (nullable) para compatibilidade
ALTER TABLE public.shift_swap_requests 
  ALTER COLUMN requester_shift_id DROP NOT NULL,
  ALTER COLUMN target_shift_id DROP NOT NULL;

-- Adicionar comentários para documentar o uso dos campos
COMMENT ON COLUMN public.shift_swap_requests.swap_date IS 'Data da troca quando usando sistema baseado em horários semanais';
COMMENT ON COLUMN public.shift_swap_requests.requester_schedule_id IS 'Referência ao horário semanal do solicitante';
COMMENT ON COLUMN public.shift_swap_requests.target_schedule_id IS 'Referência ao horário semanal do agente alvo';