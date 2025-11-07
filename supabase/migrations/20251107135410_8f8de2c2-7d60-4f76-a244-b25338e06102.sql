-- Allow agents to view approved task completions from all users for ranking
CREATE POLICY "Agents can view all approved task completions"
ON public.task_completions
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'agent'::app_role) 
  AND status = 'approved'
);

-- Allow agents to view all profiles for ranking display
CREATE POLICY "Agents can view all profiles for ranking"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'agent'::app_role));