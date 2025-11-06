-- Add target approval tracking to shift swap requests
ALTER TABLE shift_swap_requests 
ADD COLUMN target_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN target_approved_at TIMESTAMP WITH TIME ZONE;

-- Update existing approved requests to have target_approved = true
UPDATE shift_swap_requests 
SET target_approved = TRUE 
WHERE status = 'approved';