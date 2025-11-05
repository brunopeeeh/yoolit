-- Fix search_path for security on existing functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_shift_swap_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.shift_swap_history (swap_request_id, changed_by, action, new_status)
    VALUES (NEW.id, NEW.requester_id, 'created', NEW.status::text);
  ELSIF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
    INSERT INTO public.shift_swap_history (swap_request_id, changed_by, action, old_status, new_status)
    VALUES (
      NEW.id, 
      auth.uid(), 
      CASE 
        WHEN NEW.status = 'approved' THEN 'approved'::swap_action
        WHEN NEW.status = 'rejected' THEN 'rejected'::swap_action
        WHEN NEW.status = 'completed' THEN 'completed'::swap_action
        WHEN NEW.status = 'cancelled' THEN 'cancelled'::swap_action
        ELSE 'created'::swap_action
      END,
      OLD.status::text,
      NEW.status::text
    );
  END IF;
  RETURN NEW;
END;
$function$;