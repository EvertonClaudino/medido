# Decisões do projeto

## 001: Autenticação com Auth.js + JWT (08/11/2026)

**Decisão:** usar Auth.js (next-auth v5) com sessões JWT e provider Credentials.

**Motivo:** escolha do responsável pelo produto; solução self-hosted, sem custos por utilizador, integra bem com Next.js e Prisma.

**Riscos conhecidos:**
- O next-auth v5 continua em beta e a manutenção é só de segurança, agora sob a equipa do Better Auth.
- Tokens JWT não podem ser revogados antes de expirar.

**Mitigações:**
- Versão fixa e exata: `5.0.0-beta.32`.
- `maxAge` curto (10 horas).
- `requireUser()` revalida o utilizador na base de dados em cada ação sensível e página protegida.
- `proxy.ts` só para redirecionamento; a autorização real é sempre no servidor.

## 002: Stack (08/11/2026)

Next.js (App Router) + TypeScript, Neon, Prisma, Vercel, Tailwind + shadcn/ui. Fixa, salvo motivo forte de segurança ou compatibilidade.

## 003: Idioma (08/11/2026)

Todo o texto do produto em PT-PT. Código e nomes técnicos em inglês.

## 004: Modelo de Registos de Trabalho e Medições (08/11/2026)

**Decisão:** O registo diário de trabalho (`WorkLog`) passa a suportar horas opcionais (`Decimal(4,2)`) e 0..N medições métricas (`WorkLogMeasurement`), com as unidades iniciais:
- `M`: Metro linear
- `M2`: Metro quadrado
- `M3`: Metro cúbico
- `UN`: Unidade
- `KG`: Quilograma

Regras estruturais estabelecidas:
1. Pelo menos as horas ou uma medição métrica são obrigatórias em cada registo.
2. Limite máximo de 20 medições por registo.
3. Horas em intervalos estritos de 0,25h (entre 0,25 e 24).
4. Quantidades estritamente positivas (`> 0`) com precisão até 3 casas decimais (`Decimal(12,3)`).
5. Nos ecrãs e relatórios de totais, **nunca somar unidades métricas diferentes** (agregação segregada por unidade).
6. Preservação de integridade e histórico: migração versionada aplicada via `prisma migrate deploy` garantindo conversão de dados pré-existentes.

## 005: Primeiro Acesso Obrigatório e Gestão de Palavras-passe (09/11/2026)

**Decisão:** Todos os utilizadores criados por convite recebem `mustChangePassword = true`.

Regras:
1. Ao efetuar login, `requireUser()` verifica a flag `mustChangePassword`. Se for verdadeira, bloqueia qualquer rota e redireciona forçosamente para `/dashboard/perfil`.
2. A alteração de palavra-passe exige a senha temporária/atual e valida a nova com os requisitos mínimos (mínimo 8 carateres, 1 maiúscula, 1 número).
3. Após sucesso, a flag é colocada a `false` e o acesso total ao dashboard é desbloqueado.

## 006: Módulo de Tarefas e Gestão de Prazos (09/11/2026)

**Decisão:** Adicionado modelo `Task` para agendamento e atribuição de tarefas operacionais, técnicas ou comerciais.

Regras estruturais:
1. `projectId` opcional (suporta tarefas em obra ou avulsas/visitas técnicas prévias).
2. Data limite `dueDate`: formato timestamp com hora (`DateTime`), interpretada no fuso horário `Europe/Lisbon`.
3. Estados: enum `TaskStatus { PENDING, COMPLETED, CANCELLED }`.
4. Atribuição e Criação:
   - `OWNER` pode atribuir tarefas a qualquer utilizador ativo da empresa (`FOREMAN` ou `WORKER`) e cancelar qualquer tarefa.
   - `FOREMAN` pode criar tarefas exclusivamente para `WORKER` ativos que estejam atribuídos às suas obras responsáveis (`isLead: true`).
5. Visibilidade:
   - `OWNER` consulta todas as tarefas da organização.
   - `FOREMAN` e `WORKER` consultam apenas as tarefas atribuídas a si (`assignedToId === user.id`).
6. Transições de estado:
   - Utilizador atribuído pode alternar entre `PENDING` e `COMPLETED`.
   - Transição para `CANCELLED` restrita ao criador ou `OWNER`.
   - Tarefas canceladas são imutáveis (não podem ser concluídas).

## 007: Módulo de Clientes e Criação via Pop-up / Modais (09/11/2026)

**Decisão:** Criação da entidade `Client` e transição dos formulários de criação para modais (pop-ups), eliminando redirecionamentos desnecessários.

Regras estruturais:
1. Modelo `Client`:
   - Campos: `id`, `companyId`, `name` (obrigatório), `nif`, `email`, `phone`, `address`, `notes`, `createdAt`, `updatedAt`.
   - Chave estrangeira `companyId` com `onDelete: Cascade`.
   - Ligação opcional em `Project`: `clientId` com `onDelete: SetNull`.
2. Acesso e Permissões (RBAC):
   - Módulo `/dashboard/clientes` restrito a `OWNER`.
   - `FOREMAN` visualiza o nome e contactos do cliente na ficha das obras onde está alocado.
3. Criação por Pop-up / Modal:
   - Em vez de navegar para páginas separadas `/nova`, os botões de ação ("Novo Cliente", "Nova Tarefa", "Registar Nova Obra") abrem um diálogo modal na mesma página, com validação e feedback direto.

## 008: Tailwind CSS v4 e shadcn/ui (11/11/2026)

**Decisão:** Migrar o pipeline de estilos para Tailwind CSS v4 com o plugin PostCSS oficial e inicializar shadcn/ui com o CLI atual, CSS variables, base neutral e componentes compatíveis com React Server Components.

Regras e âmbito:
1. A folha global `app/globals.css` importa Tailwind com `@import "tailwindcss"` e é carregada pelo layout raiz.
2. O tema claro permanece ativo; as variáveis `.dark` ficam preparadas sem ativar um seletor ou provider de tema.
3. O tema preserva a paleta slate/amber da interface e expõe tokens de estado para sucesso, atenção, crítico e informação.
4. Os componentes shadcn/ui são adicionados apenas quando necessários; o diálogo de clientes usa Radix/shadcn e preserva fecho por Escape, clique fora, foco modal e bloqueio de scroll.
5. O CLI shadcn atual não oferece o estilo legado `new-york`; foi selecionado o preset disponível `Nova` com base `Radix`, mantendo `baseColor: neutral`, CSS variables e `rsc: true`.
6. Foram preservados o comportamento de bordas e cursores anterior e os estilos de foco explícitos; as utilitários renomeadas (`shadow-sm`, `outline-none`, `backdrop-blur-sm`) foram migradas pelo upgrade oficial.
7. O `--webpack` já existia no script de build, mas não havia comentário, configuração ou documentação no projeto a identificar um problema específico de Windows que o justificasse. A build padrão do Next.js 16 (Turbopack) passou neste ambiente, pelo que o script deixa de forçar Webpack.

## 009: Pedidos de visita e orçamentos (11/11/2026)

**Decisão:** O processo comercial começa num pedido de visita, seguido de um orçamento detalhado. Ambos são geridos exclusivamente pelo `OWNER`.

Regras:
1. Um pedido pode usar um cliente existente ou registar um cliente novo. O ciclo da visita é `REQUESTED` → `SCHEDULED` → `COMPLETED`; pode ser cancelada antes ou depois da realização. O agendamento exige data/hora interpretada no fuso `Europe/Lisbon`.
2. Só se pode criar um orçamento depois da visita estar realizada; cada visita admite no máximo um orçamento.
3. O orçamento tem linhas detalhadas com quantidade, unidade, preço unitário e taxa de IVA por linha. Não há taxa de IVA predefinida; os montantes e o IVA são arredondados por linha ao cêntimo.
4. Os estados são `DRAFT`, `SENT`, `NEGOTIATION`, `APPROVED`, `REJECTED` e `CANCELLED`. O Dono pode escolher livremente qualquer estado; cada edição de conteúdo e de estado cria uma revisão com snapshot e autor.
5. Aprovar cria uma obra `ACTIVE`, sem equipa atribuída, ligada ao cliente e ao orçamento. `Project.budget` recebe o total com IVA. Alterações posteriores ao orçamento sincronizam os dados da obra; cancelar um orçamento aprovado arquiva a obra. As linhas do orçamento ficam como referência do âmbito orçamentado, sem constituírem registo de consumo/medição real.
6. A migração aditiva `20261111185700_add_budget_visit_workflow` foi criada, mas só deve ser aplicada após validação no ambiente de base de dados adequado.

## 010: Redesenho da Visão Geral do Dono com Yafa-UI e Office-Web-UI (11/11/2026)

**Decisão:** Redesenhar a página principal da visão geral do Dono da Empresa (`/dashboard` para perfil `OWNER`), adotando os padrões visuais e ergonómicos dos sistemas de design `yafa-ui-dashboard` e `office-web-ui-system` para replicar a densidade analítica e operacional da referência de ERP de construção civil fornecida.

Regras e estrutura:
1. **Banner de Boas-Vindas Operacional (`OwnerHeroBanner`):** Saudação personalizada contextualizada com data local (`Europe/Lisbon`), estado meteorológico, indicador em tempo real ("Dados ao vivo") e ilustração técnica vetorial de estaleiro. Foram removidos o medidor fictício de "Índice de Eficiência IA" e referências de IA simuladas, mantendo o foco em dados tangíveis.
2. **Fileira de KPIs Semânticos (`OwnerKpiRow`):** 6 cartões compactos com acentos cromáticos na borda esquerda, ícones Lucide específicos e comparativos: Obras Ativas, Obras Concluídas, Obras em Atraso, Apontamentos em Obra, Validações Pendentes e Assiduidade da Equipa.
3. **Canvas Analítico e Operacional Central (2/3):**
   - Execução Orçamental das Obras com gráfico circular tipo donut em SVG puro (sem bibliotecas externas pesadas) desagregando orçamento total, executado, comprometido e saldo.
   - Cronograma e Evolução de Obras com curvas SVG de tendência temporal (Planeado vs. Real vs. Previsão).
   - Desempenho por Obra com barras de progresso percentual e estado.
   - Barra de Acessos Rápidos em formato "pill bar" para atalhos diretos de criação e gestão (com "Alertas" limpo de menções a IA).
   - Grelha Operacional tripartite (Atualizações Recentes de Obras, Alertas Críticos com badges de gravidade e Próximos Prazos de Entrega).
4. **Painel Lateral Operacional (1/3) (`OwnerSidebarColumn`):**
   - Mini-calendário operacional interativo de navegação mensal e seleção de dia em `Europe/Lisbon`.
   - "As Minhas Tarefas" prioritárias com caixas de seleção interativas, ligação à obra e etiquetas de prioridade (Alta, Média, Baixa).
   - Feed de notificações e acontecimentos recentes em obra.
   - Removido o widget do assistente de IA/Copilot, preservando apenas as ferramentas operacionais reais de gestão.
5. **Compatibilidade e Integridade:** Todas as consultas no servidor mantêm estrito isolamento por `companyId`, cálculo no fuso `Europe/Lisbon`, valores monetários em Euros (`€`) e textos rigorosamente em português de Portugal (PT-PT).


## 011: Reformulação da página de Obras — Modal, Código Automático e Tipo de Serviço (11/11/2026)

**Decisão:** Reformular a página `/dashboard/obras` substituindo a navegação para uma página separada (`/nova`) por um Dialog/Modal inline, adicionar geração automática de código de obra e um campo de tipo de serviço.

**Contexto e alterações:**
1. **Dialog inline (`ObrasView.tsx`):** O botão "Registar Nova Obra" abre agora um `Dialog` Radix/shadcn na mesma página, sem navegar para `/dashboard/obras/nova`. A rota `/nova` mantém-se como redirect para `/dashboard/obras`.
2. **Código Interno auto-gerado:** O formato é `OBR-YYYY-NNN` (ex: `OBR-2026-004`). O servidor gera o próximo código com base no total de obras da empresa e envia-o como `nextCodeSuggestion`. O utilizador pode sobrescrever o valor no formulário.
3. **Tipo de Serviço (`serviceType`):** Campo `String?` adicionado ao modelo `Project` via migração `20261111225103_add_project_service_type`. O formulário apresenta 10 tipos predefinidos de construção civil (dropdown) com opção de texto livre para tipos não listados.
4. **4 cards KPI no topo:** Total, Ativas, Terminadas e Em Atraso — calculados no servidor, passados como prop `metrics` ao componente cliente.
5. **Pesquisa e filtros:** Barra de pesquisa client-side (nome, código, cliente, tipo de serviço, morada) e pills de filtro por estado (Todas / Ativas / Terminadas / Em Atraso).

**Motivo:** Melhor UX (sem mudança de contexto para registar uma obra), rastreabilidade interna por código e categorização das empreitadas por tipo de serviço.

**Impacto:** Migração de BD aplicada ao Neon. `createProjectAction` e `updateProjectAction` actualizados para incluir `serviceType`, `clientId`, `startDate` e `endDate`. TypeScript, lint e build (29 rotas) passam com exit 0.


## 012: Cards Operacionais Compactos e Filtros Avançados de Obras (12/11/2026)

**Decisão:** Adotar a apresentação de obras através de **Cards Operacionais Compactos (Opção B)** na página `/dashboard/obras`, integrando filtros por estado, encarregado, cliente e prazo, bem como ordenação multidimensional.

**Princípios e Implementação:**
1. **Separação Estrita de Atrasos:**
   - *Obra em Atraso:* Avaliada exclusivamente por `project.status === "ACTIVE" && project.endDate < getLisbonStartOfDay(now)`.
   - *Tarefas em Atraso:* Avaliada exclusivamente por `task.status === "PENDING" && task.dueDate < getLisbonStartOfDay(now)`.
   - Os dois indicadores possuem representações e semânticas visuais completamente autónomas.
2. **Eficiência no Backend (Sem N+1):**
   - A consulta em `app/dashboard/obras/page.tsx` carrega apenas tarefas pendentes (`select: { id: true, dueDate: true }`) associadas à empresa, eliminando transferências volumosas de dados sem gerar novas queries por card.
3. **Filtros e Ordenação:**
   - Filtros combinados por texto livre, estado (pills), encarregado atribuído, cliente e prazo de conclusão (neste mês / próximo mês / sem data).
   - Ordenação por: criação mais recente, prazo mais próximo, nome A-Z, mais tarefas em atraso e mais tarefas pendentes.
4. **Sem dados fictícios:** Nenhuma barra de progresso ou percentagem estimada foi incluída.


## 013: Aprovação de Orçamentos com Pré-Visualização e Confirmação de Estaleiro (12/11/2026)

**Decisão:** Substituir a aprovação direta de orçamentos por um fluxo seguro com pré-visualização comercial, confirmação explícita de estaleiro e criação/reativação transacional da obra.

**Princípios e Implementação:**
1. **Pré-Visualização sem Efeitos Colaterais:**
   - A abertura do diálogo `BudgetApprovalDialog` não persiste nada na base de dados.
   - Cancelar o diálogo fecha-o sem alterar o estado do orçamento nem criar registos.
2. **Confirmação Explícita de Estaleiro:**
   - A morada fiscal/comercial do cliente é exibida apenas a título informativo.
   - A localização da obra é editável (iniciada com `Budget.workAddress`), exigindo validação de 3 a 300 caracteres e seleção obrigatória de checkbox: *"Confirmo que esta é a localização correta da obra"*.
3. **Controlo Otimista de Concorrência (OCC):**
   - A Server Action `approveBudgetAndCreateProjectAction` recebe a versão apresentada (`expectedRevisionNumber` e `expectedUpdatedAt`).
   - Se o orçamento foi alterado entretanto, a transação aborta com o código `REVISION_MISMATCH` e o utilizador é convidado a recarregar e rever os novos valores.
4. **Idempotência e Reativação:**
   - Se o orçamento já foi aprovado e tem obra ativa associada, a ação retorna sucesso com o `projectId` existente sem criar duplicados.
   - Se o orçamento foi anteriormente cancelado e a obra arquivada, a reaprovação reativa a mesma obra (`Project.status = ACTIVE`), mantendo o mesmo `Project.id` e código `OBR-YYYY-NNN`.
   - Na primeira aprovação, o código `OBR-YYYY-NNN` é gerado no interior da transação `Serializable` através do maior sequencial do ano corrente na empresa.

## 014: Reformulação da Gestão de Equipa com Cards Operacionais, Especialidade e Diálogo de Convite (15/11/2026)

**Decisão:** Substituir a lista simples da página de Equipa (`/dashboard/equipa`) por uma grelha de Cards Operacionais responsivos de alta densidade visual (1 col mobile, 2 cols tablet, 3 cols desktop), adicionar suporte a especialidade/cargo profissional e migrar o formulário de convite para Diálogo Modal (`Dialog` do Radix/shadcn).

**Princípios e Implementação:**
1. **Modelagem de Dados e Especialidade:**
   - Adicionado campo opcional `specialty String?` ao modelo `User` via migração `20261115221000_add_user_specialty`.
   - Permite registar ofícios e especialidades da construção civil (ex.: "Encarregado Geral", "Pedreiro de 1.ª", "Eletricista", "Carpinteiro de Cofragem", etc.).
2. **Cards Operacionais com Identificação Visual:**
   - Avatar com iniciais dinâmicas e paleta cromática semântica por perfil (Dono em roxo com escudo, Encarregado em âmbar com capacete, Funcionário em azul com pasta).
   - Indicação de estado Ativo / Inativo com alternância rápida com botões de área mínima de 44 px.
   - Apresentação das obras ativas alocadas (`ProjectAssignment`), discriminando o papel de "Responsável" (`isLead: true`) ou "Equipa".
   - Dono com indicação de "Acesso global a todas as obras da empresa".
3. **Diálogo Modal de Convite:**
   - Substituição do formulário inline estático por Diálogo modal com validação e sugestões de especialidades comuns de construção civil.
   - Apresentação destacada da palavra-passe temporária gerada com botão de cópia com 1 clique e lembrete de obrigatoriedade de alteração no primeiro acesso.
4. **Filtros e Pesquisa:**
   - Pesquisa em tempo real (nome, email, especialidade, obra) e filtros por perfil (Todos, Encarregados, Funcionários) e estado (Ativos, Inativos).
5. **Diálogo Modal de Perfil e Detalhes do Colaborador (`MemberDetailsDialog`):**
   - Ao clicar em qualquer card de colaborador, abre um diálogo modal detalhado com avatar ampliado, identificação completa, perfil, estado da conta, data de admissão e estado de primeiro acesso (`mustChangePassword`).
   - Apresenta estatísticas de atividade operacional (apontamentos de obra e tarefas atribuídas) e listagem completa de obras com atalho para a gestão da equipa da obra.
   - Permite ao Dono editar diretamente a especialidade/cargo técnico do colaborador sem recarregar a página.
   - Controlo de ativação/desativação no rodapé com conformidade móvel de 44 px e isolamento de evento (`stopPropagation`) nos botões do card para evitar abertura indesejada.

## 015: Reformulação dos Cards de Clientes com Histórico de Obras e Melhoria do Diálogo de Convite (16/11/2026)

**Decisão:** Alinhar o design do módulo de Clientes (`/dashboard/clientes`) com o padrão visual dos colaboradores, integrando histórico de obras e diálogo de detalhes, e elevar a ergonomia do diálogo de convite da equipa.

**Princípios e Implementação:**
1. **Cards Operacionais de Clientes:**
   - Avatar com iniciais estilizadas em verde esmeralda.
   - Apresentação de NIF, telefone, email e morada fiscal.
   - Secção de Histórico de Obras com chips de código (`[OBR-2026-001]`), nome e badges semânticos de estado (Em curso, Concluída, Arquivada).
   - Métricas no topo: Total de Clientes, Clientes com Obras Ativas, Histórico de Obras e Orçamentos.
   - Barra de pesquisa integrada filtrando por nome, NIF, contactos ou nome de obra associada.
2. **Diálogo de Perfil e Histórico do Cliente (`ClientDetailsDialog`):**
   - Abertura ao clicar em qualquer cartão com foco acessível e área de toque móvel de 44 px.
   - Apresentação completa das informações fiscais e notas internas.
   - Histórico detalhado de todas as obras (código, nome, datas de início/conclusão, tipo de serviço e link para `/dashboard/obras`).
   - Botões de Ação rápida: Editar Cliente, Eliminar (com proteção relacional) e Fechar.
3. **Melhoria do Diálogo de Convite da Equipa:**
   - Seletor de Perfil de Acesso com Radio Cards visuais (Funcionário vs Encarregado) com ícones temáticos e descrições claras de funções em obra.
   - Pills de seleção rápida com 1 toque para as especialidades mais comuns da construção civil ("Pedreiro de 1.ª", "Encarregado Geral", "Eletricista", "Carpinteiro", "Pintor", etc.).
   - Bloco visual de palavra-passe com indicação de geração automática segura recomendada.

## 016: Otimização de Layout Responsivo — Barra Inferior até 768x1024 e Sidebar Compacto em Desktop (16/11/2026)

**Decisão:** Manter a barra de navegação inferior ativa em ecrãs móveis e tablets até à resolução 768x1024 (`< 1024px` / `< lg`), e reduzir a largura lateral do sidebar em ecrãs maiores para libertar espaço para os cartões de obras, equipa e clientes.

**Princípios e Implementação:**
1. **Transição de Breakpoint (de `md` para `lg`):**
   - Em tablets (incluindo 768x1024 em portrait), o sidebar lateral fica oculto (`hidden lg:flex`) e o dashboard opera em ecrã inteiro com a barra inferior (`lg:hidden`).
   - O padding inferior do layout ajusta-se para `pb-16 lg:pb-0`.
2. **Redução da Largura do Sidebar Lateral:**
   - Em ecrãs `>= 1024px`, o sidebar passa de `w-64` (256px) para `w-52` (208px, `shrink-0`), com espaçamentos otimizados (`px-2.5 py-1.5` nos links).
   - O padding do `<main>` passa de `md:p-8` para `sm:p-6 lg:p-6`, concedendo uma área útil substancialmente maior para que a grelha de cards respire confortavelmente em desktop e não fique reduzida.
