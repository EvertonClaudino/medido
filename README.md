# Medido

> Software de gestão operacional e controlo de obras para empresas de construção civil e empreitadas em Portugal.

O **Medido** é uma plataforma SaaS B2B *multi-tenant* focada nas necessidades do setor da construção civil. Centraliza o acompanhamento em tempo real das obras, apontamentos diários de equipa (horas e medições métricas), gestão de tarefas técnicas, catálogo de clientes, pedidos de visitas preliminares e orçamentação com controlo de revisões e aprovação com criação direta de obras.

---

## 🏗️ Principais Funcionalidades

- **Multi-empresa (Multi-tenant):** Segregação estrita de dados por empresa (`companyId`) em todas as entidades e consultas.
- **Perfis de Acesso (RBAC):**
  - **Dono da Empresa (`OWNER`):** Controlo global da empresa, faturação/orçamentos, gestão de equipa e convites, clientes, visitas técnicas e criação/gestão de obras.
  - **Encarregado (`FOREMAN`):** Gestão operacional das obras atribuídas, alocação de trabalhadores, acompanhamento de tarefas e validação/rejeição de apontamentos diários de obra.
  - **Funcionário (`WORKER`):** Registo diário de trabalho simplificado no telemóvel (mobile-first), consulta das suas tarefas e histórico de registos.
- **Gestão Operacional de Obras:**
  - Cartões operacionais compactos com indicadores semânticos de estado (Em Curso, Concluída, Em Atraso).
  - Distinção rigorosa entre prazo de obra ultrapassado e tarefas em atraso.
  - Painel de filtros avançados (estado, encarregado, cliente e prazo) e ordenação dinâmica.
  - Diálogo detalhado de obra (`ProjectDetailsDialog`) com progresso de tarefas, grelha orçamental, equipa alocada e apontamentos.
  - Registo rápido de nova obra estruturado em 3 passos no modal, com numeração automática sequencial (`OBR-YYYY-NNN`).
- **Apontamentos Diários & Medições em Obra:**
  - Suporte a horas trabalhadas e/ou até 20 medições métricas por apontamento (`M`, `M2`, `M3`, `UN`, `KG`).
  - Fluxo rigoroso de validação com motivos de rejeição e reenvio de registos corrigidos.
- **Orçamentos & Pedidos de Visita:**
  - Registo de pedidos de visita técnica com agendamento no fuso `Europe/Lisbon`.
  - Elaboração de orçamentos com taxa de IVA por linha, histórico versionado de revisões/snapshots.
  - Fluxo de aprovação segura de orçamentos com confirmação explícita do estaleiro de obra e criação atómica da respetiva obra ativa.
- **Tarefas & Diligências Técnicas:**
  - Atribuição direta por encarregado ou administrador, controlo de prazos e estados (`PENDING`, `COMPLETED`, `CANCELLED`).
- **Segurança & Gestão de Acessos:**
  - Fluxo de primeiro acesso forçado (`mustChangePassword`) para credenciais provisórias.
  - Proteção contra força bruta com limitação de tentativas no login.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
| :--- | :--- |
| **Framework** | [Next.js](https://nextjs.org/) (App Router, React Server Components) |
| **Linguagem** | [TypeScript](https://www.typescriptlang.org/) (Strict mode) |
| **Interface & Estilos** | [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (Radix UI) + [Lucide Icons](https://lucide.dev/) |
| **Base de Dados** | [PostgreSQL](https://www.postgresql.org/) alojado no [Neon](https://neon.tech/) |
| **ORM** | [Prisma ORM](https://www.prisma.io/) (com migrações versionadas) |
| **Autenticação** | [Auth.js](https://authjs.dev/) (`next-auth` v5) com sessões JWT e validação estrita no servidor |
| **Validação** | [Zod](https://zod.dev/) em todas as Server Actions e entradas do utilizador |

---

## 🚀 Como Começar

### Pré-requisitos

- **Node.js** 20.x ou superior instalado.
- Instância PostgreSQL ativa (ex.: Neon, Docker ou local).
- Gestor de pacotes `npm`.

### 1. Clonar o repositório e instalar dependências

```bash
git clone <url-do-repositorio>
cd medido
npm install
```

### 2. Configurar as variáveis de ambiente

Crie um ficheiro `.env` na raiz do projeto tomando como base o ficheiro `.env.example`:

```bash
cp .env.example .env
```

Preencha as seguintes variáveis:

```env
DATABASE_URL="postgresql://utilizador:palavra_passe@host/medido?sslmode=require"
AUTH_SECRET="segredo-aleatorio-gerado-com-openssl-rand-hex-32"
AUTH_URL="http://localhost:3000"
```

### 3. Configurar a base de dados

Aplique as migrações existentes e execute o seed de dados demonstrativos:

```bash
# Aplicar as migrações Prisma
npx prisma migrate dev

# Executar o seed de demonstração (contas e dados de teste)
npx prisma db seed
```

> **Nota:** Por segurança, o script de seed verifica `NODE_ENV` e recusa-se a correr se estiver em ambiente de produção.

### 4. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## 🧪 Testes e Qualidade de Código

Para garantir a fiabilidade e integridade das regras de negócio, execute os comandos de verificação:

```bash
# Verificação de tipos TypeScript
npx tsc --noEmit

# Análise estática de código (ESLint)
npm run lint

# Execução das suites de testes unitários (alertas, métricas e regras de medições)
npx tsx tests/alerts.test.ts
npx tsx tests/dashboard-metrics.test.ts
npx tsx tests/validation-rules.test.ts

# Compilação de produção
npm run build
```

---

## 📁 Estrutura do Projeto

```text
├── app/                      # Rotas e páginas do Next.js (App Router)
│   ├── (auth)/login/         # Autenticação e ecrã de início de sessão
│   ├── dashboard/            # Aplicação principal (protegida por RBAC)
│   │   ├── alertas/          # Alertas operacionais e de equipa
│   │   ├── clientes/         # Gestão de clientes e donos de obra
│   │   ├── equipa/           # Convites e gestão de colaboradores
│   │   ├── obras/            # Listagem, criação, edição e equipas de obras
│   │   ├── orcamentos/       # Orçamentação e aprovação com criação de obra
│   │   ├── registos/         # Apontamentos diários e validação
│   │   ├── tarefas/          # Gestão e acompanhamento de tarefas
│   │   └── visitas/          # Pedidos de visita e agendamentos técnicos
│   └── globals.css           # Estilos globais e tokens Tailwind v4
├── components/               # Componentes partilhados (UI / shadcn)
├── docs/                     # Documentação de decisões de arquitetura e roadmap
│   ├── decisions.md          # Registo de decisões técnicas e de arquitetura
│   ├── permissions.md        # Matriz RBAC de permissões por perfil
│   └── roadmap.md            # Planeamento e estado das fases de desenvolvimento
├── lib/                      # Utilitários de negócio, autenticação e cálculos
├── prisma/                   # Esquema Prisma, migrações SQL e scripts de seed
└── tests/                    # Suites de testes de regras e isolamento
```

---

## 🇵🇹 Convenções e Idioma

- **Interface de Utilizador:** Português de Portugal (PT-PT), com vocabulário estritamente adaptado ao setor da construção civil em Portugal (ex.: *utilizador*, *ecrã*, *telemóvel*, *encarregado de obra*, *estaleiro*, *empreitada*).
- **Formatos:** Datas `dd/mm/aaaa`, moeda em Euros (€), fuso horário padrão `Europe/Lisbon`.
- **Código:** Nomes de ficheiros, variáveis, modelos de base de dados e commits redigidos em inglês.

---

## 📄 Licença

Propriedade privada. Todos os direitos reservados.
