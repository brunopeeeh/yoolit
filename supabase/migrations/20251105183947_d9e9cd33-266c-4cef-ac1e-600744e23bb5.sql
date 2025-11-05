-- Enable realtime for shift_swap_requests table
ALTER TABLE public.shift_swap_requests REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.shift_swap_requests;