-- Drop existing agent-only policies
DROP POLICY IF EXISTS "Agents can view all approved task completions" ON public.task_completions;
DROP POLICY IF EXISTS "Agents can view all profiles for ranking" ON public.profiles;

-- Allow all authenticated users to view approved task completions for ranking
CREATE POLICY "All users can view approved task completions for ranking"
ON public.task_completions
FOR SELECT
TO authenticated
USING (status = 'approved');

-- Allow all authenticated users to view all profiles for ranking
CREATE POLICY "All users can view profiles for ranking"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);