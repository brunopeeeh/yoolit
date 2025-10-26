-- Função para validar email do domínio @yooga.com.br
CREATE OR REPLACE FUNCTION public.validate_yooga_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email NOT LIKE '%@yooga.com.br' THEN
    RAISE EXCEPTION 'Apenas emails do domínio @yooga.com.br são permitidos';
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger para validar email antes de criar usuário
CREATE TRIGGER validate_email_domain
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_yooga_email();