CREATE POLICY "Admins and supervisors can insert task completions"
ON public.task_completions
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role));