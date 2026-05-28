import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY; // Using anon key for mock

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMock() {
  const mockUpdate = {
    title: 'Nova Integrante: Suporte Financeiro',
    ai_summary: `A partir de hoje, o suporte financeiro conta com uma nova integrante: **Vitória Araújo**.

- Ela tem experiência em grandes empresas capixabas.
- Além do suporte interno, ela atuará em campo nos clientes que a Delivery atender.
- A equipe passará por uma readaptação de fluxo.
- Vitória está alocada nas mesas perto da Rafa e Pâmela.

*Sejam gentis e dêem as boas-vindas!*`,
    category: 'aviso',
    content: "Turminha, bom dia! A partir de hoje o suporte financeiro de vocês muda de rosto. Quero apresentar a @Vitoria Araujo. Com passagens pelas gigantes capixabas (...) Além de nos ajudar, ela também vai estar em campo nos clientes que a Delivery for. Então por favor não nos matem do coração, que estaremos nos readaptando ao fluxo de novo. Sejam gentis com ela :P Ah: Ela tá sentando nas mesas perto da Rafa e Pâmela. @Vitoria Araujo seja super bem vinda",
    author_name: 'Equipe Delivery',
    slack_ts: Date.now().toString(),
    attachments: []
  };

  const { data, error } = await supabase
    .from('system_updates')
    .insert([mockUpdate])
    .select();

  if (error) {
    console.error('Erro ao inserir mock:', error);
  } else {
    console.log('Mock inserido com sucesso:', data);
  }
}

runMock();
