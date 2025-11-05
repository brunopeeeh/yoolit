-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Allow admins to view all status changes
CREATE POLICY "Admins can view all status changes globally"
ON public.status_changes
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));