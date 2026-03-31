
-- Table to log every chat message for audit purposes
CREATE TABLE public.chat_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  message_content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_usage_logs ENABLE ROW LEVEL SECURITY;

-- Users can insert their own logs
CREATE POLICY "Users can insert own chat logs"
  ON public.chat_usage_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view own logs
CREATE POLICY "Users can view own chat logs"
  ON public.chat_usage_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins and supervisors can view all logs for audit
CREATE POLICY "Admins can view all chat logs"
  ON public.chat_usage_logs FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role));

-- Add chat_target_count to tasks table for chat_usage type tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS chat_target_count integer DEFAULT NULL;
