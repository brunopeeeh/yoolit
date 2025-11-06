-- Add DELETE policies for shift_swap_requests

-- Allow requesters to delete their own pending requests
CREATE POLICY "Users can delete their own pending requests"
ON shift_swap_requests
FOR DELETE
TO authenticated
USING (
  auth.uid() = requester_id 
  AND status = 'pending'
);

-- Allow admins to delete any requests
CREATE POLICY "Admins can delete any requests"
ON shift_swap_requests
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
);