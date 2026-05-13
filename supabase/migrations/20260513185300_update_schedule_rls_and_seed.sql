-- 1. Permitir que usuarios logados (authenticated) visualizem todas as escalas
CREATE POLICY "Authenticated users can view all schedules"
  ON public.agent_schedules
  FOR SELECT
  TO authenticated
  USING (true);

-- 2. Inserir algumas escalas ficticias em 'agent_schedules' para usuarios existentes
-- Vamos pegar os 3 primeiros usuarios que existam na tabela profiles para popular

INSERT INTO public.agent_schedules (user_id, day_of_week, work_start_time, work_end_time, break_start_time, break_end_time)
SELECT id, 'seg', '08:00:00', '18:00:00', '12:00:00', '13:00:00' FROM public.profiles LIMIT 3
ON CONFLICT (user_id, day_of_week) DO NOTHING;

INSERT INTO public.agent_schedules (user_id, day_of_week, work_start_time, work_end_time, break_start_time, break_end_time)
SELECT id, 'ter', '08:00:00', '18:00:00', '12:00:00', '13:00:00' FROM public.profiles LIMIT 3
ON CONFLICT (user_id, day_of_week) DO NOTHING;

INSERT INTO public.agent_schedules (user_id, day_of_week, work_start_time, work_end_time, break_start_time, break_end_time)
SELECT id, 'qua', '08:00:00', '18:00:00', '12:00:00', '13:00:00' FROM public.profiles LIMIT 3
ON CONFLICT (user_id, day_of_week) DO NOTHING;
