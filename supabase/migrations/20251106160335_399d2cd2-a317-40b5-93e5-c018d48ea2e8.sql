-- Drop the existing admin-only delete policy
DROP POLICY IF EXISTS "Admins can delete any requests" ON public.shift_swap_requests;

-- Create new policy allowing both admins and supervisors to delete any requests
CREATE POLICY "Admins and supervisors can delete any requests"
ON public.shift_swap_requests
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'supervisor'::app_role)
);