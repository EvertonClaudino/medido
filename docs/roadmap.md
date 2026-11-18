# Roadmap do Medido

Última atualização: 17/11/2026

## Fase 1: Landing page
Estado: **Concluída com sucesso (Landing Page Corporativa integrada com o Dashboard)**
- Landing page responsiva adaptada ao setor da construção civil em Portugal (PT-PT).
- Captação de contactos via Server Action e lead form.
- Otimização SEO inicial, ficheiros robots.txt e sitemap.xml.
- Tailwind CSS v4 integrado pelo plugin PostCSS no pipeline padrão do Next.js.
- Recriação profissional e corporativa baseada no Dashboard real do Medido: paleta Slate/Âmbar da construção civil, showcase interativo com abas (Visão do Dono, Visão do Encarregado e Medições Métricas), apresentação dos 6 KPIs reais, execução orçamental com Donut SVG (€ 185.000), desdobramento técnico dos 6 módulos de obra, perfis de acesso RBAC, ergonomia móvel para estaleiro, FAQ interativo e formulário de acesso antecipado.

---

## Bloco 1: Infraestrutura Tailwind v4 & shadcn/ui
Estado: **Implementação concluída; validação final pendente**
- [x] Migração oficial para Tailwind CSS v4; removidos o config JS, a compilação CLI dedicada e o CSS compilado em `public/`.
- [x] `postcss.config.mjs` com `@tailwindcss/postcss`; `app/globals.css` importado pelo layout raiz.
- [x] Scripts `dev` e `build` sem passo/watch CSS dedicado e sem `--webpack`; build padrão validada com Turbopack.
- [x] shadcn/ui inicializado com o CLI atual, preset Nova + Radix, base neutral, CSS variables e RSC.
- [x] Adicionados apenas `button`, `card`, `badge`, `dialog`, `input`, `label`, `skeleton` e `separator`.
- [x] Tokens de tema claro e variáveis `.dark` preparados e ativados com seletor de tema funcional (`ThemeToggle`) na Landing Page e no Dashboard com persistência em `localStorage` e script anti-FOUC.
- [x] Comparação visual da landing page e do login em 360, 768 e 1280 px; sem regressões visuais observadas.
- [ ] Comparação visual autenticada do dashboard pendente de uma base de dados acessível e sessão de teste.
- [ ] Branch e commits por passo pendentes de Git disponível no ambiente.

---

## Fase 2: Fundação & Autenticação
Estado: **Concluída com sucesso**

### O que está implementado e validado:
- [x] Auth.js com versão exata `5.0.0-beta.32` no `package.json`.
- [x] Helper `requireUser()` com revalidação estrita à base de dados (`status: ACTIVE`) e com `select` explícito (sem fuga de `password`/hash).
- [x] Isolamento multi-tenant por `companyId` em todas as tabelas e queries.
- [x] Política de palavra-passe robusta (mínimo 8 carateres, maiúscula e algarismo) no login, convite e alteração de perfil.
- [x] Rate limiting persistente em Postgres contra força bruta no login (5 falhas por email ou 20 por IP em 15 minutos, bloqueio de 15 minutos).
- [x] Proteção do seed para não executar em ambiente de produção (`NODE_ENV === "production"`).
- [x] Integridade referencial na BD: `work_logs.authorId ON DELETE RESTRICT` e FK de `work_log_measurements.companyId`.
- [x] Fluxo de primeiro acesso obrigatório com `User.mustChangePassword`: utilizadores convidados são forçados a trocar a palavra-passe em `/dashboard/perfil` antes de qualquer outra ação.

---

## Fase 3: Dashboard & Operações por Perfil
Estado: **Em desenvolvimento**

### 1. Funcionalidades implementadas:
- [x] Módulo de Tarefas & Diligências Técnicas (`/dashboard/tarefas` e `/dashboard/tarefas/nova`):
  - Modelo `Task` e enum `TaskStatus { PENDING, COMPLETED, CANCELLED }` com integridade referencial e migração versionada aplicada.
  - Associação opcional a obras (`projectId` nullable) permitindo visitas técnicas preliminares ou diligências de compras.
  - Regras de negócio RBAC: `OWNER` pode criar e atribuir a qualquer `FOREMAN` ou `WORKER` ativo; `FOREMAN` cria apenas para `WORKER` ativos das suas obras com `isLead: true`.
  - Transições de estado autorizadas: atribuído conclui/reabre; apenas `OWNER` ou criador cancela; `CANCELLED` é terminal.
  - Visualização agrupada por urgência no fuso `Europe/Lisbon` (Atrasadas, Hoje, Próximas & Sem Data, Concluídas/Canceladas).
  - Integração no menu lateral (desktop) e na barra inferior (mobile) com badge dinâmico de tarefas em atraso/vencimento hoje (exibido apenas se > 0).
- [x] Módulo de Clientes (`/dashboard/clientes`) — restrito ao Dono da empresa:
  - Modelo `Client` com campos `name`, `nif`, `email`, `phone`, `address`, `notes`; migração versionada aplicada (`20261109223407_add_clients_model`).
  - Ligação opcional a `Project` via `clientId` (onDelete: SetNull).
  - Cards Operacionais com avatar de iniciais, contactos, NIF, histórico de obras com chips de estado e diálogo de perfil completo (`ClientDetailsDialog`).
  - CRUD completo via pop-up / modal (sem páginas separadas `/nova`): criar, editar e eliminar (com proteção contra eliminação de cliente com obras associadas).
  - Server actions `createClientAction`, `updateClientAction`, `deleteClientAction` com validação Zod e isolamento multi-tenant.
  - Componente reutilizável `components/ui/dialog.tsx` (sem dependências externas): fecha com Escape, clique no backdrop e botão X; bloqueia scroll; foco inicial no painel.
  - Integrado no menu lateral do OWNER e na barra mobile (5 itens; substituiu "Registos" na barra mobile, que continua acessível no sidebar desktop).
- [x] Visão Geral do OWNER completamente reformulada de acordo com um design system de ERP para construção civil:
  - Banner de boas-vindas com meteorologia, dados em tempo real, cartões financeiros de Saldo Livre e Orçamento Total consolidado e arte vetorial técnica de estaleiro.
  - Fileira de 6 KPI cards semânticos de alta densidade (Obras Ativas, Concluídas, em Atraso, Apontamentos em Obra, Validações Pendentes e Assiduidade da Equipa).
  - Painel de Execução Orçamental das Obras com gráfico tipo Donut SVG puro desagregando orçamento total, executado, comprometido e saldo em Euros (€).
  - Cronograma e Evolução de Obras com gráfico multilinhas SVG puro (Planeado, Real e Previsão).
  - Desempenho por Obra com barras de progresso percentual e estado.
  - Barra de atalhos rápidos ("Quick Links") para navegação direta nos módulos operacionais (Obras, Registos, Equipa, Tarefas, Clientes, Orçamentos, Alertas).
  - Grelha Operacional tripartite: Atualizações Recentes de Obras, Alertas Críticos e Próximos Prazos.
  - Coluna lateral direita rica com mini-calendário interativo (`Europe/Lisbon`), lista de Tarefas Prioritárias com checkboxes e badges de prioridade e feed de Notificações operacionais recentes.
- [x] Feed "Notificações" derivado de registos, obras, tarefas e revisões de orçamento; `/dashboard/notificacoes` apresenta os 100 acontecimentos mais recentes, sem modelo nem estado de leitura.
- [x] Alertas, registos pendentes, obras em curso e gráfico de horas validadas mantidos no dashboard; consultas restritas por `companyId`, com `select` explícito e sem N+1.
- [x] Testes de calendário, fronteiras de data no fuso de Lisboa e autorização de `/dashboard/alertas` para FOREMAN/WORKER.
- [x] Alertas puros em `lib/alerts.ts`, com tipo, gravidade, obra opcional, data e ação; incluem obras sem encarregado, registos pendentes antigos, obras sem registos há 7 dias, tarefas atrasadas, obras sem funcionários e palavras-passe temporárias.
- [x] Consultas server-side por `companyId`, com `select` explícito, agregação de pendentes por obra e sem consultas N+1.
- [x] Página `/dashboard/alertas` exclusiva do OWNER, agrupada por gravidade, filtrável por obra e tipo e com ações para os módulos existentes.
- [x] Navegação OWNER com secção Operação e contadores separados de alertas críticos e de atenção (ocultos quando zero).
- [x] Suspense/Skeleton por bloco, estados vazios e erros com repetição; foco visível, ícone acompanhado por texto e suporte global a `prefers-reduced-motion`.
- [x] Testes unitários para fronteiras de 3 e 7 dias, obras sem registos e fuso `Europe/Lisbon`; teste de acesso confirma redirecionamento de FOREMAN e WORKER.
- [ ] Validação visual autenticada do OWNER em ecrãs de 360, 768 e 1280 px.
- [x] Dashboards de `FOREMAN` e `WORKER` preservados sem alterações.
- [x] Criação de obras com atribuição inicial de encarregado e orçamento restrito ao Dono.
- [x] Arquivamento e edição de obras existentes pelo Dono (`/dashboard/obras/[id]/editar`).
- [x] Gestão de equipa da obra e alocações (`/dashboard/obras/[id]/equipa`).
- [x] Página `/dashboard/obras` reformulada com dialog modal inline para registar nova obra (sem navegação para `/nova`).
- [x] Implementação dos Cards Operacionais Compactos (Opção B) na listagem de obras:
  - Borda lateral semântica (esmeralda, vermelha ou roxa) indicando o estado e atraso da obra.
  - Distinção estrita entre **obra atrasada** (`endDate < startOfToday` em Lisboa) e **tarefas em atraso** (`dueDate < startOfToday` em Lisboa com `status: PENDING`).
  - Hierarquia compacta: código mono, nome clicável, tags de serviço, prazo, encarregado, cliente e contagem de trabalhadores.
  - Painel de filtros avançado (Estado, Encarregado, Cliente, Prazo neste mês / próximo mês / sem data) e ordenação flexível (criação, prazo, nome A-Z, mais tarefas em atraso, mais tarefas pendentes).
  - Modal/Diálogo completo de detalhes da obra (`ProjectDetailsDialog`) acessível ao clicar no título ou no botão "Ver Detalhes".
  - Diálogo de registo de nova obra redesenhado e estruturado em 3 secções operacionais claras.
- [x] Código Interno de Obra gerado automaticamente no formato `OBR-YYYY-NNN`; utilizador pode sobrescrever.
- [x] Campo `Tipo de Serviço` com 10 tipos predefinidos de construção civil e opção de texto livre.
- [x] 4 cards KPI no topo da página de obras: Total de Obras, Obras Ativas, Obras Terminadas, Obras em Atraso.
- [x] Barra de pesquisa (nome, código, cliente, tipo de serviço, morada) e filtros por estado (pills).
- [x] Migração `20261111225103_add_project_service_type` aplicada ao Neon (campo `serviceType String?` em `Project`).
- [x] Gestão de equipa da empresa reformulada (`/dashboard/equipa`): Cards Operacionais de alta densidade visual (1/2/3 colunas), avatar com iniciais coloridas e indicador de perfil, especialidade/cargo profissional (`specialty`), obras atribuídas com indicação de Encarregado Responsável (`isLead`), controlo de estado Ativo/Inativo e Diálogo Modal (`Dialog`) de convite com visualização e cópia de senha temporária gerada.
- [x] Migração `20261115221000_add_user_specialty` aplicada ao Neon (campo `specialty String?` em `User`).
- [x] Apontamento diário mobile-first com suporte a horas opcionais e medições métricas (`M`, `M2`, `M3`, `UN`, `KG`).
- [x] Validação e rejeição de registos pelo Encarregado (apenas nas suas obras responsáveis).
- [x] Reenvio de registos rejeitados pelo Funcionário.
- [x] Centralização integral de textos visíveis em [`lib/texts.ts`](file:///c:/Users/user/Desktop/Projeto/medido/lib/texts.ts) em PT-PT.
- [x] Implementação do fluxo OWNER de pedidos de visita (`/dashboard/visitas`), com criação inline de cliente, agendamento em `Europe/Lisbon` e estados recebida/agendada/realizada/cancelada.
- [x] Implementação de orçamentos detalhados (`/dashboard/orcamentos`), com IVA por linha configurável, revisões/snapshots e seleção livre de estado pelo OWNER.
- [x] Aprovação do orçamento cria uma obra ativa sem equipa; `Project.budget` fica com o total com IVA; alterações do orçamento sincronizam a obra e o cancelamento arquiva-a.
- [x] Fluxo de pré-visualização e confirmação explícita de localização de obra antes da aprovação de orçamentos:
  - Diálogo modal `BudgetApprovalDialog` com apresentação de dados informativos do cliente, linhas comerciais com IVA e valor global da empreitada.
  - Confirmação explícita obrigatória da morada do estaleiro via checkbox desmarcada por defeito (distinta da morada fiscal do cliente).
  - Server Action `approveBudgetAndCreateProjectAction` com isolamento `Serializable`, controlo otimista de versão (`expectedRevisionNumber` e `expectedUpdatedAt`) e idempotência.
  - Geração segura de código sequencial de obra `OBR-YYYY-NNN` no momento da criação ou reativação segura da mesma obra existente se anteriormente cancelada.
- [x] Navegação OWNER para Visitas e Orçamentos; clientes com visitas/orçamentos associados não podem ser eliminados.
- [x] Testes unitários de cálculo/arredondamento, transições de visita e conversão de data/hora para `Europe/Lisbon`; TypeScript, lint e build passam.
- [ ] Aplicar a migração `20261111185700_add_budget_visit_workflow` e validar os fluxos com uma base de dados de teste/Preview; a verificação de estado em 11/11/2026 falhou com P1001 (servidor inalcançável).

- [x] Ficha do cliente como centro do processo comercial (`/dashboard/clientes/[id]`): barra de etapas, histórico de atividade com interações, visitas geridas na ficha e no calendário do dashboard, orçamento com visita opcional e pipeline de Orçamentos em quadro/lista (decisão 022).

- [x] Agenda do responsável na marcação de visitas (14 dias, conflitos recusados no servidor, reagendamento), "As Minhas Visitas" no painel do encarregado e modo escuro coerente em todas as páginas (decisão 023).

- [x] Registo de empresa (`/registo`) com sessão iniciada, base de dados limpa para dados reais, testes de integração isolados e nova landing, login e registo (decisão 024).
- [x] Landing redesenhada a partir da referência extds.eu: hero de ecrã inteiro com desenho técnico animado, montra do produto, movimento ligado ao scroll e tipografia de display (decisão 025).

### 2. O que falta na Fase 3:
- [ ] Validação cruzada e refinamento dos filtros de pesquisa de registos por data/obra.
- [ ] Testes de carga e auditoria final com utilizadores de teste em ambiente de Preview na Vercel.

---

## Ideias futuras
- Anexo de fotografias de comprovativo de obra.
- Exportação de relatórios de medições e trabalhos em PDF/Excel.
- Faturação e subscrições Stripe.
- Recuperação de palavra-passe por email.
- Internacionalização completa (mantendo textos centralizados em PT-PT).
