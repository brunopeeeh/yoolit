-- Add completion_rules column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN completion_rules text;