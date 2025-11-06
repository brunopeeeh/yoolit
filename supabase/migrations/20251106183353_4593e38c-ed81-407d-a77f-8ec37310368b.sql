-- Drop existing foreign keys that reference auth.users
ALTER TABLE public.task_completions
  DROP CONSTRAINT IF EXISTS task_completions_user_id_fkey,
  DROP CONSTRAINT IF EXISTS task_completions_verified_by_fkey;

ALTER TABLE public.reward_purchases
  DROP CONSTRAINT IF EXISTS reward_purchases_user_id_fkey,
  DROP CONSTRAINT IF EXISTS reward_purchases_delivered_by_fkey;

ALTER TABLE public.agent_wallets
  DROP CONSTRAINT IF EXISTS agent_wallets_user_id_fkey;

ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS tasks_created_by_fkey;

ALTER TABLE public.reward_items
  DROP CONSTRAINT IF EXISTS reward_items_created_by_fkey;

-- Add new foreign keys that reference profiles
ALTER TABLE public.task_completions
  ADD CONSTRAINT task_completions_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE public.task_completions
  ADD CONSTRAINT task_completions_verified_by_fkey 
  FOREIGN KEY (verified_by) 
  REFERENCES public.profiles(id);

ALTER TABLE public.reward_purchases
  ADD CONSTRAINT reward_purchases_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE public.reward_purchases
  ADD CONSTRAINT reward_purchases_delivered_by_fkey 
  FOREIGN KEY (delivered_by) 
  REFERENCES public.profiles(id);

ALTER TABLE public.agent_wallets
  ADD CONSTRAINT agent_wallets_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_created_by_fkey 
  FOREIGN KEY (created_by) 
  REFERENCES public.profiles(id);

ALTER TABLE public.reward_items
  ADD CONSTRAINT reward_items_created_by_fkey 
  FOREIGN KEY (created_by) 
  REFERENCES public.profiles(id);