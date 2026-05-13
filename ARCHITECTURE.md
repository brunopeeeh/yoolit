# Arquitetura do Projeto: Maya - Sistema Inteligente de Atendimento

Este documento descreve a arquitetura técnica, estrutura de pastas, tecnologias utilizadas e as decisões de design da aplicação.

## Visão Geral e Tecnologias (Stack)

A aplicação é uma SPA (Single Page Application) focada em performance, design moderno e forte separação entre a visão do Agente de Atendimento e a Gestão Administrativa.

**Frontend:**
- **Framework:** React 18
- **Build Tool:** Vite
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS (focado em acessibilidade, suporte a Dark/Light Mode e responsividade)
- **Componentes Base:** shadcn/ui (Radix UI) para um design premium e interfaces dinâmicas.
- **Roteamento:** React Router DOM (com navegação client-side limpa e reativa).

**Gerenciamento de Estado e Cache:**
- **Zustand:** Gerenciamento de estado global para perfil de usuário, tema e carrinho/loja.
- **TanStack Query (React Query):** Fetch de dados, caching, sincronização e gestão de loading state.
- **React Hook Form + Zod:** Tratamento de formulários complexos e validação de schema robusta no frontend.

**Backend & Infraestrutura:**
- **BaaS (Backend as a Service):** Supabase (Gerenciamento Auth, PostgreSQL Database, Storage e Real-time Features).
- **Workflow / Integrações:** n8n (Orquestração do webhook para respostas do Chat Inteligente da Maya).

## Estrutura do Frontend

O projeto adere à arquitetura do ecossistema React moderno (arquitetura baseada em features/componentes), encapsulando domínios para facilidade de escala.

```
src/
├── components/          # Componentes reutilizáveis
│   ├── admin/           # Exclusivo para páginas gerenciais (Escalas, Aprovação de Trocas, Dashboards)
│   ├── colaborador/     # Exclusivo para páginas do Agente (Leitura de Escala, Visão Pessoal)
│   ├── chat/            # Componentes do bot da Maya
│   ├── gamification/    # Componentes da Loja e Tarefas
│   ├── ui/              # Componentes genéricos de design (botões, inputs, cards - shadcn)
│   └── ...              # Outros diretórios de UI
├── hooks/               # Custom hooks React (ex: use-mobile, use-toast)
├── lib/                 # Utilitários, validadores (ex: validateScheduleTimes, formatters)
├── pages/               # Componentes Rota (Chat, Admin, Colaborador, Login)
└── App.tsx              # Ponto central de roteamento da aplicação
```

## Fluxos e Casos de Uso (Domínios de Negócio)

### 1. Sistema de Autenticação e Autorização (RBAC)
- A plataforma usa o sistema de autenticação via Supabase.
- Cada usuário está vinculado à tabela `profiles` que determina suas flags (`is_agent`, `is_admin`, etc.).
- Os acessos são garantidos via restrição de rotas e ocultação de interfaces dependendo da `role` do logado.

### 2. Painel de Controle vs Painel do Agente
- **Administrador / Supervisor (`/admin`)**: Visão de gerenciador (CRUD). Visão global de escalas, manipulação de saldo de pontos, aprovação de trocas e criação de recompensas.
- **Colaborador / Agente (`/colaborador`)**: Visão pessoal. Funcionalidades orientadas à própria rotina:
  - Verificar sua **Escala** de Trabalho (Somente visualização).
  - Participar da **Troca de Escalas** (Pedir uma troca ou aprovar uma solicitação feita por colega).
  - Resgatar prêmios na **Loja de Recompensas** usando seus pontos.

### 3. Workflow de Troca de Escalas (Shift Swaps)
- Quando o Agente 1 (Source) pede troca com Agente 2 (Target):
  1. Cria registro com estado `Pendente`.
  2. O Target aprova (vira `Aprovada pelo colega`) ou recusa (`Rejeitada`).
  3. Com a aprovação do colega, a solicitação cai para a análise do Supervisor que, finalmente, a aprova ou recusa.
  4. Há também um conceito de ganho de **Crédito de Troca** onde o agente ganha por cobrir outra pessoa e pode optar por resgatar em Pontos para Loja ou Agendar futura folga.

### 4. Integração da Assistente (Maya)
A Maya atua com base no webhook exposto pelo n8n. Todo input do usuário que necessita de análise da IA é formatado, enviado em background (via Axios ou Fetch) e a resposta do webhook atualiza a UI local com animações polidas e contexto de dados dinâmico.

---

> Esse documento deverá evoluir e ser atualizado conforme novos módulos forem integrados à stack (ex: novos microserviços, atualizações do fluxo do Supabase, entre outros).
