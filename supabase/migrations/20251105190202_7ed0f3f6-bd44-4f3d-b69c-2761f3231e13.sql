-- Restaurar role de admin para daniel.braga@yooga.com.br
INSERT INTO public.user_roles (user_id, role, created_by)
VALUES ('48a6f424-7e4a-48a4-baf9-fe165f0ee7d4', 'admin', '48a6f424-7e4a-48a4-baf9-fe165f0ee7d4')
ON CONFLICT (user_id, role) DO NOTHING;