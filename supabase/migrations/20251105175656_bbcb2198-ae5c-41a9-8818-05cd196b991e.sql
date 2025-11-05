-- Create shift_swap_requests table (usando tipo swap_request_status existente)
CREATE TABLE IF NOT EXISTS public.shift_swap_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requester_shift_id uuid NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  target_shift_id uuid NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  reason text NOT NULL,
  status swap_request_status NOT NULL DEFAULT 'pending',
  payment_scheduled_for timestamp with time zone,
  reviewed_by uuid REFERENCES public.profiles(id),
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shift_swap_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own swap requests"
  ON public.shift_swap_requests
  FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = target_id);

CREATE POLICY "Users can create swap requests"
  ON public.shift_swap_requests
  FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update their own pending requests"
  ON public.shift_swap_requests
  FOR UPDATE
  USING (auth.uid() = requester_id AND status = 'pending');

CREATE POLICY "Admins and supervisors can view all requests"
  ON public.shift_swap_requests
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'supervisor'::app_role)
  );

CREATE POLICY "Admins and supervisors can update requests"
  ON public.shift_swap_requests
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'supervisor'::app_role)
  );

-- Create trigger for updated_at
CREATE TRIGGER update_shift_swap_requests_updated_at
  BEFORE UPDATE ON public.shift_swap_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_shift_swap_requests_requester ON public.shift_swap_requests(requester_id);
CREATE INDEX idx_shift_swap_requests_target ON public.shift_swap_requests(target_id);
CREATE INDEX idx_shift_swap_requests_status ON public.shift_swap_requests(status);
CREATE INDEX idx_shift_swap_requests_created_at ON public.shift_swap_requests(created_at DESC);