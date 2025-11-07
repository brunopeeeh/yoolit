-- Add purchase rules to reward_items table
ALTER TABLE public.reward_items 
ADD COLUMN max_purchases_per_user INTEGER,
ADD COLUMN max_uses_per_month INTEGER;

COMMENT ON COLUMN public.reward_items.max_purchases_per_user IS 'Maximum number of times a user can purchase this reward (null = unlimited)';
COMMENT ON COLUMN public.reward_items.max_uses_per_month IS 'Maximum number of times a user can use this reward per month (null = unlimited)';