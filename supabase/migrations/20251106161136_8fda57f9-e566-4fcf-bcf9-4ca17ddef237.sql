-- Create swap_credits table to track swap payment credits
CREATE TABLE public.swap_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creditor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  debtor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  swap_request_id UUID NOT NULL REFERENCES public.shift_swap_requests(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'redeemed')),
  scheduled_payment_date DATE,
  scheduled_payment_time TIME,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  redeemed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.swap_credits ENABLE ROW LEVEL SECURITY;

-- Users can view their own credits (as creditor or debtor)
CREATE POLICY "Users can view their own credits"
ON public.swap_credits
FOR SELECT
TO authenticated
USING (
  auth.uid() = creditor_id 
  OR auth.uid() = debtor_id
);

-- Admins and supervisors can view all credits
CREATE POLICY "Admins and supervisors can view all credits"
ON public.swap_credits
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'supervisor'::app_role)
);

-- Users can create credits when approving swaps
CREATE POLICY "Users can create credits"
ON public.swap_credits
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = creditor_id
);

-- Admins and supervisors can manage all credits
CREATE POLICY "Admins and supervisors can manage credits"
ON public.swap_credits
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'supervisor'::app_role)
);

-- Creditors can redeem their own credits
CREATE POLICY "Creditors can redeem credits"
ON public.swap_credits
FOR UPDATE
TO authenticated
USING (
  auth.uid() = creditor_id
  AND status = 'pending'
);

-- Create index for performance
CREATE INDEX idx_swap_credits_creditor ON public.swap_credits(creditor_id);
CREATE INDEX idx_swap_credits_debtor ON public.swap_credits(debtor_id);
CREATE INDEX idx_swap_credits_status ON public.swap_credits(status);

-- Trigger to update updated_at
CREATE TRIGGER update_swap_credits_updated_at
BEFORE UPDATE ON public.swap_credits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();