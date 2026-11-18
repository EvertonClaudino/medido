# Matriz de Permissões (RBAC) do Medido

Última atualização: 09/11/2026  
Estado: Aprovada

O Medido opera sob um modelo de **3 perfis de acesso** integrados numa arquitetura estritamente **multi-empresa (multi-tenant)**:
1. **Dono da empresa (`OWNER`)**: acesso total à empresa, utilizadores, obras, configurações e gestão global de tarefas.
2. **Encarregado (`FOREMAN`)**: gere o dia a dia das obras que lhe forem atribuídas, a sua equipa, validações e tarefas da sua alçada.
3. **Funcionário (`WORKER`)**: acesso limitado às suas próprias tarefas atribuídas e registos diários.

---

## 1. Matriz por Módulo e Operação

| Módulo / Funcionalidade | Dono (`OWNER`) | Encarregado (`FOREMAN`) | Funcionário (`WORKER`) | Regras de Negócio |
| :--- | :---: | :---: | :---: | :--- |
| **Definições da Empresa** | ✅ Total | ❌ Sem acesso | ❌ Sem acesso | Apenas o Dono pode alterar dados fiscais, nome e definições. |
| **Gestão de Utilizadores** | ✅ Total | ❌ Sem acesso | ❌ Sem acesso | Convidar, ativar, desativar e alterar perfis da equipa. |
| **Criar / Arquivar / Editar Obras** | ✅ Total | ❌ Sem acesso | ❌ Sem acesso | Criação, edição e encerramento de empreitadas da empresa. |
| **Ver Orçamentos de Obras** | ✅ Total | ❌ Sem acesso | ❌ Sem acesso | Valores monetários e margens são visíveis apenas ao Dono. |
| **Gerir Obras Atribuídas** | ✅ Total | ✅ Obras atribuídas | ❌ Sem acesso | Encarregado só vê e gere as obras onde estiver explicitamente alocado. |
| **Alocar Trabalhadores** | ✅ Total | ✅ Nas suas obras | ❌ Sem acesso | Encarregado distribui membros da equipa nas frentes de trabalho. |
| **Registo de Medições** | ✅ Aprovar | ✅ Registar e validar | ❌ Sem acesso | Encarregado submete medições; Dono tem visão consolidada. |
| **Registo de Trabalho Diário** | ✅ Total | ✅ Total | ✅ Apenas os seus | Apontamento de horas e medições com suporte a reenvio se rejeitado. |
| **Módulo de Clientes** | ✅ Total (Criar, Editar, Consultar, Interações, Visitas) | ❌ Sem acesso direto ao módulo (vê na obra) | ❌ Sem acesso | Apenas o Dono (`OWNER`) acede à listagem geral e cria/edita clientes. O Encarregado consulta os dados de contacto do cliente apenas nas obras que lhe estão atribuídas. |
| **Módulo de Tarefas: Criação** | ✅ Total (para qualquer ativo) | ✅ Apenas para WORKER das suas obras | ❌ Sem acesso | `OWNER` atribui a qualquer utilizador ativo (`FOREMAN` ou `WORKER`). `FOREMAN` só atribui a `WORKER` ativos das suas obras. `projectId` é opcional. |
| **Módulo de Tarefas: Visualização** | ✅ Vê todas da empresa | ✅ Apenas as atribuídas a si | ✅ Apenas as atribuídas a si | `FOREMAN` e `WORKER` têm acesso estritamente delimitado às suas tarefas atribuídas. |
| **Módulo de Tarefas: Transição de Estado** | ✅ Total (incluindo Cancelar) | ✅ Concluir / Reabrir as suas | ✅ Concluir / Reabrir as suas | O utilizador atribuído pode alternar entre `PENDING` e `COMPLETED`. Apenas o criador/OWNER pode colocar em `CANCELLED`. Transições a partir de `CANCELLED` são bloqueadas. |
| **Visitas Técnicas** | ✅ Total (marcar, agendar, reagendar, cancelar, atribuir responsável) | ✅ Consulta das visitas atribuídas a si (cliente, telefone, morada, hora) | ❌ Sem acesso | Só o Dono gere visitas. O responsável tem de ser Encarregado ou Dono ativo; o servidor recusa sobreposições na agenda do responsável. |
| **Acesso ao Dashboard** | Visão Executiva | Visão Operacional | Visão de Campo | Cada perfil tem layout e dados filtrados no servidor. |

---

## 2. Princípios de Segurança

1. **Validação no Servidor (`requireUser`)**: Nenhuma decisão de acesso é baseada apenas na interface do utilizador ou no token JWT desatualizado. Cada Server Action valida na base de dados o estado do utilizador (`status = ACTIVE`), o perfil (`role`) e a empresa (`companyId`).
2. **Isolamento de Tenant**: Nenhuma query pode ser executada sem filtrar por `companyId`. Não é possível aceder a recursos de outra organização.
3. **Imediatez**: Se um utilizador for desativado ou o seu perfil for alterado pelo Dono, o efeito é imediato no próximo pedido.
4. **Integridade de Estados**: Transições de tarefas obedecem à máquina de estados estrita (`PENDING` <-> `COMPLETED`, `PENDING` -> `CANCELLED`).
