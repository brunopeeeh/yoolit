-- Grant permissions for authenticated users to insert and select from status_changes
GRANT SELECT, INSERT ON TABLE public.status_changes TO authenticated;

-- Grant all permissions to service_role (used by edge functions)
GRANT ALL ON TABLE public.status_changes TO service_role;