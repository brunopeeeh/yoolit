-- Allow targets to pre-approve their own pending swap requests
CREATE POLICY "Targets can pre-approve their own pending requests"
ON public.shift_swap_requests
FOR UPDATE
TO authenticated
USING (
  auth.uid() = target_id
  AND status = 'pending'::swap_request_status
)
WITH CHECK (
  auth.uid() = target_id
  AND status = 'pending'::swap_request_status
);