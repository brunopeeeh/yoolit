# 🤖 Maya - Sistema Inteligente de Atendimento e Gestão

**Maya** é uma plataforma completa que combina assistente virtual inteligente com sistema de gerenciamento de escalas, trocas de turnos e gamificação para equipes de atendimento.

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Funcionalidades Principais](#-funcionalidades-principais)
  - [Chat Inteligente](#1-chat-inteligente-maya)
  - [Gerenciamento de Status](#2-gerenciamento-de-status)
  - [Sistema de Gamificação](#3-sistema-de-gamificação)
  - [Gestão de Trocas de Turnos](#4-gestão-de-trocas-de-turnos)
  - [Dashboard Administrativo](#5-dashboard-administrativo)
- [Como Usar](#-como-usar)
- [Configuração](#-configuração)
- [Tecnologias](#-tecnologias)

---

## 🎯 Visão Geral

Maya é uma assistente virtual desenvolvida para auxiliar agentes de atendimento em seu dia a dia. A plataforma oferece:

- **Assistente Virtual Inteligente** integrada com N8N para automação de processos
- **Gestão de Status em Tempo Real** para melhor visibilidade da equipe
- **Sistema de Gamificação** com tarefas, pontos e recompensas
- **Gerenciamento de Escalas** e trocas de turnos simplificado
- **Dashboard Completo** para supervisores e administradores

---

## 🚀 Funcionalidades Principais

### 1. Chat Inteligente (Maya)

A Maya é sua assistente pessoal que auxilia no atendimento ao cliente.

#### ✨ Características:
- **Integração com N8N**: Processamento inteligente de mensagens
- **Respostas Contextualizadas**: Baseadas no seu status atual
- **Comandos do Sistema**:
  - `/version` - Exibe a versão do sistema
  - `/clear` - Limpa o histórico de conversas
  - `/help` - Lista todos os comandos disponíveis
  - `/status` - Mostra informações do sistema

#### 📝 Como Usar:
1. Faça login no sistema
2. Digite sua mensagem ou dúvida no campo de texto
3. Maya processará e responderá com informações relevantes
4. Use os comandos especiais quando necessário

---

### 2. Gerenciamento de Status

Mantenha sua equipe informada sobre sua disponibilidade em tempo real.

#### 📊 Status Disponíveis:

| Status | Descrição | Ícone |
|--------|-----------|-------|
| **Feedback** | Em feedback com supervisor | 💬 |
| **Reunião/Treinamento** | Participando de reunião ou treinamento | 👥 |
| **Yooga Timer⭐** | Pausa especial Yooga | ☕ |
| **Pausa - Aprovada** | Em pausa aprovada | ⏰ |
| **Água/Banheiro** | Necessidades básicas | 💧 |
| **Demandas Externas** | Atendendo demandas externas | 🔗 |
| **Disponível** | Pronto para atender | ✅ |
| **Indisponível** | Temporariamente indisponível | ❌ |

#### 🔄 Como Alterar Status:
1. Clique no ícone de usuário no canto superior direito
2. Selecione o status desejado na lista
3. Seu status será atualizado em tempo real para toda equipe

---

### 3. Sistema de Gamificação

Engaje sua equipe com tarefas, pontos e recompensas.

#### 🎮 Componentes do Sistema:

##### **Para Agentes:**

**Tarefas Disponíveis**
- Visualize todas as tarefas atribuídas
- Veja tarefas simples ou com checklist
- Acompanhe prazos e pontuação
- Complete tarefas e envie comprovantes

**Carteira de Pontos**
- Acompanhe seu saldo de pontos
- Veja histórico de ganhos
- Consulte pontos disponíveis para resgate

**Loja de Recompensas**
- **Cupons**: Descontos em estabelecimentos parceiros
- **Gift Cards**: Cartões presente
- **Folgas**: Dias de folga extra
- **Almoços**: Vouchers de alimentação
- **Saídas Antecipadas**: Saia mais cedo do trabalho
- **Prêmios Físicos**: Produtos e brindes

**Ranking**
- Veja sua posição entre os agentes
- Compare seus pontos com a equipe
- Motive-se a alcançar melhores resultados

##### **Para Supervisores/Admins:**

**Gerenciamento de Tarefas**
- Crie tarefas simples ou com checklist
- Defina pontos para cada tarefa
- Estabeleça prazos
- Aprove ou rejeite conclusões de tarefas
- Visualize comprovantes enviados

**Gerenciamento de Recompensas**
- Cadastre novas recompensas
- Defina custo em pontos
- Configure estoque disponível
- Estabeleça limites de compra por usuário
- Controle compras mensais
- Visualize histórico de resgates

#### 💰 Como Funciona:
1. **Complete Tarefas**: Realize as tarefas atribuídas
2. **Ganhe Pontos**: Receba pontos ao concluir tarefas
3. **Troque por Recompensas**: Use seus pontos na loja
4. **Suba no Ranking**: Compete com seus colegas

---

### 4. Gestão de Trocas de Turnos

Sistema completo para gerenciar trocas de escalas entre agentes.

#### 🔄 Funcionalidades:

##### **Solicitação de Troca**
1. **Criar Nova Solicitação**:
   - Selecione o agente com quem deseja trocar
   - Escolha a data da troca
   - Informe o motivo
   - Aguarde aprovação

2. **Tipos de Aprovação**:
   - **Aprovação Dupla**: Ambos agentes precisam concordar
   - **Pré-aprovação**: Supervisor aprova antecipadamente

##### **Créditos de Troca**
Quando você cobre o turno de alguém, você ganha um crédito que pode ser:

- **Resgate Imediato**: Adicionar pontos à sua carteira
- **Agendamento**: Receber de volta em data futura
  - Escolha a data de pagamento
  - Sistema cria automaticamente solicitação pré-aprovada
  - Você garante a reposição do turno

##### **Status das Trocas**
- 🟡 **Pendente**: Aguardando aprovação
- 🟢 **Aprovada**: Aprovada pelo alvo
- ✅ **Confirmada**: Confirmada pelo supervisor
- ❌ **Rejeitada**: Recusada
- 🔵 **Pré-aprovada**: Aprovada previamente pelo supervisor

##### **Calendário de Trocas**
- Visualize todas as trocas do mês
- Veja trocas por status (aprovadas, pendentes, etc.)
- Acompanhe detalhes de cada troca
- Identifique conflitos de escalas

#### 📅 Como Solicitar uma Troca:
1. Acesse o Dashboard → Aba "Trocas"
2. Clique em "Nova Solicitação"
3. Preencha os dados:
   - Agente alvo
   - Data da troca
   - Motivo
4. Envie a solicitação
5. Aguarde a aprovação do colega e supervisor

#### 💳 Como Usar Créditos:
1. Quando cobrir um turno, você receberá um crédito
2. Ao aprovar uma troca onde você é o alvo, escolha:
   - **Carteira**: Recebe pontos imediatamente
   - **Agendar**: Define data futura para receber o turno de volta
3. Créditos agendados viram solicitações pré-aprovadas automaticamente

---

### 5. Dashboard Administrativo

Painel completo para gestão da equipe (Supervisores e Admins).

#### 📊 Recursos:

##### **Dashboard Principal**
- **Estatísticas em Tempo Real**:
  - Agentes disponíveis vs. total
  - Trocas pendentes e aprovadas
  - Taxa de cobertura da equipe
  
- **Gráficos e Visualizações**:
  - Distribuição de status dos agentes
  - Histórico de trocas
  - Calendário de eventos

##### **Gerenciamento de Agentes**
- Cadastrar novos agentes
- Editar informações dos agentes
- Definir escalas de trabalho por dia da semana
- Configurar horários:
  - Início e fim do expediente
  - Horário de intervalo
- Gerenciar permissões e roles:
  - Admin (acesso total)
  - Supervisor (gestão de equipe)
  - Agent (usuário padrão)

##### **Gestão de Escalas**
- Visualizar escala semanal de todos os agentes
- Editar horários por dia da semana
- Identificar conflitos de horário
- Exportar escalas

##### **Controle de Trocas**
- Aprovar ou rejeitar solicitações
- Visualizar histórico completo
- Gerenciar créditos de troca
- Acompanhar trocas agendadas

##### **Ranking e Gamificação**
- Visualizar ranking geral de pontos
- Acompanhar conclusão de tarefas
- Gerenciar distribuição de recompensas
- Analisar engajamento da equipe

#### 🎯 Níveis de Acesso:

| Perfil | Permissões |
|--------|------------|
| **Admin** | Acesso total: gerenciar agentes, escalas, tarefas, recompensas e trocas |
| **Supervisor** | Aprovar trocas, gerenciar tarefas, visualizar dashboards |
| **Agent** | Usar chat, alterar status, solicitar trocas, completar tarefas, resgatar recompensas |

---

## 💡 Como Usar

### Primeiro Acesso

#### 1. **Criar Conta**
```
1. Clique no ícone de usuário no canto superior direito
2. Clique em "Não tem conta? Criar uma agora"
3. Preencha:
   - Nome completo
   - Email corporativo (@yooga.com.br)
   - Senha segura
4. Verifique seu email para confirmar a conta
```

#### 2. **Fazer Login**
```
1. Clique no ícone de usuário
2. Digite seu email e senha
3. Clique em "Entrar"
```

### Uso Diário

#### **Para Agentes:**
1. **Início do Expediente**:
   - Faça login no sistema
   - Altere status para "Disponível"
   - Verifique tarefas pendentes

2. **Durante o Expediente**:
   - Use Maya para tirar dúvidas
   - Atualize seu status conforme necessário
   - Complete tarefas atribuídas
   - Solicite trocas quando necessário

3. **Final do Expediente**:
   - Altere status para "Indisponível"
   - Verifique pontos ganhos no dia
   - Planeje resgates na loja

#### **Para Supervisores/Admins:**
1. **Gestão Diária**:
   - Monitore status da equipe no dashboard
   - Aprove/rejeite solicitações de troca
   - Avalie conclusões de tarefas
   - Acompanhe métricas de desempenho

2. **Gestão Semanal**:
   - Revise escalas da semana
   - Crie novas tarefas
   - Ajuste recompensas disponíveis
   - Analise ranking de pontos

---

## ⚙️ Configuração

### Variáveis de Ambiente

O sistema requer as seguintes configurações:

```env
# URL do Webhook N8N para o chat
VITE_N8N_TEST_WEBHOOK_URL=https://sua-instancia.n8n.cloud/webhook/seu-webhook-id

# Configurações do Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica
```

### Instalação Local

```bash
# 1. Clone o repositório
git clone <URL_DO_REPOSITORIO>

# 2. Entre no diretório
cd conversy-n8n

# 3. Instale as dependências
npm install

# 4. Configure as variáveis de ambiente
# Crie um arquivo .env com as variáveis acima

# 5. Inicie o servidor de desenvolvimento
npm run dev

# 6. Acesse no navegador
# http://localhost:5173
```

### Scripts Disponíveis

```bash
npm run dev        # Inicia servidor de desenvolvimento
npm run build      # Cria build de produção
npm run preview    # Visualiza build de produção
npm run lint       # Executa verificação de código
```

---

## 🛠️ Tecnologias

### Frontend
- **React 18** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes UI
- **Radix UI** - Componentes acessíveis

### Backend/Serviços
- **Supabase** - Backend as a Service
  - Autenticação
  - Banco de dados PostgreSQL
  - Real-time subscriptions
- **N8N** - Automação e workflows
  - Processamento de mensagens do chat
  - Integrações externas

### Gerenciamento de Estado
- **Zustand** - Estado global
- **TanStack Query** - Cache e sincronização de dados
- **React Hook Form** - Formulários

### Utilitários
- **date-fns** - Manipulação de datas
- **Zod** - Validação de schemas
- **Lucide React** - Ícones
- **Sonner** - Notificações toast

---

## 📱 Responsividade

Maya é totalmente responsiva e funciona perfeitamente em:
- 💻 Desktop (1920px+)
- 💻 Laptop (1366px+)
- 📱 Tablet (768px+)
- 📱 Mobile (375px+)

---

## 🎨 Tema

O sistema suporta **modo claro** e **modo escuro**:
- Clique no ícone de usuário
- Selecione "Modo Escuro" para alternar
- Preferência salva automaticamente

---

## 🔒 Segurança

- ✅ Autenticação segura via Supabase
- ✅ Apenas emails corporativos (@yooga.com.br) permitidos
- ✅ Controle de acesso baseado em roles
- ✅ Sessões com token JWT
- ✅ Validação de dados no cliente e servidor

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Use o chat Maya para questões sobre atendimento
2. Entre em contato com seu supervisor para questões administrativas
3. Reporte bugs para a equipe de TI

---

## 📄 Licença

© 2025 Yooga. Todos os direitos reservados.

---

## 🚀 Versão Atual

**v2025.6.1** - Sistema de gamificação e gestão de trocas completo

---

**Desenvolvido com ❤️ pela equipe Yooga**
