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


## 017: Landing Page Corporativa Integrada com o Dashboard do Medido (17/11/2026)

**Decisão:** Reconstruir integralmente a landing page (`app/page.tsx`) espelhando fielmente os dados, indicadores e ferramentas do dashboard real do Medido, aplicando uma paleta de cores corporativa de alta precisão (Slate grafite industrial com acentos em Âmbar da construção e semânticas de ERP).

**Princípios e Implementação:**
1. **Identidade Visual e Cores Condizentes:**
   - Base escura corporativa de alto contraste (`slate-950` / `slate-900`) evocando robustez e tecnologia industrial.
   - Cor primária institucional em Âmbar (`amber-500` / `amber-400`), a cor dos capacetes e máquinas de obra.
   - Acentos semânticos do ERP: Esmeralda para obras concluídas e saldo livre, Azul para obras ativas e planeamento, e Vermelho vivo para atrasos e alertas críticos.
2. **Showcase Interativo do Dashboard (`LandingDashboardPreview`):**
   - Abas dinâmicas permitindo ao visitante explorar:
     - *Visão do Dono (Estratégico):* Saudação contextualizada, KPIs semânticos, gráfico Donut de execução orçamental (€ 185 000,00) e alertas operacionais.
     - *Visão do Encarregado (Terreno):* Obras atribuídas, aprovação de registos com 1 toque no telemóvel e checklist de tarefas diárias.
     - *Ficha Oficial de Medições:* As 5 unidades métricas oficiais da construção em Portugal (M, M², M³, UN, KG) com garantia de não-somatório de unidades heterogéneas.
3. **Os 6 KPIs Reais do ERP (`OwnerKpiRow`):**
   - Obras Ativas (12), Concluídas (28), Em Atraso (2), Apontamentos em Obra (47), Validações Pendentes (5) e Assiduidade da Equipa (94%).
4. **Desdobramento dos 6 Módulos do Sistema:**
   - Ficha de Obra e Códigos Sequenciais (`OBR-AAAA-NNN`), Medições Métricas, Equipas e Ofícios, Orçamentos com taxas de IVA, Tarefas com prazos em Lisboa e Motor de Alertas Preventivos.
5. **Ergonomia Móvel e Perfis RBAC:**
   - Destaque ao suporte de ecrãs de estaleiro (barra inferior até 768x1024, botões com área de toque mínima de 44 px).
   - Divisão rigorosa de perfis: Dono, Encarregado e Funcionário.
6. **Formulário de Conversão e Perguntas Frequentes:**
   - `LeadForm` e `LandingFaq` harmonizados no tema corporativo, com foco em acessibilidade e semântica estrita.


## 018: Integração de Cards Financeiros de Saldo Livre e Orçamento Total no Banner do Dono (17/11/2026)

**Decisão:** Integrar diretamente no banner de topo da Visão Geral do Dono (`OwnerHeroBanner`) dois cartões financeiros destacados apresentando o **Saldo Livre** e o **Orçamento Total** em carteira.

**Princípios e Implementação:**
1. **Hierarquia Visual e Acesso Imediato:**
   - O Dono da Empresa passa a visualizar no primeiro segundo, logo ao lado da saudação diária ("Bom dia, Carlos! 👋"), da meteorologia de estaleiro e dos dados ao vivo de Lisboa, a liquidez e a escala financeira consolidada das suas obras ativas.
2. **Card de Saldo Livre:**
   - Destaque em verde esmeralda com ícone de carteira (`Wallet`), indicação de margem disponível e valor monetário formatado em Euros (€) com precisão decimal no padrão português (ex.: `26 800,00 €`).
3. **Card de Orçamento Total:**
   - Destaque sóbrio em slate/azul com ícone de tendência (`TrendingUp`), indicação de empreitadas ativas e valor consolidado em Euros (€) (ex.: `185 000,00 €`).
4. **Responsividade Estrita:**
   - Em ecrãs móveis (`< sm`), os cards distribuem-se fluidamente em grelha responsiva mantendo a legibilidade dos valores.
   - Em ecrãs largos (`lg` e `xl`), posicionam-se à direita em alinhamento horizontal com a saudação, preservando a ilustração técnica vetorial de estaleiro em ecrãs `2xl`.


## 019: Modo Escuro (Dark Mode) Universal e Funcional (17/11/2026)

**Decisão:** Implementar a funcionalidade completa de Modo Escuro (Dark Mode) em toda a aplicação — tanto na Landing Page como no Dashboard —, com suporte a persistência local, prevenção de flash de tema (Anti-FOUC) e sincronização reativa com React 19 via `useSyncExternalStore`.

**Princípios e Implementação:**
1. **Prevenção de FOUC (Flash of Unstyled Content):**
   - Injetado no `<head>` de `app/layout.tsx` um script inline síncrono que lê a preferência salva em `localStorage.getItem('medido-theme')` ou a preferência do sistema operacional (`prefers-color-scheme: dark`) e adiciona a classe `.dark` ao elemento `<html>` antes da primeira pintura.
   - Adicionado `suppressHydrationWarning` na tag `<html>` para assegurar hidratação limpa sem erros no cliente.
2. **Componente Reativo de Alternância (`ThemeToggle`):**
   - Utiliza a API canónica `useSyncExternalStore` do React 19 para sincronizar o estado da classe `.dark` do DOM com o componente sem provocar renderizações em cascata (`react-hooks/set-state-in-effect`).
   - Dispara eventos de sincronização em janela para manter todos os botões de alternância da página perfeitamente coordenados.
   - Apresenta ícones acessíveis com transição suave: Sol (`Sun`) em modo escuro e Lua (`Moon`) em modo claro.
3. **Integração no Dashboard e na Landing Page:**
   - **Landing Page:** Integrado no cabeçalho fixo ([`LandingNav`](file:///c:/Users/user/Desktop/Projeto/medido/components/landing-nav.tsx)) tanto na barra de topo como no menu móvel.
   - **Dashboard:** Integrado na barra superior ([`DashboardLayout`](file:///c:/Users/user/Desktop/Projeto/medido/app/dashboard/layout.tsx)), ao lado da identificação do utilizador e da empresa.
   - **Superfícies e Componentes:** Todos os cartões, barras, menus e formulários receberam classes semânticas com suporte dual (ex.: `bg-white dark:bg-slate-900`, `text-slate-900 dark:text-white`, `border-slate-200 dark:border-slate-800`), respeitando a folha de variáveis globais de Tailwind CSS v4.

## 020: Remoção de Dados Fictícios do Dashboard do Dono e Captação Real de Leads (17/11/2026)

**Decisão:** O dashboard do Dono passa a apresentar apenas dados reais da base de dados, mantendo o design. Onde não existe fonte de dados, o cartão mantém-se com "—" ou estado vazio.

**Implementação:**
1. **Calculados a partir da BD:** Orçamento Total (soma de `Project.budget` de todas as obras ativas, antes limitado às 5 mais recentes), progresso por obra (tarefas concluídas / tarefas não canceladas, via `calculateProjectProgress`), novas obras no mês, apontamentos da semana (segunda a domingo, Lisboa), assiduidade (funcionários ativos com registo hoje / funcionários ativos), prioridade das tarefas (pelo prazo: atrasada ou até amanhã = Alta, até 7 dias = Média) e calendário mensal real (tarefas pendentes e conclusões de obra previstas, com navegação por `?mes=`/`?dia=`).
2. **Sem fonte de dados (apresentados como "—"):** Valor Executado, Comprometido e Saldo Livre (não existe registo de custos), meteorologia e curvas Planeado/Executado/Previsão do cronograma (não existe planeamento de obra).
3. **Removidas** todas as listas de recurso com obras, tarefas e notificações fictícias.
4. **Leads:** o formulário da landing page grava no modelo `Lead` através de `createLeadAction` (validação zod no servidor, honeypot verificado no servidor, deduplicação por email em 24 horas).
5. **Isolamento multi-tenant:** `createProjectAction` recusa `clientId` que não pertença à empresa (teste 25 em `tests/authorization-rules.test.ts`).

## 021: Valores Monetários em Decimal, Rate Limiting Persistente e Endurecimento das Server Actions (17/11/2026)

**Decisões:**
1. **Todos os valores financeiros em `Decimal`.** `Project.budget` passou de `Float` para `Decimal(14,2)` (migração `20261117210000_project_budget_decimal_and_login_attempts`, com arredondamento explícito ao cêntimo; os 3 valores existentes não tinham casas decimais extra). A escrita usa `Prisma.Decimal` (sem aritmética de vírgula flutuante) e a leitura converte para `number` apenas na fronteira com Client Components. O orçamento aceita no máximo 2 casas decimais. Regra a seguir: qualquer novo campo financeiro é `Decimal`.
2. **Rate limiting de início de sessão em Postgres** (tabela `login_attempts`, `lib/login-rate-limit.ts`), partilhado por todas as instâncias serverless: 5 falhas por email ou 20 por IP em 15 minutos bloqueiam essa chave durante 15 minutos. O utilizador vê uma mensagem própria (`LoginRateLimitedError`, código `rate_limited`). Quando o email não existe é feita na mesma uma comparação bcrypt, para o tempo de resposta não revelar se a conta existe.
3. **Logs sem dados pessoais:** o login deixou de registar emails.
4. **Ligação ao Neon:** o `DATABASE_URL` com pooler leva `pgbouncer=true`, porque sem ele o Prisma falha com "cached plan must not change result type" depois de migrações que alteram tipos de colunas. Tem de ser configurado também na Vercel.
5. **Datas limite de tarefas** são interpretadas como hora de parede em `Europe/Lisbon` (`parseLisbonDateTime`); uma data sem hora vale até às 23:59 desse dia; uma data inválida é recusada.
6. **Editar obra** permite escolher o cliente associado, validado por `companyId`.
7. **Validação em runtime nas Server Actions:** dados da empresa (zod; NIF duplicado devolve erro em vez de 500), estado e motivo da revisão de registos (máx. 500 carateres, atualização atómica só se ainda `PENDING`), estado das tarefas (só `PENDING → CANCELLED`, atualização condicionada ao estado lido), ativação/desativação de utilizadores com o estado lido da BD, convites com `crypto.randomInt` e erro de email duplicado só para P2002, e alocação que não deixa a obra sem encarregado responsável.

## 022: Ficha do Cliente como Centro do Processo Comercial (padrões CRM) (17/11/2026)

**Decisão:** O percurso comercial (contacto → visita → orçamento → obra) passa a viver na ficha de cada cliente, inspirada nos padrões de trabalho de um CRM (página de registo, barra de etapas, histórico de atividade, listas relacionadas e pipeline de oportunidades), mantendo a identidade visual do Medido.

**Implementação:**
1. **Página própria `/dashboard/clientes/[id]`** (substitui o `ClientDetailsDialog`):
   - cabeçalho com contactos e ações rápidas: Marcar visita, Registar interação, Criar orçamento, Editar e Eliminar;
   - barra de etapas **Contacto → Visita → Orçamento → Negociação → Obra**, calculada automaticamente em `computeClientStage` (`lib/client-record.ts`), sem campo manual;
   - indicadores: obras, valor em orçamento, valor adjudicado e último contacto;
   - histórico cronológico com secção "Próximas" (visitas agendadas no futuro): interações, visitas, criação e mudanças de estado dos orçamentos e obras criadas;
   - listas relacionadas: dados, visitas (com gestão de estado), orçamentos e obras.
2. **Interações (`ClientActivity`):** chamada, email, reunião ou nota, com data (Europe/Lisbon, não futura) e autor. Restritas ao `OWNER`.
3. **Visitas:** deixam de ter página e item de menu próprios (`/dashboard/visitas` redireciona para Clientes). São marcadas na ficha do cliente; com data indicada, ficam logo agendadas. As visitas agendadas aparecem no calendário do dashboard (ponto azul) e na agenda do dia, com link para a ficha.
4. **Orçamento com visita opcional:**
   - `Budget.visitRequestId` passou a opcional (migração `20261117230000_client_activities_and_optional_budget_visit`);
   - o orçamento é criado para um cliente em `/dashboard/orcamentos/novo?cliente=…[&visita=…]`;
   - quando indicada, a visita tem de ser do mesmo cliente, estar realizada e ainda não ter orçamento;
   - o endereço antigo `/novo/[visitId]` redireciona.
5. **Pipeline de Orçamentos:** a página passa a ter indicadores (em aberto, em negociação, adjudicado e taxa de adjudicação), pesquisa, vista em quadro por estado (com total em € por coluna) ou em lista, e opção de mostrar os fechados. O detalhe do orçamento foi alinhado visualmente, com link para a ficha do cliente e modo escuro.
6. **Navegação:** "Visitas" saiu do menu lateral; na barra do telemóvel foi substituída por "Clientes". Criar um cliente abre a sua ficha, para marcar a visita logo a seguir.
7. **Fora de âmbito, de propósito:** potenciais clientes vindos do site (modelo `Lead`) e vários contactos por cliente ficam para uma fase seguinte.

## 023: Agenda do Responsável na Marcação de Visitas e Revisão Global do Modo Escuro (18/11/2026)

**Decisão 1: as visitas têm responsável, duração e agenda.**
1. `VisitRequest` ganhou `assignedToId` (encarregado ou Dono ativo da empresa) e `durationMinutes` (30 min a 4 h; 60 por defeito). Migração aditiva `20261118100000_visit_assignee_and_duration`.
2. **Agendar exige responsável.** Ao marcar, agendar ou reagendar, o diálogo mostra a agenda do responsável para os próximos 14 dias (`getVisitAgendaAction`):
   - visitas agendadas, com hora de início e fim, cliente e morada;
   - tarefas com prazo;
   - aviso em tempo real se o horário escolhido se sobrepõe a outra visita.
3. **O servidor recusa sobreposições** na agenda do mesmo responsável, numa transação `Serializable` (`findVisitConflict` em `lib/visit-scheduling.ts`). Visitas encostadas (uma acaba às 11:00 e outra começa às 11:00) são permitidas.
4. **Novo reagendamento** (`SCHEDULED → SCHEDULED`): permite mudar a data e/ou o responsável, ignorando a própria visita na verificação.
5. **Permissões:** o encarregado vê no seu painel as visitas que lhe estão atribuídas ("As Minhas Visitas": cliente, telefone, morada, hora e duração), apenas em leitura. A gestão das visitas continua exclusiva do Dono.
6. A agenda do dia no dashboard do Dono e a ficha do cliente mostram o responsável de cada visita.
7. Removido de `createVisitRequestAction` o caminho de criação de cliente dentro do pedido de visita, que deixou de ter uso (decisão 022).

**Decisão 2: modo escuro coerente em toda a aplicação.**
1. **Transformação automática com regras fixas** sobre os `className`, com o mesmo mapa de cores das páginas já adaptadas:
   - superfícies `dark:bg-slate-900`, bordas `dark:border-slate-800`, textos `slate-300/400`;
   - fundos coloridos `{cor}-950/40` e textos coloridos `{cor}-300`.

   Só acrescenta a variante quando falta para aquela propriedade e nunca altera a cor do texto em elementos com fundo sólido. Abrangeu 538 `className` em 39 ficheiros, incluindo 27 ecrãs que não tinham modo escuro (Tarefas, detalhe da obra, Registos, Perfil, Alertas, login, registo diário, entre outros).
2. **Botões principais:** no tema escuro usam âmbar (`dark:bg-amber-500`), em vez de slate-900, que ficava quase invisível sobre o fundo slate-950.
3. **Tokens do tema escuro** (`app/globals.css`) alinhados com a mesma paleta slate, para os componentes shadcn (diálogos, botões, campos) terem o mesmo tom das páginas. Antes usavam cinza `#111827` e um `accent` castanho. O fundo escurecido por trás dos diálogos passou a ser visível no tema escuro.
4. **Verificado visualmente** com capturas de ecrã (Chrome headless) do dashboard, Clientes, ficha do cliente, diálogo de marcação, Orçamentos, Tarefas, Registos e Perfil.

## 024: Registo de Empresa, Base de Dados Limpa, Testes Isolados e Nova Landing/Login (18/11/2026)

**Decisões:**
1. **Registo de empresa (`/registo`):** cria numa transação a `Company` e o utilizador `OWNER` e inicia sessão logo a seguir.
   - Validação zod no servidor: NIF opcional com 9 algarismos (espaços ignorados) e a mesma política de palavra-passe do resto do sistema.
   - Limite de 5 contas por IP a cada 15 minutos, na tabela `login_attempts`.
   - Erros de email ou NIF duplicado aparecem junto do campo.
   - Foi testado de ponta a ponta no browser: criar conta → sessão iniciada → dashboard vazio da nova empresa.
2. **Base de dados limpa (18/11/2026)** para começar com dados reais. Antes, foi exportada uma cópia de segurança JSON local. Todas as tabelas da aplicação foram esvaziadas; as migrações mantêm-se. **O seed não deve voltar a ser corrido nesta base de dados**, porque cria uma empresa de demonstração; serve apenas para bases de dados locais.
3. **Testes de integração isolados** (`tests/helpers/test-tenant.ts`):
   - cada suite cria as suas próprias empresas de teste, com emails únicos em `@test.medido.invalid`, e apaga-as por completo no fim;
   - não dependem do seed e não deixam dados (verificado: 0 registos após a bateria completa);
   - recusam-se a correr com `NODE_ENV=production`.
4. **Login sem credenciais expostas:** o rodapé que mostrava as contas e a palavra-passe do seed foi removido.
5. **Nova landing, login e registo**, seguindo as skills `claude-design`, `design-better` e `ui-ux-pro-max`:
   - **Diagnóstico de "aspeto de IA"** da landing anterior: 7/10. Tinha grelha de cartões com ícone por cima, barras de cor laterais, números grandes inventados, composição centrada e tipografia por defeito.
   - **Recomposição** em vez de recolorir:
     - hero alinhado à esquerda com um único registo diário de exemplo, identificado como tal;
     - percurso numerado em cinco passos;
     - tabela comparativa de perfis, baseada em `docs/permissions.md`;
     - especificações reais do produto;
     - faixa final com "Criar conta" e "Já tenho conta".
   - **Saíram** a secção e o formulário de acesso antecipado, as perguntas frequentes e a pré-visualização de dashboard com dados inventados.
   - **Tipografia IBM Plex Sans e Plex Mono** via `next/font`, aplicada só às páginas públicas (o dashboard mantém a fonte do sistema). É a recomendação dos dados da skill para construção: Swiss/minimalista, com estética de planta técnica.
   - **Uma única cor de destaque** (âmbar de segurança), cantos mais retos e uma grelha fina de planta técnica como único motivo gráfico.
   - **Login e registo** com campos de etiqueta visível, `autocomplete` correto, mostrar/ocultar palavra-passe, erros junto do campo e painel de marca só em ecrãs largos.
   - **Todos os textos novos** ficam centralizados em `lib/texts.ts` (`auth` e `landing`).
6. **O modelo `Lead` deixou de ter uso na aplicação.** A tabela fica no schema (vazia) até se decidir se volta a haver captação de contactos.

## 025: Landing ao nível de sites premiados, a partir da referência extds.eu (18/11/2026)

1. **Referência usada como linguagem, não como cópia.** Da extds.eu ficaram os padrões: hero de ecrã inteiro com uma frase gigante, navegação transparente que fica sólida ao deslizar, títulos grotescos fortes, montra do produto (portátil e telemóvel), painéis por perfil e faixa escura de contacto. Não se usou marca, texto, imagens nem cores da referência.
2. **Sem fotografias de banco de imagens.** No lugar do vídeo da referência, o hero tem um alçado técnico em SVG (edifício, andaime e cotas) que se desenha ao carregar. A montra do produto é HTML real com dados de exemplo identificados como tal. Fotografias reais de obras da empresa podem substituir o desenho mais tarde.
3. **Archivo (variável, eixo de largura) como fonte de display**, via `next/font`, só nas páginas públicas. IBM Plex mantém-se para texto corrido e rótulos técnicos. O título do login e do registo passa a usar a mesma fonte de display.
4. **Movimento só com CSS, sem bibliotecas novas:** texto do hero a subir de uma máscara, traço SVG a desenhar-se, faixa contínua (marquee) e revelações ligadas ao scroll com `animation-timeline: view()`. Em browsers sem suporte o conteúdo fica estático e visível. Tudo é desativado com `prefers-reduced-motion`.
5. **Secções:** hero, faixa contínua, declaração com revelação palavra a palavra, produto, percurso com título fixo, perfis, números do estaleiro (só especificações reais do produto), chamada final e rodapé com a marca em grande escala.
