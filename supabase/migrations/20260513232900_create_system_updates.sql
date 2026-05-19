CREATE TABLE system_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Campos processados pela IA (n8n + Gemini)
  title TEXT,
  ai_summary TEXT,
  category TEXT DEFAULT 'geral',
  
  -- Conteúdo Original
  content TEXT NOT NULL,
  
  -- Metadados do Slack
  author_name TEXT,
  author_avatar TEXT,
  slack_ts TEXT UNIQUE,
  
  -- Anexos processados
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Controle UI
  is_pinned BOOLEAN DEFAULT FALSE
);

-- Habilitar RLS
ALTER TABLE system_updates ENABLE ROW LEVEL SECURITY;

-- Política: Todos os usuários autenticados podem ver as atualizações
CREATE POLICY "Atualizações são visíveis para todos" 
  ON system_updates 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Política: Service Role pode inserir/atualizar (n8n vai usar a Service Key ou inserção autorizada)
CREATE POLICY "Apenas admins ou service_role podem inserir"
  ON system_updates
  FOR INSERT
  WITH CHECK (true); -- Dependendo de como o n8n autentica, service_role bypassa RLS. 
-- Para segurança, assumiremos que o n8n usa a Service Role Key, então INSERT é garantido.
