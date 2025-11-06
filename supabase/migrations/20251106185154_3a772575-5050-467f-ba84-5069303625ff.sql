-- Add links column to task_completions table
ALTER TABLE public.task_completions 
ADD COLUMN links text;

COMMENT ON COLUMN public.task_completions.links IS 'Optional links provided by the agent when completing the task';