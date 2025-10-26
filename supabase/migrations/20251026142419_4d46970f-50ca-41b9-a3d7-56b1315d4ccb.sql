-- Add status column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN status TEXT DEFAULT 'available';

-- Add comment explaining the status field
COMMENT ON COLUMN public.profiles.status IS 'User current status: available, meeting, pause, water, external, feedback, yooga, unavailable';