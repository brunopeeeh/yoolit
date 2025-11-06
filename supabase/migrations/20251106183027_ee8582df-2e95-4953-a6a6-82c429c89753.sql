-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  points INTEGER NOT NULL DEFAULT 0,
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create task_completions table
CREATE TABLE public.task_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  UNIQUE(task_id, user_id)
);

-- Create agent_wallets table
CREATE TABLE public.agent_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reward_items table
CREATE TABLE public.reward_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cost INTEGER NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('coupon', 'giftcard', 'time_off', 'lunch', 'early_leave', 'physical_prize')),
  stock INTEGER,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reward_purchases table
CREATE TABLE public.reward_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reward_id UUID NOT NULL REFERENCES public.reward_items(id),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'delivered', 'cancelled')),
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  delivered_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks
CREATE POLICY "Admins and supervisors can manage tasks"
  ON public.tasks FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role));

CREATE POLICY "Agents can view active tasks"
  ON public.tasks FOR SELECT
  USING (is_active = true AND has_role(auth.uid(), 'agent'::app_role));

-- RLS Policies for task_completions
CREATE POLICY "Admins and supervisors can view all completions"
  ON public.task_completions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role));

CREATE POLICY "Admins and supervisors can verify completions"
  ON public.task_completions FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role));

CREATE POLICY "Agents can create task completions"
  ON public.task_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'agent'::app_role));

CREATE POLICY "Agents can view their own completions"
  ON public.task_completions FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for agent_wallets
CREATE POLICY "Users can view their own wallet"
  ON public.agent_wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins and supervisors can view all wallets"
  ON public.agent_wallets FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role));

CREATE POLICY "Admins and supervisors can manage wallets"
  ON public.agent_wallets FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role));

CREATE POLICY "Users can create their own wallet"
  ON public.agent_wallets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for reward_items
CREATE POLICY "Everyone can view active rewards"
  ON public.reward_items FOR SELECT
  USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role));

CREATE POLICY "Admins and supervisors can manage rewards"
  ON public.reward_items FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role));

-- RLS Policies for reward_purchases
CREATE POLICY "Users can view their own purchases"
  ON public.reward_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins and supervisors can view all purchases"
  ON public.reward_purchases FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role));

CREATE POLICY "Users can create purchases"
  ON public.reward_purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins and supervisors can update purchases"
  ON public.reward_purchases FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role));

-- Create triggers for updated_at
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_wallets_updated_at
  BEFORE UPDATE ON public.agent_wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reward_items_updated_at
  BEFORE UPDATE ON public.reward_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update wallet when task completion is approved
CREATE OR REPLACE FUNCTION public.handle_task_completion_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  task_points INTEGER;
BEGIN
  -- Only process when status changes to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Get the points for this task
    SELECT points INTO task_points
    FROM public.tasks
    WHERE id = NEW.task_id;
    
    -- Update or create wallet entry
    INSERT INTO public.agent_wallets (user_id, points, total_earned)
    VALUES (NEW.user_id, task_points, task_points)
    ON CONFLICT (user_id) 
    DO UPDATE SET
      points = agent_wallets.points + task_points,
      total_earned = agent_wallets.total_earned + task_points,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_task_completion_approved
  AFTER INSERT OR UPDATE ON public.task_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_task_completion_approval();

-- Function to handle reward purchase
CREATE OR REPLACE FUNCTION public.handle_reward_purchase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Deduct points from wallet
  UPDATE public.agent_wallets
  SET 
    points = points - NEW.points_spent,
    total_spent = total_spent + NEW.points_spent,
    updated_at = now()
  WHERE user_id = NEW.user_id;
  
  -- Decrease stock if applicable
  UPDATE public.reward_items
  SET stock = stock - 1
  WHERE id = NEW.reward_id AND stock IS NOT NULL;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_reward_purchase
  AFTER INSERT ON public.reward_purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_reward_purchase();