-- Add task type and checklist support
ALTER TABLE public.tasks 
ADD COLUMN task_type text NOT NULL DEFAULT 'simple',
ADD COLUMN checklist_items jsonb DEFAULT NULL;

-- Add constraint for task_type
ALTER TABLE public.tasks 
ADD CONSTRAINT task_type_check CHECK (task_type IN ('simple', 'checklist'));

-- Add completed items tracking in task_completions
ALTER TABLE public.task_completions 
ADD COLUMN completed_items jsonb DEFAULT NULL;

-- Update existing tasks to be 'simple' type
UPDATE public.tasks SET task_type = 'simple' WHERE task_type IS NULL;